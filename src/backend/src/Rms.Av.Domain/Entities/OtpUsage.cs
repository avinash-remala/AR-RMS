using Rms.Av.Domain.Common.Base;

namespace Rms.Av.Domain.Entities;

public class OtpUsage : BaseEntity
{
    public string PhoneNumber { get; set; } = string.Empty;
    public int RequestCount { get; set; }
    public DateTime FirstRequestedAt { get; set; }
    public DateTime LastRequestedAt { get; set; }
}
