using MediatR;
using Rms.Av.Application.Interfaces;

namespace Rms.Av.Application.Features.Orders.Queries;

public record GetOrderSummaryQuery(DateTime? Date = null) : IRequest<OrderSummaryDto>;

public class OrderSummaryDto
{
    public int TotalBoxes { get; set; }
    public Dictionary<string, int> BoxesByType { get; set; } = new();
    public Dictionary<string, int> BoxesByAddress { get; set; } = new();
    public string? Date { get; set; }
    public string FormattedSummary { get; set; } = string.Empty;
}

public class GetOrderSummaryQueryHandler : IRequestHandler<GetOrderSummaryQuery, OrderSummaryDto>
{
    private readonly IUnitOfWork _unitOfWork;

    public GetOrderSummaryQueryHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<OrderSummaryDto> Handle(GetOrderSummaryQuery request, CancellationToken cancellationToken)
    {
        var orders = await _unitOfWork.Orders.GetOrdersAsync(request.Date, cancellationToken);

        // Calculate total boxes
        var totalBoxes = orders.Sum(o => o.Items.Sum(i => i.Quantity));

        // Get menu item names for display
        var menuIds = orders.SelectMany(o => o.Items).Select(i => i.MenuItemId).Distinct().ToList();
        var menuItems = await _unitOfWork.MenuItems.FindAsync(m => menuIds.Contains(m.Id), cancellationToken);
        var menuMap = menuItems.ToDictionary(m => m.Id, m => m.Name);

        // Group boxes by type
        var boxesByType = new Dictionary<string, int>();
        foreach (var order in orders)
        {
            foreach (var item in order.Items)
            {
                var menuName = menuMap.TryGetValue(item.MenuItemId, out var name) ? name : "Unknown";
                var key = $"{menuName}";
                
                if (boxesByType.ContainsKey(key))
                    boxesByType[key] += item.Quantity;
                else
                    boxesByType[key] = item.Quantity;
            }
        }

        // Group boxes by address/building
        var boxesByAddress = new Dictionary<string, int>();
        foreach (var order in orders)
        {
            var address = !string.IsNullOrEmpty(order.BuildingNumber) 
                ? $"Building {order.BuildingNumber}" 
                : "No Building Specified";
            var orderBoxes = order.Items.Sum(i => i.Quantity);
            
            if (boxesByAddress.ContainsKey(address))
                boxesByAddress[address] += orderBoxes;
            else
                boxesByAddress[address] = orderBoxes;
        }

        // Sort by count descending
        boxesByType = boxesByType.OrderByDescending(x => x.Value).ToDictionary(x => x.Key, x => x.Value);
        boxesByAddress = boxesByAddress.OrderByDescending(x => x.Value).ToDictionary(x => x.Key, x => x.Value);

        // Generate formatted text summary
        var summary = GenerateFormattedSummary(totalBoxes, boxesByType, boxesByAddress);

        return new OrderSummaryDto
        {
            TotalBoxes = totalBoxes,
            BoxesByType = boxesByType,
            BoxesByAddress = boxesByAddress,
            Date = request.Date?.ToString("yyyy-MM-dd"),
            FormattedSummary = summary
        };
    }

    private static string GenerateFormattedSummary(
        int totalBoxes,
        Dictionary<string, int> boxesByType,
        Dictionary<string, int> boxesByAddress)
    {
        var lines = new List<string>();
        
        lines.Add($"TOTAL BOXES: {totalBoxes}");
        lines.Add("");
        lines.Add("Boxes (count by type)");
        
        foreach (var (type, count) in boxesByType)
        {
            lines.Add($"• {type}: {count}");
        }
        
        lines.Add("");
        lines.Add("Buildings (total boxes per building)");
        
        foreach (var (address, count) in boxesByAddress)
        {
            lines.Add($"• {address}: {count} boxes");
        }

        return string.Join("\n", lines);
    }
}
