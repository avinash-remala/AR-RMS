using AutoMapper;
using MediatR;
using Rms.Av.Application.DTOs;
using Rms.Av.Application.Interfaces;
using Rms.Av.Domain.Entities;

namespace Rms.Av.Application.Features.Orders.Queries;

public record GetOrdersByDateRangeQuery(DateTime? FromDate, DateTime? ToDate, string? BuildingNumber) : IRequest<IEnumerable<OrderDto>>;

public class GetOrdersByDateRangeQueryHandler : IRequestHandler<GetOrdersByDateRangeQuery, IEnumerable<OrderDto>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;

    public GetOrdersByDateRangeQueryHandler(IUnitOfWork unitOfWork, IMapper mapper)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
    }

    public async Task<IEnumerable<OrderDto>> Handle(GetOrdersByDateRangeQuery request, CancellationToken cancellationToken)
    {
        var orders = await _unitOfWork.Orders.GetOrdersByDateRangeAsync(
            request.FromDate, 
            request.ToDate, 
            request.BuildingNumber, 
            cancellationToken);

        // Gather menu and extra names for display
        var menuIds = orders.SelectMany(o => o.Items).Select(i => i.MenuItemId).Distinct().ToList();
        var extraIds = orders.SelectMany(o => o.Extras).Select(e => e.ExtraItemId).Distinct().ToList();
        var customerIds = orders.Select(o => o.CustomerId).Distinct().ToList();

        var menuMap = (await _unitOfWork.MenuItems.FindAsync(m => menuIds.Contains(m.Id), cancellationToken))
            .ToDictionary(m => m.Id, m => new { m.Name, m.Category });
        var extraMap = (await _unitOfWork.ExtraItems.FindAsync(e => extraIds.Contains(e.Id), cancellationToken))
            .ToDictionary(e => e.Id, e => e.Name);
        var customerMap = (await _unitOfWork.Customers.FindAsync(c => customerIds.Contains(c.Id), cancellationToken))
            .ToDictionary(c => c.Id, c => new { c.FirstName, c.LastName, c.Phone, c.CountryCode });

        var dtos = _mapper.Map<IEnumerable<OrderDto>>(orders).ToList();
        
        // Calculate day-wise serial numbers
        var ordersByDate = dtos.GroupBy(o => o.OrderDate.Date).ToDictionary(g => g.Key, g => g.OrderBy(o => o.CreatedAt).ToList());
        
        foreach (var dto in dtos)
        {
            // Set day serial number
            var ordersOnDay = ordersByDate[dto.OrderDate.Date];
            dto.DaySerialNumber = ordersOnDay.IndexOf(dto) + 1;
            
            // Set customer info
            if (customerMap.TryGetValue(dto.CustomerId, out var customer))
            {
                dto.CustomerFullName = $"{customer.FirstName} {customer.LastName}".Trim();
                dto.CustomerPhone = !string.IsNullOrEmpty(customer.Phone) 
                    ? $"+{customer.CountryCode}{customer.Phone}" 
                    : null;
            }
            
            // Determine meal type from menu items
            var hasVeg = false;
            var hasNonVeg = false;
            
            foreach (var item in dto.Items)
            {
                if (menuMap.TryGetValue(item.MenuItemId, out var menuItem))
                {
                    item.MenuItemName = menuItem.Name;
                    var category = menuItem.Category?.ToLower() ?? "";
                    if (category == "veg")
                    {
                        hasVeg = true;
                    }
                    else if (category == "nonveg" || category == "non-veg")
                    {
                        hasNonVeg = true;
                    }
                }
                else
                {
                    item.MenuItemName = "*Item Removed*";
                }
            }
            
            // Set meal type
            if (hasNonVeg && hasVeg)
                dto.MealType = "SPECIAL";
            else if (hasNonVeg)
                dto.MealType = "NON_VEG";
            else if (hasVeg)
                dto.MealType = "VEG";
            else
                dto.MealType = "SPECIAL";
            
            // Extract rice type from comments
            if (!string.IsNullOrEmpty(dto.Comments))
            {
                var parts = dto.Comments.Split('|', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
                // First part is usually rice type from migration
                if (parts.Length > 0 && parts[0].Contains("rice", StringComparison.OrdinalIgnoreCase))
                {
                    dto.RiceType = parts[0].Trim();
                }
            }

            foreach (var extra in dto.Extras)
            {
                if (extraMap.TryGetValue(extra.ExtraItemId, out var name))
                    extra.ExtraItemName = name;
            }
        }

        return dtos;
    }
}
