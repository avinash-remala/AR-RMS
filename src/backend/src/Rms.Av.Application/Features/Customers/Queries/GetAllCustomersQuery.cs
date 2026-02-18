using AutoMapper;
using MediatR;
using Rms.Av.Application.DTOs;
using Rms.Av.Application.Interfaces;

namespace Rms.Av.Application.Features.Customers.Queries;

public record GetAllCustomersQuery : IRequest<IEnumerable<CustomerDto>>;

public class GetAllCustomersQueryHandler : IRequestHandler<GetAllCustomersQuery, IEnumerable<CustomerDto>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;

    public GetAllCustomersQueryHandler(IUnitOfWork unitOfWork, IMapper mapper)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
    }

    public async Task<IEnumerable<CustomerDto>> Handle(GetAllCustomersQuery request, CancellationToken cancellationToken)
    {
        var customers = await _unitOfWork.Customers
            .FindAsync(c => c.IsActive, cancellationToken);

        var customerList = customers.ToList();
        var customerIds = customerList.Select(c => c.Id).ToList();

        var orders = await _unitOfWork.Orders.FindAsync(o => customerIds.Contains(o.CustomerId), cancellationToken);
        var orderGroups = orders
            .GroupBy(o => o.CustomerId)
            .ToDictionary(
                g => g.Key,
                g => new
                {
                    Count = g.Count(),
                    LastOrderDate = g.Max(o => o.OrderDate)
                });

        var dtos = _mapper.Map<IEnumerable<CustomerDto>>(customerList.OrderBy(c => c.FirstName).ThenBy(c => c.LastName)).ToList();

        foreach (var dto in dtos)
        {
            if (orderGroups.TryGetValue(dto.Id, out var stats))
            {
                dto.TotalOrders = stats.Count;
                dto.DaysSinceLastOrder = (int)(DateTime.UtcNow.Date - stats.LastOrderDate.Date).TotalDays;
            }
            else
            {
                dto.TotalOrders = 0;
                dto.DaysSinceLastOrder = null;
            }
        }

        return dtos;
    }
}
