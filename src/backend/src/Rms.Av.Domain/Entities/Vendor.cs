using Rms.Av.Domain.Common.Base;

namespace Rms.Av.Domain.Entities;

public class Vendor : AuditableEntity
{
    public string Name { get; set; } = string.Empty;
    public string ContactPerson { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string? Email { get; set; }
    public bool IsActive { get; set; } = true;
}
