using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Configuration;
using Rms.Av.Application.Interfaces;
using Rms.Av.Domain.Entities;

namespace Rms.Av.Application.Services;

public class OtpService
{
    private readonly ISmsService _smsService;
    private readonly IMemoryCache _cache;
    private readonly IUnitOfWork _unitOfWork;
    private readonly int _otpExpiryMinutes;
    private readonly int _otpLength;

    public OtpService(
        ISmsService smsService, 
        IMemoryCache cache,
        IUnitOfWork unitOfWork,
        IConfiguration configuration)
    {
        _smsService = smsService;
        _cache = cache;
        _unitOfWork = unitOfWork;
        _otpExpiryMinutes = configuration.GetValue<int>("OTP:ExpiryMinutes", 5);
        _otpLength = configuration.GetValue<int>("OTP:Length", 6);
    }

    public async Task<(bool Success, string Message)> SendOtpAsync(string phoneNumber)
    {
        // Rate limiting: prevent sending OTP too frequently
        var rateLimitKey = $"otp_rate_{phoneNumber}";
        if (_cache.TryGetValue(rateLimitKey, out _))
        {
            return (false, "Please wait 60 seconds before requesting another OTP");
        }

        // Generate OTP
        var otp = GenerateOtp();
        
        // Store OTP in cache
        var cacheKey = $"otp_{phoneNumber}";
        _cache.Set(cacheKey, otp, TimeSpan.FromMinutes(_otpExpiryMinutes));
        
        // Set rate limit (1 minute)
        _cache.Set(rateLimitKey, true, TimeSpan.FromSeconds(60));

        // Send SMS
        var sent = await _smsService.SendOtpAsync(phoneNumber, otp);
        
        if (!sent)
        {
            _cache.Remove(cacheKey);
            return (false, "Failed to send OTP. Please try again.");
        }

        // Track OTP usage in database
        await TrackOtpUsageAsync(phoneNumber);

        return (true, "OTP sent successfully");
    }

    public bool ValidateOtp(string phoneNumber, string otp)
    {
        var cacheKey = $"otp_{phoneNumber}";
        
        if (!_cache.TryGetValue(cacheKey, out string? storedOtp))
        {
            return false; // OTP expired or not found
        }

        if (storedOtp != otp)
        {
            return false; // Invalid OTP
        }

        // Remove OTP after successful validation (one-time use)
        _cache.Remove(cacheKey);
        return true;
    }

    private string GenerateOtp()
    {
        var random = new Random();
        var min = (int)Math.Pow(10, _otpLength - 1);
        var max = (int)Math.Pow(10, _otpLength) - 1;
        return random.Next(min, max).ToString();
    }

    private async Task TrackOtpUsageAsync(string phoneNumber)
    {
        try
        {
            // Find existing usage record
            var existingUsage = await _unitOfWork.OtpUsages
                .FirstOrDefaultAsync(u => u.PhoneNumber == phoneNumber);

            if (existingUsage != null)
            {
                // Update existing record
                existingUsage.RequestCount++;
                existingUsage.LastRequestedAt = DateTime.UtcNow;
                await _unitOfWork.SaveChangesAsync();
            }
            else
            {
                // Create new record
                var newUsage = new OtpUsage
                {
                    PhoneNumber = phoneNumber,
                    RequestCount = 1,
                    FirstRequestedAt = DateTime.UtcNow,
                    LastRequestedAt = DateTime.UtcNow
                };
                await _unitOfWork.OtpUsages.AddAsync(newUsage);
                await _unitOfWork.SaveChangesAsync();
            }
        }
        catch
        {
            // Don't fail OTP sending if tracking fails
            // This is a non-critical operation
        }
    }
}
