namespace Rms.Av.Application.DTOs;

public class PricingDto
{
    public Guid Id { get; set; }
    public string BoxType { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public bool IsActive { get; set; }
    public string? Description { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class UpdatePricingDto
{
    public string BoxType { get; set; } = string.Empty;
    public decimal Price { get; set; }
}

public class BulkUpdatePricingDto
{
    public List<UpdatePricingDto> Pricings { get; set; } = new();
}
