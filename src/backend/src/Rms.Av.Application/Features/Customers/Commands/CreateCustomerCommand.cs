using AutoMapper;
using MediatR;
using Rms.Av.Application.DTOs;
using Rms.Av.Application.Interfaces;
using Rms.Av.Domain.Entities;

namespace Rms.Av.Application.Features.Customers.Commands;

public record CreateCustomerCommand(CreateCustomerDto CustomerDto) : IRequest<CustomerDto>;

public class CreateCustomerCommandHandler : IRequestHandler<CreateCustomerCommand, CustomerDto>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;

    public CreateCustomerCommandHandler(IUnitOfWork unitOfWork, IMapper mapper)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
    }

    public async Task<CustomerDto> Handle(CreateCustomerCommand request, CancellationToken cancellationToken)
    {
        // Check if phone already exists
        var existingCustomer = await _unitOfWork.Customers
            .FirstOrDefaultAsync(c => c.Phone == request.CustomerDto.Phone, cancellationToken);

        if (existingCustomer != null)
        {
            throw new InvalidOperationException("A customer with this phone number already exists");
        }

        var customer = _mapper.Map<Customer>(request.CustomerDto);
        await _unitOfWork.Customers.AddAsync(customer, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return _mapper.Map<CustomerDto>(customer);
    }
}
