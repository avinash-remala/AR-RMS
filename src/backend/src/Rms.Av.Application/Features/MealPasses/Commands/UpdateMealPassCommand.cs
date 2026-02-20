using AutoMapper;
using MediatR;
using Rms.Av.Application.DTOs;
using Rms.Av.Application.Interfaces;

namespace Rms.Av.Application.Features.MealPasses.Commands;

public record UpdateMealPassCommand(Guid Id, UpdateMealPassDto Dto) : IRequest<MealPassDto>;

public class UpdateMealPassCommandHandler : IRequestHandler<UpdateMealPassCommand, MealPassDto>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;

    public UpdateMealPassCommandHandler(IUnitOfWork unitOfWork, IMapper mapper)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
    }

    public async Task<MealPassDto> Handle(UpdateMealPassCommand request, CancellationToken cancellationToken)
    {
        var mealPass = await _unitOfWork.MealPasses.GetByIdAsync(request.Id, cancellationToken);
        
        if (mealPass == null)
        {
            throw new KeyNotFoundException($"Meal pass with ID {request.Id} not found");
        }

        // Update properties if provided
        if (request.Dto.TotalMeals.HasValue)
        {
            mealPass.TotalMeals = request.Dto.TotalMeals.Value;
        }

        if (request.Dto.MealsUsed.HasValue)
        {
            mealPass.MealsUsed = request.Dto.MealsUsed.Value;
        }

        if (request.Dto.IsActive.HasValue)
        {
            mealPass.IsActive = request.Dto.IsActive.Value;
        }

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
