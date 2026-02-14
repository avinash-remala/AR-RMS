using Rms.Av.Domain.Common.Base;

namespace Rms.Av.Domain.Modules.Menu;

public class MenuItem : AuditableEntity
{
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public string? ImageUrl { get; set; }
    public bool IsAvailable { get; set; } = true;
    public string Category { get; set; } = string.Empty; // "VEG", "NON-VEG", etc.
}
