using Rms.Av.Domain.Common.Base;

namespace Rms.Av.Domain.Modules.Auth;

public class OtpCode : BaseEntity
{
    public string Phone { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public DateTime ExpiresAt { get; set; }
    public bool IsUsed { get; set; }
    public DateTime? UsedAt { get; set; }
}
