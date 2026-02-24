using AutoMapper;
using MediatR;
using Rms.Av.Application.DTOs;
using Rms.Av.Application.Interfaces;

namespace Rms.Av.Application.Features.Orders.Queries;

public record GetLastOrderByCustomerIdQuery(Guid CustomerId) : IRequest<OrderDto?>;

public class GetLastOrderByCustomerIdQueryHandler : IRequestHandler<GetLastOrderByCustomerIdQuery, OrderDto?>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;

    public GetLastOrderByCustomerIdQueryHandler(IUnitOfWork unitOfWork, IMapper mapper)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
    }

    public async Task<OrderDto?> Handle(GetLastOrderByCustomerIdQuery request, CancellationToken cancellationToken)
    {
        var order = await _unitOfWork.Orders.GetLastOrderByCustomerIdAsync(request.CustomerId, cancellationToken);
        if (order == null) return null;

        var dto = _mapper.Map<OrderDto>(order);

        var menuIds = order.Items.Select(i => i.MenuItemId).Distinct().ToList();
        var menuMap = (await _unitOfWork.MenuItems.FindAsync(m => menuIds.Contains(m.Id), cancellationToken))
            .ToDictionary(m => m.Id, m => m.Name);

        foreach (var item in dto.Items)
        {
            item.MenuItemName = menuMap.TryGetValue(item.MenuItemId, out var name)
                ? name
                : "*Item Removed*";
        }

        return dto;
    }
}
