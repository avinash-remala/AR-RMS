using AutoMapper;
using MediatR;
using Rms.Av.Application.DTOs;
using Rms.Av.Application.Interfaces;

namespace Rms.Av.Application.Features.Pricing.Commands;

public record UpdatePricingCommand(string BoxType, decimal Price) : IRequest<PricingDto>;

public class UpdatePricingCommandHandler : IRequestHandler<UpdatePricingCommand, PricingDto>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;

    public UpdatePricingCommandHandler(IUnitOfWork unitOfWork, IMapper mapper)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
    }

    public async Task<PricingDto> Handle(UpdatePricingCommand request, CancellationToken cancellationToken)
    {
        var pricings = await _unitOfWork.Pricings.FindAsync(p => p.BoxType == request.BoxType, cancellationToken);
        var pricing = pricings.FirstOrDefault();

        if (pricing == null)
        {
            throw new KeyNotFoundException($"Pricing for box type '{request.BoxType}' not found");
        }

        pricing.Price = request.Price;
        pricing.UpdatedAt = DateTime.UtcNow;

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return _mapper.Map<PricingDto>(pricing);
    }
}
