using MediatR;
using Rms.Av.Application.Interfaces;

namespace Rms.Av.Application.Features.Customers.Commands;

public record DeleteCustomerCommand(Guid Id) : IRequest<Unit>;

public class DeleteCustomerCommandHandler : IRequestHandler<DeleteCustomerCommand, Unit>
{
    private readonly IUnitOfWork _unitOfWork;

    public DeleteCustomerCommandHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<Unit> Handle(DeleteCustomerCommand request, CancellationToken cancellationToken)
    {
        var customer = await _unitOfWork.Customers.GetByIdAsync(request.Id, cancellationToken);
        
        if (customer == null)
        {
            throw new KeyNotFoundException("Customer not found");
        }

        // Soft delete
        customer.IsActive = false;
        customer.UpdatedAt = DateTime.UtcNow;
        
        _unitOfWork.Customers.Update(customer);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return Unit.Value;
    }
}
