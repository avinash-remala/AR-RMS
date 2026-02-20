using MediatR;
using Rms.Av.Application.Interfaces;
using Rms.Av.Application.Services;

namespace Rms.Av.Application.Features.Pdf.Queries;

public record GenerateOrderStickersQuery(DateTime Date) : IRequest<byte[]>;

public class GenerateOrderStickersQueryHandler : IRequestHandler<GenerateOrderStickersQuery, byte[]>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IPdfGeneratorService _pdfGenerator;

    public GenerateOrderStickersQueryHandler(IUnitOfWork unitOfWork, IPdfGeneratorService pdfGenerator)
    {
        _unitOfWork = unitOfWork;
        _pdfGenerator = pdfGenerator;
    }

    public async Task<byte[]> Handle(GenerateOrderStickersQuery request, CancellationToken cancellationToken)
    {
        // Get orders for the specified date
        var orders = await _unitOfWork.Orders.GetOrdersAsync(request.Date, cancellationToken);
        var ordersList = orders.ToList();

        if (!ordersList.Any())
        {
            throw new InvalidOperationException($"No orders found for date {request.Date:yyyy-MM-dd}");
        }

        // Load menu item names for each order item
        var menuItemIds = ordersList
            .SelectMany(o => o.Items)
            .Select(i => i.MenuItemId)
            .Distinct()
            .ToList();

        var menuItems = await _unitOfWork.MenuItems.FindAsync(
            m => menuItemIds.Contains(m.Id), 
            cancellationToken);
        
        var menuItemDict = menuItems.ToDictionary(m => m.Id);

        // Load customer names
        var customerIds = ordersList.Select(o => o.CustomerId).Distinct().ToList();
        var customers = await _unitOfWork.Customers.FindAsync(
            c => customerIds.Contains(c.Id),
            cancellationToken);
        
        var customerDict = customers.ToDictionary(c => c.Id);

        // Create sticker data for each order item
        var stickers = new List<OrderStickerData>();
        
        foreach (var order in ordersList)
        {
            var customerName = customerDict.TryGetValue(order.CustomerId, out var customer)
                ? $"{customer.FirstName} {customer.LastName}".Trim()
                : "Unknown Customer";

            foreach (var item in order.Items)
            {
                var menuItemName = menuItemDict.TryGetValue(item.MenuItemId, out var menuItem)
                    ? menuItem.Name
                    : "Unknown Item";

                // Create one sticker for each quantity
                for (int i = 1; i <= item.Quantity; i++)
                {
                    stickers.Add(new OrderStickerData
                    {
                        OrderNumber = order.OrderNumber,
                        OrderDate = order.OrderDate,
                        CustomerName = customerName,
                        BuildingNumber = order.BuildingNumber ?? "N/A",
                        MenuItemName = menuItemName,
                        Quantity = item.Quantity,
                        StickerNumber = i,
                        Comments = order.Comments,
                        Status = order.Status.ToString()
                    });
                }
            }
        }

        return _pdfGenerator.GenerateOrderStickers(stickers);
    }
}
