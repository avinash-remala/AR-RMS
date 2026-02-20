using MediatR;
using Rms.Av.Application.Interfaces;

namespace Rms.Av.Application.Features.MealPasses.Commands;

public record DeleteMealPassCommand(Guid Id) : IRequest<bool>;

public class DeleteMealPassCommandHandler : IRequestHandler<DeleteMealPassCommand, bool>
{
    private readonly IUnitOfWork _unitOfWork;

    public DeleteMealPassCommandHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<bool> Handle(DeleteMealPassCommand request, CancellationToken cancellationToken)
    {
        var mealPass = await _unitOfWork.MealPasses.GetByIdAsync(request.Id, cancellationToken);
        
        if (mealPass == null)
        {
            return false;
        }

        _unitOfWork.MealPasses.Remove(mealPass);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return true;
    }
}
