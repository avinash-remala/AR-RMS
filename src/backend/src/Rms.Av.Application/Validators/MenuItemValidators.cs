using FluentValidation;
using Rms.Av.Application.DTOs;

namespace Rms.Av.Application.Validators;

public class CreateMenuItemDtoValidator : AbstractValidator<CreateMenuItemDto>
{
    public CreateMenuItemDtoValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Menu item name is required")
            .MaximumLength(200).WithMessage("Name must not exceed 200 characters");

        RuleFor(x => x.Description)
            .NotEmpty().WithMessage("Description is required")
            .MaximumLength(500).WithMessage("Description must not exceed 500 characters");

        RuleFor(x => x.Price)
            .GreaterThan(0).WithMessage("Price must be greater than 0");

        RuleFor(x => x.Category)
            .NotEmpty().WithMessage("Category is required")
            .Must(BeValidCategory).WithMessage("Category must be one of: VEG, NON_VEG, VEG_SPECIAL, NON_VEG_SPECIAL");
    }

    private bool BeValidCategory(string category)
    {
        var validCategories = new[] { "VEG", "NON_VEG", "VEG_SPECIAL", "NON_VEG_SPECIAL", "GENERAL" };
        return validCategories.Contains(category.ToUpper());
    }
}

public class UpdateMenuItemDtoValidator : AbstractValidator<UpdateMenuItemDto>
{
    public UpdateMenuItemDtoValidator()
    {
        RuleFor(x => x.Id)
            .NotEmpty().WithMessage("Menu item ID is required");

        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Menu item name is required")
            .MaximumLength(200).WithMessage("Name must not exceed 200 characters");

        RuleFor(x => x.Description)
            .NotEmpty().WithMessage("Description is required")
            .MaximumLength(500).WithMessage("Description must not exceed 500 characters");

        RuleFor(x => x.Price)
            .GreaterThan(0).WithMessage("Price must be greater than 0");

        RuleFor(x => x.Category)
            .NotEmpty().WithMessage("Category is required")
            .Must(BeValidCategory).WithMessage("Category must be one of: VEG, NON_VEG, VEG_SPECIAL, NON_VEG_SPECIAL");
    }

    private bool BeValidCategory(string category)
    {
        var validCategories = new[] { "VEG", "NON_VEG", "VEG_SPECIAL", "NON_VEG_SPECIAL", "GENERAL" };
        return validCategories.Contains(category.ToUpper());
    }
}
