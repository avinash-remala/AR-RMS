using AutoMapper;
using MediatR;
using Rms.Av.Application.DTOs;
using Rms.Av.Application.Interfaces;
using Rms.Av.Domain.Entities;

namespace Rms.Av.Application.Features.Orders.Queries;

public record GetOrderByIdQuery(Guid Id) : IRequest<OrderDto?>;

public class GetOrderByIdQueryHandler : IRequestHandler<GetOrderByIdQuery, OrderDto?>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;

    public GetOrderByIdQueryHandler(IUnitOfWork unitOfWork, IMapper mapper)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
    }

    public async Task<OrderDto?> Handle(GetOrderByIdQuery request, CancellationToken cancellationToken)
    {
        var order = await _unitOfWork.Orders.GetOrderWithDetailsAsync(request.Id, cancellationToken);
        if (order == null) return null;

        var dto = _mapper.Map<OrderDto>(order);

        var menuIds = order.Items.Select(i => i.MenuItemId).Distinct().ToList();
        var extraIds = order.Extras.Select(e => e.ExtraItemId).Distinct().ToList();

        var menuMap = (await _unitOfWork.MenuItems.FindAsync(m => menuIds.Contains(m.Id), cancellationToken))
            .ToDictionary(m => m.Id, m => new { m.Name, m.Category });
        var extraMap = (await _unitOfWork.ExtraItems.FindAsync(e => extraIds.Contains(e.Id), cancellationToken))
            .ToDictionary(e => e.Id, e => e.Name);

        // Get customer info
        var customer = await _unitOfWork.Customers.GetByIdAsync(order.CustomerId, cancellationToken);
        if (customer != null)
        {
            dto.CustomerFullName = $"{customer.FirstName} {customer.LastName}".Trim();
            dto.CustomerPhone = !string.IsNullOrEmpty(customer.Phone) 
                ? $"+{customer.CountryCode}{customer.Phone}" 
                : null;
        }

        // Determine meal type
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
            if (parts.Length > 0 && parts[0].Contains("rice", StringComparison.OrdinalIgnoreCase))
            {
                dto.RiceType = parts[0].Trim();
            }
        }

        // Day serial number doesn't make sense for single order, set to 0
        dto.DaySerialNumber = 0;

        foreach (var extra in dto.Extras)
        {
            if (extraMap.TryGetValue(extra.ExtraItemId, out var name))
                extra.ExtraItemName = name;
        }

        return dto;
    }
}
