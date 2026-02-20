using AutoMapper;
using MediatR;
using Rms.Av.Application.DTOs;
using Rms.Av.Application.Interfaces;

namespace Rms.Av.Application.Features.MealPasses.Commands;

public record UseMealCommand(Guid MealPassId, int MealsToUse = 1) : IRequest<MealPassDto>;

public class UseMealCommandHandler : IRequestHandler<UseMealCommand, MealPassDto>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;

    public UseMealCommandHandler(IUnitOfWork unitOfWork, IMapper mapper)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
    }

    public async Task<MealPassDto> Handle(UseMealCommand request, CancellationToken cancellationToken)
    {
        var mealPass = await _unitOfWork.MealPasses.GetByIdAsync(request.MealPassId, cancellationToken);
        
        if (mealPass == null)
        {
            throw new KeyNotFoundException($"Meal pass with ID {request.MealPassId} not found");
        }

        if (!mealPass.IsActive)
        {
            throw new InvalidOperationException("Cannot use meals from an inactive meal pass");
        }

        if (mealPass.MealsRemaining < request.MealsToUse)
        {
            throw new InvalidOperationException($"Not enough meals remaining. Available: {mealPass.MealsRemaining}, Requested: {request.MealsToUse}");
        }

        mealPass.MealsUsed += request.MealsToUse;
        mealPass.LastUsedAt = DateTime.UtcNow;
        mealPass.UpdatedAt = DateTime.UtcNow;

        _unitOfWork.MealPasses.Update(mealPass);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        // Load customer for DTO mapping
        var customer = await _unitOfWork.Customers.GetByIdAsync(mealPass.CustomerId, cancellationToken);
        if (customer != null)
        {
            mealPass.Customer = customer;
        }

        return _mapper.Map<MealPassDto>(mealPass);
    }
}
