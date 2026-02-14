using Rms.Av.Domain.Common.Base;

namespace Rms.Av.Domain.Modules.Payments;

public class VendorPayment : AuditableEntity
{
    public Guid VendorId { get; set; }
    public decimal Amount { get; set; }
    public string Method { get; set; } = "CASH"; // CASH, CHECK, WIRE
    public DateTime PaidAt { get; set; }
    public string? Notes { get; set; }
}
