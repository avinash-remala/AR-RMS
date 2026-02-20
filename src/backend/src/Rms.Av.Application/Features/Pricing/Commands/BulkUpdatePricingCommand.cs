using AutoMapper;
using MediatR;
using Rms.Av.Application.DTOs;
using Rms.Av.Application.Interfaces;

namespace Rms.Av.Application.Features.Pricing.Commands;

public record BulkUpdatePricingCommand(List<UpdatePricingDto> Pricings) : IRequest<IEnumerable<PricingDto>>;

public class BulkUpdatePricingCommandHandler : IRequestHandler<BulkUpdatePricingCommand, IEnumerable<PricingDto>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;

    public BulkUpdatePricingCommandHandler(IUnitOfWork unitOfWork, IMapper mapper)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
    }

    public async Task<IEnumerable<PricingDto>> Handle(BulkUpdatePricingCommand request, CancellationToken cancellationToken)
    {
        var allPricings = (await _unitOfWork.Pricings.GetAllAsync(cancellationToken)).ToList();
        var updatedPricings = new List<Domain.Entities.Pricing>();

        foreach (var updateDto in request.Pricings)
        {
            var pricing = allPricings.FirstOrDefault(p => p.BoxType == updateDto.BoxType);
            
            if (pricing != null)
            {
                pricing.Price = updateDto.Price;
                pricing.UpdatedAt = DateTime.UtcNow;
                updatedPricings.Add(pricing);
            }
        }

        if (updatedPricings.Any())
        {
            await _unitOfWork.SaveChangesAsync(cancellationToken);
        }

        return _mapper.Map<IEnumerable<PricingDto>>(updatedPricings);
    }
}
