using AutoMapper;
using MediatR;
using Rms.Av.Application.DTOs;
using Rms.Av.Application.Interfaces;

namespace Rms.Av.Application.Features.Customers.Queries;

public record SearchCustomersQuery(string SearchTerm) : IRequest<IEnumerable<CustomerDto>>;

public class SearchCustomersQueryHandler : IRequestHandler<SearchCustomersQuery, IEnumerable<CustomerDto>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;

    public SearchCustomersQueryHandler(IUnitOfWork unitOfWork, IMapper mapper)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
    }

    public async Task<IEnumerable<CustomerDto>> Handle(SearchCustomersQuery request, CancellationToken cancellationToken)
    {
        var searchTerm = request.SearchTerm.ToLower().Trim();

        var customers = await _unitOfWork.Customers.FindAsync(
            c => c.IsActive && (
                c.FirstName.ToLower().Contains(searchTerm) ||
                c.LastName.ToLower().Contains(searchTerm) ||
                c.Phone.Contains(searchTerm)
            ),
            cancellationToken
        );

        return _mapper.Map<IEnumerable<CustomerDto>>(customers.OrderBy(c => c.FirstName).ThenBy(c => c.LastName));
    }
}
