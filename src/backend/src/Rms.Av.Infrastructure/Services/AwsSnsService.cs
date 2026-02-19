using Amazon;
using Amazon.SimpleNotificationService;
using Amazon.SimpleNotificationService.Model;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Rms.Av.Application.Interfaces;

namespace Rms.Av.Infrastructure.Services;

public class AwsSnsService : ISmsService
{
    private readonly IAmazonSimpleNotificationService _snsClient;
    private readonly ILogger<AwsSnsService> _logger;

    public AwsSnsService(IConfiguration configuration, ILogger<AwsSnsService> logger)
    {
        _logger = logger;
        
        var accessKey = configuration["AWS:AccessKey"];
        var secretKey = configuration["AWS:SecretKey"];
        var region = configuration["AWS:Region"] ?? "us-east-1";

        _snsClient = new AmazonSimpleNotificationServiceClient(
            accessKey,
            secretKey,
            RegionEndpoint.GetBySystemName(region)
        );
    }

    public async Task<bool> SendOtpAsync(string phoneNumber, string otp)
    {
        var message = $"Your RMS-AV verification code is: {otp}. Valid for 5 minutes. Do not share this code.";
        return await SendMessageAsync(phoneNumber, message);
    }

    public async Task<bool> SendMessageAsync(string phoneNumber, string message)
    {
        try
        {
            // Ensure phone number is in E.164 format (+1XXXXXXXXXX)
            if (!phoneNumber.StartsWith("+"))
            {
                phoneNumber = $"+1{phoneNumber}"; // Default to US
            }

            var request = new PublishRequest
            {
                PhoneNumber = phoneNumber,
                Message = message,
                MessageAttributes = new Dictionary<string, MessageAttributeValue>
                {
                    {
                        "AWS.SNS.SMS.SMSType",
                        new MessageAttributeValue 
                        { 
                            StringValue = "Transactional", // For OTP (higher priority)
                            DataType = "String" 
                        }
                    }
                }
            };

            var response = await _snsClient.PublishAsync(request);
            
            _logger.LogInformation("SMS sent successfully to {PhoneNumber}. MessageId: {MessageId}", 
                phoneNumber, response.MessageId);
            
            return response.HttpStatusCode == System.Net.HttpStatusCode.OK;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send SMS to {PhoneNumber}", phoneNumber);
            return false;
        }
    }
}
