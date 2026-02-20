namespace Rms.Av.Application.DTOs;

public record DashboardStatisticsDto
{
    public OrderStatisticsDto Orders { get; set; } = new();
    public RevenueStatisticsDto Revenue { get; set; } = new();
    public List<TopSellingItemDto> TopSellingItems { get; set; } = new();
    public List<RecentOrderDto> RecentOrders { get; set; } = new();
}

public record OrderStatisticsDto
{
    public int TodayCount { get; set; }
    public int YesterdayCount { get; set; }
    public int ThisWeekCount { get; set; }
    public int ThisMonthCount { get; set; }
    public int TotalBoxesToday { get; set; }
    public double PercentageChangeFromYesterday { get; set; }
}

public record RevenueStatisticsDto
{
    public decimal Today { get; set; }
    public decimal Yesterday { get; set; }
    public decimal ThisWeek { get; set; }
    public decimal ThisMonth { get; set; }
    public decimal AllTime { get; set; }
    public double PercentageChangeFromYesterday { get; set; }
}

public record TopSellingItemDto
{
    public string MenuItemName { get; set; } = string.Empty;
    public int TotalQuantity { get; set; }
    public int OrderCount { get; set; }
    public decimal Revenue { get; set; }
}

public record RecentOrderDto
{
    public Guid Id { get; set; }
    public string OrderNumber { get; set; } = string.Empty;
    public string CustomerName { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public decimal TotalAmount { get; set; }
    public int ItemCount { get; set; }
    public DateTime OrderDate { get; set; }
    public string TimeAgo { get; set; } = string.Empty;
}
