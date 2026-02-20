using MediatR;
using Rms.Av.Application.DTOs;
using Rms.Av.Application.Interfaces;
using Rms.Av.Domain.Entities;

namespace Rms.Av.Application.Features.Dashboard.Queries;

public record GetDashboardStatisticsQuery : IRequest<DashboardStatisticsDto>;

public class GetDashboardStatisticsQueryHandler : IRequestHandler<GetDashboardStatisticsQuery, DashboardStatisticsDto>
{
    private readonly IUnitOfWork _unitOfWork;

    public GetDashboardStatisticsQueryHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<DashboardStatisticsDto> Handle(GetDashboardStatisticsQuery request, CancellationToken cancellationToken)
    {
        var now = DateTime.UtcNow.Date;
        var yesterday = now.AddDays(-1);
        var startOfWeek = now.AddDays(-(int)now.DayOfWeek);
        var startOfMonth = new DateTime(now.Year, now.Month, 1);

        // Get all orders (we'll filter in memory for simplicity)
        var allOrders = await _unitOfWork.Orders.GetAllAsync();
        var ordersList = allOrders.ToList();

        // Order Statistics
        var todayOrders = ordersList.Where(o => o.OrderDate.Date == now).ToList();
        var yesterdayOrders = ordersList.Where(o => o.OrderDate.Date == yesterday).ToList();
        var weekOrders = ordersList.Where(o => o.OrderDate.Date >= startOfWeek).ToList();
        var monthOrders = ordersList.Where(o => o.OrderDate.Date >= startOfMonth).ToList();

        var totalBoxesToday = todayOrders.Sum(o => o.Items?.Sum(i => i.Quantity) ?? 0);
        var totalBoxesYesterday = yesterdayOrders.Sum(o => o.Items?.Sum(i => i.Quantity) ?? 0);

        var orderPercentageChange = totalBoxesYesterday > 0
            ? ((totalBoxesToday - totalBoxesYesterday) / (double)totalBoxesYesterday) * 100
            : 0;

        var orderStats = new OrderStatisticsDto
        {
            TodayCount = todayOrders.Count,
            YesterdayCount = yesterdayOrders.Count,
            ThisWeekCount = weekOrders.Count,
            ThisMonthCount = monthOrders.Count,
            TotalBoxesToday = totalBoxesToday,
            PercentageChangeFromYesterday = Math.Round(orderPercentageChange, 1)
        };

        // Revenue Statistics
        var todayRevenue = todayOrders.Sum(o => o.TotalAmount);
        var yesterdayRevenue = yesterdayOrders.Sum(o => o.TotalAmount);
        var weekRevenue = weekOrders.Sum(o => o.TotalAmount);
        var monthRevenue = monthOrders.Sum(o => o.TotalAmount);
        var allTimeRevenue = ordersList.Sum(o => o.TotalAmount);

        var revenuePercentageChange = yesterdayRevenue > 0
            ? ((double)(todayRevenue - yesterdayRevenue) / (double)yesterdayRevenue) * 100
            : 0;

        var revenueStats = new RevenueStatisticsDto
        {
            Today = todayRevenue,
            Yesterday = yesterdayRevenue,
            ThisWeek = weekRevenue,
            ThisMonth = monthRevenue,
            AllTime = allTimeRevenue,
            PercentageChangeFromYesterday = Math.Round(revenuePercentageChange, 1)
        };

        // Top Selling Items (this month)
        var monthOrderItems = monthOrders
            .SelectMany(o => o.Items ?? new List<OrderItem>())
            .ToList();

        // Load menu items to get names
        var menuItemIds = monthOrderItems.Select(i => i.MenuItemId).Distinct().ToList();
        var menuItems = new Dictionary<Guid, string>();
        foreach (var id in menuItemIds)
        {
            var menuItem = await _unitOfWork.MenuItems.GetByIdAsync(id);
            if (menuItem != null)
            {
                menuItems[id] = menuItem.Name;
            }
        }

        var topSellingItems = monthOrderItems
            .GroupBy(i => i.MenuItemId)
            .Select(g => new TopSellingItemDto
            {
                MenuItemName = menuItems.ContainsKey(g.Key) ? menuItems[g.Key] : "Unknown",
                TotalQuantity = g.Sum(i => i.Quantity),
                OrderCount = g.Count(),
                Revenue = g.Sum(i => i.Price * i.Quantity)
            })
            .OrderByDescending(i => i.TotalQuantity)
            .Take(5)
            .ToList();

        // Recent Orders (last 10)
        var recentOrders = ordersList
            .OrderByDescending(o => o.OrderDate)
            .Take(10)
            .ToList();

        // Load customers for recent orders
        var customerIds = recentOrders.Select(o => o.CustomerId).Distinct().ToList();
        var customers = new Dictionary<Guid, Customer>();
        foreach (var id in customerIds)
        {
            var customer = await _unitOfWork.Customers.GetByIdAsync(id);
            if (customer != null)
            {
                customers[id] = customer;
            }
        }

        var recentOrderDtos = recentOrders.Select(o =>
        {
            var timeDiff = DateTime.UtcNow - o.OrderDate;
            var timeAgo = timeDiff.TotalMinutes < 60
                ? $"{(int)timeDiff.TotalMinutes}m ago"
                : timeDiff.TotalHours < 24
                    ? $"{(int)timeDiff.TotalHours}h ago"
                    : $"{(int)timeDiff.TotalDays}d ago";

            var customer = customers.ContainsKey(o.CustomerId) ? customers[o.CustomerId] : null;
            var customerName = customer != null
                ? $"{customer.FirstName} {customer.LastName}".Trim()
                : "Unknown";

            return new RecentOrderDto
            {
                Id = o.Id,
                OrderNumber = o.OrderNumber,
                CustomerName = customerName,
                Status = o.Status.ToString(),
                TotalAmount = o.TotalAmount,
                ItemCount = o.Items?.Sum(i => i.Quantity) ?? 0,
                OrderDate = o.OrderDate,
                TimeAgo = timeAgo
            };
        }).ToList();

        return new DashboardStatisticsDto
        {
            Orders = orderStats,
            Revenue = revenueStats,
            TopSellingItems = topSellingItems,
            RecentOrders = recentOrderDtos
        };
    }
}
