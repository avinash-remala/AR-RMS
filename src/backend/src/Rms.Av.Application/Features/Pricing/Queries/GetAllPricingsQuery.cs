using AutoMapper;
using MediatR;
using Rms.Av.Application.DTOs;
using Rms.Av.Application.Interfaces;

namespace Rms.Av.Application.Features.Pricing.Queries;

public record GetAllPricingsQuery : IRequest<IEnumerable<PricingDto>>;

public class GetAllPricingsQueryHandler : IRequestHandler<GetAllPricingsQuery, IEnumerable<PricingDto>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;

    public GetAllPricingsQueryHandler(IUnitOfWork unitOfWork, IMapper mapper)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
    }

    public async Task<IEnumerable<PricingDto>> Handle(GetAllPricingsQuery request, CancellationToken cancellationToken)
    {
        var pricings = await _unitOfWork.Pricings.GetAllAsync(cancellationToken);
        return _mapper.Map<IEnumerable<PricingDto>>(pricings);
    }
}
