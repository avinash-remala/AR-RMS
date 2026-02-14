using Rms.Av.Domain.Common.Base;

namespace Rms.Av.Domain.Modules.Orders;

public class Order : AuditableEntity
{
    public string OrderNumber { get; set; } = string.Empty;
    public Guid CompanyId { get; set; }
    public DateTime DeliveryDate { get; set; }
    public string DeliveryAddress { get; set; } = string.Empty;
    public int VegCount { get; set; }
    public int NonVegCount { get; set; }
    public string RiceType { get; set; } = "Regular";
    public OrderStatus Status { get; set; } = OrderStatus.Pending;
    public decimal TotalAmount { get; set; }
    public string? SpecialInstructions { get; set; }
}

public enum OrderStatus
{
    Pending = 1,
    Confirmed = 2,
    InPreparation = 3,
    ReadyForDelivery = 4,
    OutForDelivery = 5,
    Delivered = 6,
    Cancelled = 7
}
