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
        // Extract phone number without country code for duplicate check
        var phoneOnly = ExtractPhone(request.CustomerDto.Phone);
        
        // Check if phone already exists
        var existingCustomer = await _unitOfWork.Customers
            .FirstOrDefaultAsync(c => c.Phone == phoneOnly, cancellationToken);

        if (existingCustomer != null)
        {
            throw new InvalidOperationException("A customer with this phone number already exists");
        }

        var customer = _mapper.Map<Customer>(request.CustomerDto);
        await _unitOfWork.Customers.AddAsync(customer, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return _mapper.Map<CustomerDto>(customer);
    }

    // Helper to extract phone without country code
    private static string ExtractPhone(string fullPhone)
    {
        if (string.IsNullOrWhiteSpace(fullPhone)) return string.Empty;
        
        // If phone starts with +, extract the number part (last 10 digits)
        if (fullPhone.StartsWith("+"))
        {
            var digits = fullPhone.Substring(1);
            return digits.Length >= 10 ? digits.Substring(digits.Length - 10) : digits;
        }
        
        return fullPhone;
    }
}
