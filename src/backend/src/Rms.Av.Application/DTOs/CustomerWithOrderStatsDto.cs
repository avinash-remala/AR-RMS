namespace Rms.Av.Application.DTOs;

public class CustomerWithOrderStatsDto
{
    public Guid Id { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string? Email { get; set; }
    public bool IsActive { get; set; }
    public int OrderCount { get; set; }
    public string? LastOrderDate { get; set; }
    public DateTime CreatedAt { get; set; }
}
