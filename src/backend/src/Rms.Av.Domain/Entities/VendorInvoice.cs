using Rms.Av.Domain.Common.Base;

namespace Rms.Av.Domain.Entities;

public class VendorInvoice : AuditableEntity
{
    public Guid VendorId { get; set; }
    public decimal Amount { get; set; }
    public string FileUrl { get; set; } = string.Empty;
    public string? Notes { get; set; }
    public InvoiceStatus Status { get; set; } = InvoiceStatus.Pending;
    public DateTime? ApprovedAt { get; set; }
    public string? ApprovedBy { get; set; }
}

public enum InvoiceStatus
{
    Pending = 1,
    Approved = 2,
    Rejected = 3
}
