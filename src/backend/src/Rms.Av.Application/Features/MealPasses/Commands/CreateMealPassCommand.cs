using AutoMapper;
using MediatR;
using Rms.Av.Application.DTOs;
using Rms.Av.Application.Interfaces;
using Rms.Av.Domain.Entities;

namespace Rms.Av.Application.Features.MealPasses.Commands;

public record CreateMealPassCommand(CreateMealPassDto Dto) : IRequest<MealPassDto>;

public class CreateMealPassCommandHandler : IRequestHandler<CreateMealPassCommand, MealPassDto>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;

    public CreateMealPassCommandHandler(IUnitOfWork unitOfWork, IMapper mapper)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
    }

    public async Task<MealPassDto> Handle(CreateMealPassCommand request, CancellationToken cancellationToken)
    {
        // Verify customer exists
        var customer = await _unitOfWork.Customers.GetByIdAsync(request.Dto.CustomerId, cancellationToken);
        if (customer == null)
        {
            throw new KeyNotFoundException($"Customer with ID {request.Dto.CustomerId} not found");
        }

        var mealPass = new MealPass
        {
            CustomerId = request.Dto.CustomerId,
            TotalMeals = request.Dto.TotalMeals,
            MealsUsed = 0,
            IsActive = true
        };

        await _unitOfWork.MealPasses.AddAsync(mealPass, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        // Load customer for DTO mapping
        mealPass.Customer = customer;

        return _mapper.Map<MealPassDto>(mealPass);
    }
}
