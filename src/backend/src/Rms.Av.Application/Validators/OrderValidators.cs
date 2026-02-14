using FluentValidation;
using Rms.Av.Application.DTOs;

namespace Rms.Av.Application.Validators;

public class CreateOrderDtoValidator : AbstractValidator<CreateOrderDto>
{
    public CreateOrderDtoValidator()
    {
        RuleFor(o => o.CustomerId).NotEmpty();
        RuleFor(o => o.Items)
            .NotEmpty().WithMessage("At least one order item is required");
        RuleForEach(o => o.Items).SetValidator(new CreateOrderItemDtoValidator());
        RuleForEach(o => o.Extras).SetValidator(new CreateOrderExtraDtoValidator());
    }
}

public class CreateOrderItemDtoValidator : AbstractValidator<CreateOrderItemDto>
{
    public CreateOrderItemDtoValidator()
    {
        RuleFor(i => i.MenuItemId).NotEmpty();
        RuleFor(i => i.Quantity).GreaterThan(0);
    }
}

public class CreateOrderExtraDtoValidator : AbstractValidator<CreateOrderExtraDto>
{
    public CreateOrderExtraDtoValidator()
    {
        RuleFor(e => e.ExtraItemId).NotEmpty();
        RuleFor(e => e.Quantity).GreaterThan(0);
    }
}
