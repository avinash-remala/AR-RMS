using AutoMapper;
using MediatR;
using Rms.Av.Application.DTOs;
using Rms.Av.Application.Interfaces;

namespace Rms.Av.Application.Features.Customers.Queries;

public record GetCustomerByIdQuery(Guid Id) : IRequest<CustomerDto?>;

public class GetCustomerByIdQueryHandler : IRequestHandler<GetCustomerByIdQuery, CustomerDto?>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;

    public GetCustomerByIdQueryHandler(IUnitOfWork unitOfWork, IMapper mapper)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
    }

    public async Task<CustomerDto?> Handle(GetCustomerByIdQuery request, CancellationToken cancellationToken)
    {
        var customer = await _unitOfWork.Customers.GetByIdAsync(request.Id, cancellationToken);
        if (customer == null) return null;

        var dto = _mapper.Map<CustomerDto>(customer);

        var orders = await _unitOfWork.Orders.FindAsync(o => o.CustomerId == customer.Id, cancellationToken);
        if (orders.Any())
        {
            dto.TotalOrders = orders.Count();
            dto.DaysSinceLastOrder = (int)(DateTime.UtcNow.Date - orders.Max(o => o.OrderDate).Date).TotalDays;
        }
        else
        {
            dto.TotalOrders = 0;
            dto.DaysSinceLastOrder = null;
        }

        return dto;
    }
}
