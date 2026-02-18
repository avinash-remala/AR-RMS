namespace Rms.Av.Application.DTOs;

public class OrderDto
{
    public Guid Id { get; set; }
    public string OrderNumber { get; set; } = string.Empty;
    public Guid CustomerId { get; set; }
    public string BuildingNumber { get; set; } = string.Empty;
    public string? Comments { get; set; }
    public string Status { get; set; } = string.Empty;
    public decimal TotalAmount { get; set; }
    public DateTime OrderDate { get; set; }
    public List<OrderItemDto> Items { get; set; } = new();
    public List<OrderExtraDto> Extras { get; set; } = new();
    public DateTime CreatedAt { get; set; }
}

public class OrderItemDto
{
    public Guid MenuItemId { get; set; }
    public string MenuItemName { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public decimal Price { get; set; }
}

public class OrderExtraDto
{
    public Guid ExtraItemId { get; set; }
    public string ExtraItemName { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public decimal Price { get; set; }
}

public class CreateOrderDto
{
    public Guid CustomerId { get; set; }
    public string BuildingNumber { get; set; } = string.Empty;
    public string? Comments { get; set; }
    public List<CreateOrderItemDto> Items { get; set; } = new();
    public List<CreateOrderExtraDto> Extras { get; set; } = new();
}

public class CreateOrderItemDto
{
    public Guid MenuItemId { get; set; }
    public int Quantity { get; set; }
}

public class CreateOrderExtraDto
{
    public Guid ExtraItemId { get; set; }
    public int Quantity { get; set; }
}
