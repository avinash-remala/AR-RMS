using AutoMapper;
using MediatR;
using Rms.Av.Application.DTOs;
using Rms.Av.Application.Interfaces;

namespace Rms.Av.Application.Features.Customers.Queries;

public record GetCustomersWithOrderStatsQuery : IRequest<IEnumerable<CustomerWithOrderStatsDto>>;

public class GetCustomersWithOrderStatsQueryHandler : IRequestHandler<GetCustomersWithOrderStatsQuery, IEnumerable<CustomerWithOrderStatsDto>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;

    public GetCustomersWithOrderStatsQueryHandler(IUnitOfWork unitOfWork, IMapper mapper)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
    }

    public async Task<IEnumerable<CustomerWithOrderStatsDto>> Handle(GetCustomersWithOrderStatsQuery request, CancellationToken cancellationToken)
    {
        // Get all customers
        var customers = await _unitOfWork.Customers
            .FindAsync(c => true, cancellationToken);

        var customerList = customers.ToList();
        var customerIds = customerList.Select(c => c.Id).ToList();

        // Get all orders grouped by customer
        var orders = await _unitOfWork.Orders.FindAsync(o => customerIds.Contains(o.CustomerId), cancellationToken);
        var orderStats = orders
            .GroupBy(o => o.CustomerId)
            .ToDictionary(
                g => g.Key,
                g => new
                {
                    Count = g.Count(),
                    LastOrderDate = g.Max(o => o.OrderDate)
                });

        // Map customers to DTOs with order statistics
        var dtos = customerList.Select(c => new
        {
            Customer = c,
            OrderCount = orderStats.TryGetValue(c.Id, out var stats) ? stats.Count : 0,
            LastOrderDateRaw = orderStats.TryGetValue(c.Id, out var lastOrder) ? (DateTime?)lastOrder.LastOrderDate : null
        })
        .OrderByDescending(x => x.OrderCount)
        .ThenByDescending(x => x.LastOrderDateRaw)
        .Select(x => new CustomerWithOrderStatsDto
        {
            Id = x.Customer.Id,
            FirstName = x.Customer.FirstName,
            LastName = x.Customer.LastName,
            Phone = !string.IsNullOrEmpty(x.Customer.CountryCode) ? $"+{x.Customer.CountryCode}{x.Customer.Phone}" : x.Customer.Phone,
            Email = x.Customer.Email,
            IsActive = x.Customer.IsActive,
            CreatedAt = x.Customer.CreatedAt,
            OrderCount = x.OrderCount,
            LastOrderDate = x.LastOrderDateRaw.HasValue ? FormatDate(x.LastOrderDateRaw.Value) : null
        })
        .ToList();

        return dtos;
    }

    private static string FormatDate(DateTime date)
    {
        var day = date.Day;
        var suffix = day switch
        {
            1 or 21 or 31 => "st",
            2 or 22 => "nd",
            3 or 23 => "rd",
            _ => "th"
        };

        return date.ToString($"MMM {day}'{suffix}' yyyy");
    }
}
