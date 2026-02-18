using AutoMapper;
using Rms.Av.Application.DTOs;
using Rms.Av.Domain.Entities;

namespace Rms.Av.Application.Mappings;

public class MappingProfile : Profile
{
    public MappingProfile()
    {
        // Customer mappings
        CreateMap<Customer, CustomerDto>()
            .ForMember(dest => dest.Phone, opt => opt.MapFrom(src => 
                !string.IsNullOrEmpty(src.CountryCode) ? $"+{src.CountryCode}{src.Phone}" : src.Phone));
        
        CreateMap<CreateCustomerDto, Customer>()
            .ForMember(dest => dest.Id, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedAt, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedAt, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedBy, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedBy, opt => opt.Ignore())
            .ForMember(dest => dest.IsActive, opt => opt.MapFrom(src => true))
            .ForMember(dest => dest.Phone, opt => opt.MapFrom(src => ExtractPhone(src.Phone)))
            .ForMember(dest => dest.CountryCode, opt => opt.MapFrom(src => ExtractCountryCode(src.Phone)));
        
        CreateMap<UpdateCustomerDto, Customer>()
            .ForMember(dest => dest.CreatedAt, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedAt, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedBy, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedBy, opt => opt.Ignore())
            .ForMember(dest => dest.PasswordHash, opt => opt.Ignore())
            .ForMember(dest => dest.Phone, opt => opt.MapFrom(src => ExtractPhone(src.Phone)))
            .ForMember(dest => dest.CountryCode, opt => opt.MapFrom(src => ExtractCountryCode(src.Phone)));

        // MenuItem mappings
        CreateMap<MenuItem, MenuItemDto>();
        CreateMap<CreateMenuItemDto, MenuItem>()
            .ForMember(dest => dest.Id, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedAt, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedAt, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedBy, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedBy, opt => opt.Ignore());
        
        CreateMap<UpdateMenuItemDto, MenuItem>()
            .ForMember(dest => dest.CreatedAt, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedAt, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedBy, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedBy, opt => opt.Ignore());

        // Order mappings
        CreateMap<Order, OrderDto>()
            .ForMember(dest => dest.Status, opt => opt.MapFrom(src => src.Status.ToString()));
        
        CreateMap<OrderItem, OrderItemDto>()
            .ForMember(dest => dest.MenuItemName, opt => opt.Ignore());
        
        CreateMap<OrderExtra, OrderExtraDto>()
            .ForMember(dest => dest.ExtraItemName, opt => opt.Ignore());

        CreateMap<CreateOrderDto, Order>()
            .ForMember(dest => dest.Id, opt => opt.Ignore())
            .ForMember(dest => dest.OrderNumber, opt => opt.Ignore())
            .ForMember(dest => dest.Status, opt => opt.Ignore())
            .ForMember(dest => dest.OrderDate, opt => opt.Ignore())
            .ForMember(dest => dest.TotalAmount, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedAt, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedAt, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedBy, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedBy, opt => opt.Ignore());

        CreateMap<CreateOrderItemDto, OrderItem>()
            .ForMember(dest => dest.Id, opt => opt.Ignore())
            .ForMember(dest => dest.OrderId, opt => opt.Ignore())
            .ForMember(dest => dest.Price, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedAt, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedAt, opt => opt.Ignore());

        CreateMap<CreateOrderExtraDto, OrderExtra>()
            .ForMember(dest => dest.Id, opt => opt.Ignore())
            .ForMember(dest => dest.OrderId, opt => opt.Ignore())
            .ForMember(dest => dest.Price, opt => opt.Ignore())
            .ForMember(dest => dest.CreatedAt, opt => opt.Ignore())
            .ForMember(dest => dest.UpdatedAt, opt => opt.Ignore());
    }

    // Helper methods to split phone and country code
    private static string ExtractPhone(string fullPhone)
    {
        if (string.IsNullOrWhiteSpace(fullPhone)) return string.Empty;
        
        // If phone starts with +, extract the number part
        if (fullPhone.StartsWith("+"))
        {
            var digits = fullPhone.Substring(1);
            // Assume last 10 digits are the phone number
            return digits.Length >= 10 ? digits.Substring(digits.Length - 10) : digits;
        }
        
        return fullPhone;
    }

    private static string ExtractCountryCode(string fullPhone)
    {
        if (string.IsNullOrWhiteSpace(fullPhone)) return string.Empty;
        
        // If phone starts with +, extract country code
        if (fullPhone.StartsWith("+"))
        {
            var digits = fullPhone.Substring(1);
            // Country code is everything except the last 10 digits
            return digits.Length > 10 ? digits.Substring(0, digits.Length - 10) : string.Empty;
        }
        
        return string.Empty;
    }
}
