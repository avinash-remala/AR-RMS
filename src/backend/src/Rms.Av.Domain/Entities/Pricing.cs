using Rms.Av.Domain.Common.Base;

namespace Rms.Av.Domain.Entities;

public class Pricing : AuditableEntity
{
    public string BoxType { get; set; } = string.Empty; // "veg_comfort", "nonveg_comfort", "veg_special", "nonveg_special"
    public string DisplayName { get; set; } = string.Empty; // "Veg Comfort Box", "Non-Veg Comfort Box", etc.
    public decimal Price { get; set; }
    public bool IsActive { get; set; } = true;
    public string? Description { get; set; }
}
