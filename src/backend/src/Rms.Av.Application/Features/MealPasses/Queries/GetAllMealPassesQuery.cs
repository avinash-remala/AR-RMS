using AutoMapper;
using MediatR;
using Rms.Av.Application.DTOs;
using Rms.Av.Application.Interfaces;

namespace Rms.Av.Application.Features.MealPasses.Queries;

public record GetAllMealPassesQuery(bool? IsActive = null) : IRequest<IEnumerable<MealPassDto>>;

public class GetAllMealPassesQueryHandler : IRequestHandler<GetAllMealPassesQuery, IEnumerable<MealPassDto>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;

    public GetAllMealPassesQueryHandler(IUnitOfWork unitOfWork, IMapper mapper)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
    }

    public async Task<IEnumerable<MealPassDto>> Handle(GetAllMealPassesQuery request, CancellationToken cancellationToken)
    {
        var query = await _unitOfWork.MealPasses.GetAllAsync(cancellationToken);
        
        // Include customer information
        var mealPassesWithCustomers = await _unitOfWork.MealPasses
            .FindAsync(mp => !request.IsActive.HasValue || mp.IsActive == request.IsActive.Value, cancellationToken);

        var mealPassList = mealPassesWithCustomers.ToList();
        
        // Manually load customers
        var customerIds = mealPassList.Select(mp => mp.CustomerId).Distinct().ToList();
        var customers = await _unitOfWork.Customers
            .FindAsync(c => customerIds.Contains(c.Id), cancellationToken);
        
        var customerDict = customers.ToDictionary(c => c.Id);
        
        foreach (var mealPass in mealPassList)
        {
            if (customerDict.TryGetValue(mealPass.CustomerId, out var customer))
            {
                mealPass.Customer = customer;
            }
        }

        return _mapper.Map<IEnumerable<MealPassDto>>(mealPassList);
    }
}
