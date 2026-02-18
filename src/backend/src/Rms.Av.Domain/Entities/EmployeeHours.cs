using Rms.Av.Domain.Common.Base;

namespace Rms.Av.Domain.Entities;

public class EmployeeHours : AuditableEntity
{
    public Guid EmployeeId { get; set; }
    public DateTime WorkDate { get; set; }
    public decimal Hours { get; set; }
    public decimal Rate { get; set; }
    public string? Notes { get; set; }
}
