using Rms.Av.Domain.Common.Base;

namespace Rms.Av.Domain.Entities;

public class ExtraItem : AuditableEntity
{
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public bool IsAvailable { get; set; } = true;
}
