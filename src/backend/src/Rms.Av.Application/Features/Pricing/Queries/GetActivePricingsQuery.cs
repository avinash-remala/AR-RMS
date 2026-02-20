using AutoMapper;
using MediatR;
using Rms.Av.Application.DTOs;
using Rms.Av.Application.Interfaces;

namespace Rms.Av.Application.Features.Pricing.Queries;

public record GetActivePricingsQuery : IRequest<IEnumerable<PricingDto>>;

public class GetActivePricingsQueryHandler : IRequestHandler<GetActivePricingsQuery, IEnumerable<PricingDto>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;

    public GetActivePricingsQueryHandler(IUnitOfWork unitOfWork, IMapper mapper)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
    }

    public async Task<IEnumerable<PricingDto>> Handle(GetActivePricingsQuery request, CancellationToken cancellationToken)
    {
        var pricings = await _unitOfWork.Pricings.FindAsync(p => p.IsActive, cancellationToken);
        return _mapper.Map<IEnumerable<PricingDto>>(pricings);
    }
}
