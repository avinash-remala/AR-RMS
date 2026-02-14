using AutoMapper;
using MediatR;
using Rms.Av.Application.DTOs;
using Rms.Av.Application.Interfaces;

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
            .ToDictionary(m => m.Id, m => m.Name);
        var extraMap = (await _unitOfWork.ExtraItems.FindAsync(e => extraIds.Contains(e.Id), cancellationToken))
            .ToDictionary(e => e.Id, e => e.Name);

        foreach (var item in dto.Items)
        {
            if (menuMap.TryGetValue(item.MenuItemId, out var name))
                item.MenuItemName = name;
        }

        foreach (var extra in dto.Extras)
        {
            if (extraMap.TryGetValue(extra.ExtraItemId, out var name))
                extra.ExtraItemName = name;
        }

        return dto;
    }
}
