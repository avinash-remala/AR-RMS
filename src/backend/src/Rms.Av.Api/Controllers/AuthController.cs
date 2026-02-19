using Microsoft.AspNetCore.Mvc;
using Rms.Av.Application.Interfaces;
using Rms.Av.Application.Services;

namespace Rms.Av.Api.Controllers;

[ApiController]
[Route("api/v1/auth")]
public class AuthController : ControllerBase
{
    private readonly OtpService _otpService;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<AuthController> _logger;

    public AuthController(
        OtpService otpService, 
        IUnitOfWork unitOfWork,
        ILogger<AuthController> logger)
    {
        _otpService = otpService;
        _unitOfWork = unitOfWork;
        _logger = logger;
    }

    [HttpPost("send-otp")]
    public async Task<IActionResult> SendOtp([FromBody] SendOtpRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.PhoneNumber))
        {
            return BadRequest(new { message = "Phone number is required" });
        }

        var (success, message) = await _otpService.SendOtpAsync(request.PhoneNumber);
        
        if (!success)
        {
            return BadRequest(new { message });
        }

        return Ok(new { message });
    }

    [HttpPost("verify-otp")]
    public IActionResult VerifyOtp([FromBody] VerifyOtpRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.PhoneNumber) || string.IsNullOrWhiteSpace(request.Otp))
        {
            return BadRequest(new { message = "Phone number and OTP are required" });
        }

        var isValid = _otpService.ValidateOtp(request.PhoneNumber, request.Otp);
        
        if (!isValid)
        {
            return BadRequest(new { message = "Invalid or expired OTP" });
        }

        // Here you would typically:
        // 1. Find or create user by phone number
        // 2. Generate JWT token
        // 3. Return token to client

        return Ok(new { message = "OTP verified successfully" });
    }

    [HttpGet("otp-usage")]
    public async Task<IActionResult> GetOtpUsage([FromQuery] string? phoneNumber = null)
    {
        var allUsage = (await _unitOfWork.OtpUsages.GetAllAsync()).ToList();
        
        if (!string.IsNullOrWhiteSpace(phoneNumber))
        {
            var usage = allUsage.FirstOrDefault(u => u.PhoneNumber == phoneNumber);
            if (usage == null)
            {
                return NotFound(new { message = "No OTP usage found for this phone number" });
            }
            return Ok(usage);
        }

        // Return all usage, ordered by most recent
        var orderedUsage = allUsage
            .OrderByDescending(u => u.LastRequestedAt)
            .Select(u => new
            {
                u.PhoneNumber,
                u.RequestCount,
                u.FirstRequestedAt,
                u.LastRequestedAt,
                DaysSinceFirstRequest = (DateTime.UtcNow - u.FirstRequestedAt).Days,
                DaysSinceLastRequest = (DateTime.UtcNow - u.LastRequestedAt).Days
            })
            .ToList();

        var summary = new
        {
            TotalPhoneNumbers = allUsage.Count,
            TotalRequests = allUsage.Sum(u => u.RequestCount),
            UsageDetails = orderedUsage
        };

        return Ok(summary);
    }

    [HttpGet("top-users")]
    public async Task<IActionResult> GetTopOtpUsers([FromQuery] int limit = 10)
    {
        var allUsage = (await _unitOfWork.OtpUsages.GetAllAsync()).ToList();
        
        var topUsers = allUsage
            .OrderByDescending(u => u.RequestCount)
            .Take(limit)
            .Select(u => new
            {
                u.PhoneNumber,
                u.RequestCount,
                u.FirstRequestedAt,
                u.LastRequestedAt,
                DaysSinceFirstRequest = (DateTime.UtcNow - u.FirstRequestedAt).Days
            })
            .ToList();

        return Ok(topUsers);
    }
}

public record SendOtpRequest(string PhoneNumber);
public record VerifyOtpRequest(string PhoneNumber, string Otp);
