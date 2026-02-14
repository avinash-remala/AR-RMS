using AutoMapper;
using MediatR;
using Rms.Av.Application.DTOs;
using Rms.Av.Application.Interfaces;

namespace Rms.Av.Application.Features.Customers.Commands;

public record UpdateCustomerCommand(UpdateCustomerDto CustomerDto) : IRequest<Unit>;

public class UpdateCustomerCommandHandler : IRequestHandler<UpdateCustomerCommand, Unit>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;

    public UpdateCustomerCommandHandler(IUnitOfWork unitOfWork, IMapper mapper)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
    }

    public async Task<Unit> Handle(UpdateCustomerCommand request, CancellationToken cancellationToken)
    {
        var customer = await _unitOfWork.Customers.GetByIdAsync(request.CustomerDto.Id, cancellationToken);
        
        if (customer == null)
        {
            throw new KeyNotFoundException("Customer not found");
        }

        // Check if phone is being changed and if it conflicts
        if (customer.Phone != request.CustomerDto.Phone)
        {
            var phoneExists = await _unitOfWork.Customers
                .AnyAsync(c => c.Phone == request.CustomerDto.Phone && c.Id != request.CustomerDto.Id, cancellationToken);

            if (phoneExists)
            {
                throw new InvalidOperationException("A customer with this phone number already exists");
            }
        }

        _mapper.Map(request.CustomerDto, customer);
        customer.UpdatedAt = DateTime.UtcNow;
        
        _unitOfWork.Customers.Update(customer);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return Unit.Value;
    }
}
