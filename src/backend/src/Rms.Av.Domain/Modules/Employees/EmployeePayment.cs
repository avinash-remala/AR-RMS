using Rms.Av.Domain.Common.Base;

namespace Rms.Av.Domain.Modules.Employees;

public class EmployeePayment : AuditableEntity
{
    public Guid EmployeeId { get; set; }
    public decimal Amount { get; set; }
    public string Method { get; set; } = "CASH";
    public DateTime PaidAt { get; set; }
    public string? Notes { get; set; }
}
