using AutoMapper;
using MediatR;
using Rms.Av.Application.DTOs;
using Rms.Av.Application.Interfaces;
using Rms.Av.Domain.Entities;

namespace Rms.Av.Application.Features.Orders.Queries;

public record GetOrdersQuery(DateTime? Date) : IRequest<IEnumerable<OrderDto>>;

public class GetOrdersQueryHandler : IRequestHandler<GetOrdersQuery, IEnumerable<OrderDto>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;

    public GetOrdersQueryHandler(IUnitOfWork unitOfWork, IMapper mapper)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
    }

    public async Task<IEnumerable<OrderDto>> Handle(GetOrdersQuery request, CancellationToken cancellationToken)
    {
        var orders = await _unitOfWork.Orders.GetOrdersAsync(request.Date, cancellationToken);

        // Gather menu and extra names for display
        var menuIds = orders.SelectMany(o => o.Items).Select(i => i.MenuItemId).Distinct().ToList();
        var extraIds = orders.SelectMany(o => o.Extras).Select(e => e.ExtraItemId).Distinct().ToList();

        var menuMap = (await _unitOfWork.MenuItems.FindAsync(m => menuIds.Contains(m.Id), cancellationToken))
            .ToDictionary(m => m.Id, m => m.Name);
        var extraMap = (await _unitOfWork.ExtraItems.FindAsync(e => extraIds.Contains(e.Id), cancellationToken))
            .ToDictionary(e => e.Id, e => e.Name);

        var dtos = _mapper.Map<IEnumerable<OrderDto>>(orders);
        foreach (var dto in dtos)
        {
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
        }

        return dtos;
    }
}
