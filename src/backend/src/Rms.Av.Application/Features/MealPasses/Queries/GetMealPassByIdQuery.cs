using AutoMapper;
using MediatR;
using Rms.Av.Application.DTOs;
using Rms.Av.Application.Interfaces;

namespace Rms.Av.Application.Features.MealPasses.Queries;

public record GetMealPassByIdQuery(Guid Id) : IRequest<MealPassDto?>;

public class GetMealPassByIdQueryHandler : IRequestHandler<GetMealPassByIdQuery, MealPassDto?>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;

    public GetMealPassByIdQueryHandler(IUnitOfWork unitOfWork, IMapper mapper)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
    }

    public async Task<MealPassDto?> Handle(GetMealPassByIdQuery request, CancellationToken cancellationToken)
    {
        var mealPass = await _unitOfWork.MealPasses.GetByIdAsync(request.Id, cancellationToken);
        
        if (mealPass == null)
            return null;

        // Load customer information
        var customer = await _unitOfWork.Customers.GetByIdAsync(mealPass.CustomerId, cancellationToken);
        if (customer != null)
        {
            mealPass.Customer = customer;
        }

        return _mapper.Map<MealPassDto>(mealPass);
    }
}
