using System.ComponentModel.DataAnnotations;
using Rms.Av.Domain.Common.Base;

namespace Rms.Av.Domain.Entities;

public class Order : AuditableEntity
{
    public string OrderNumber { get; set; } = string.Empty;
    [Required]
    public Guid CustomerId { get; set; }
    public string BuildingNumber { get; set; } = string.Empty;
    public string? Comments { get; set; }
    public OrderStatus Status { get; set; } = OrderStatus.Pending;
    public decimal TotalAmount { get; set; }
    public DateTime OrderDate { get; set; } = DateTime.UtcNow;
    public List<OrderItem> Items { get; set; } = new();
    public List<OrderExtra> Extras { get; set; } = new();
}

public class OrderItem : BaseEntity
{
    public Guid OrderId { get; set; }
    public Guid MenuItemId { get; set; }
    public int Quantity { get; set; }
    public decimal Price { get; set; }
}

public class OrderExtra : BaseEntity
{
    public Guid OrderId { get; set; }
    public Guid ExtraItemId { get; set; }
    public int Quantity { get; set; }
    public decimal Price { get; set; }
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
