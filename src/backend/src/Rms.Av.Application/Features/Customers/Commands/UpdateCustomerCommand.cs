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

        // Extract phone number without country code for duplicate check
        var phoneOnly = ExtractPhone(request.CustomerDto.Phone);
        
        // Check if phone is being changed and if it conflicts
        if (customer.Phone != phoneOnly)
        {
            var phoneExists = await _unitOfWork.Customers
                .AnyAsync(c => c.Phone == phoneOnly && c.Id != request.CustomerDto.Id, cancellationToken);

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
