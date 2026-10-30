using FluentValidation;
using MerchandisingService.Contracts;

namespace MerchandisingService.Application;

public sealed class CreateSeasonRequestValidator : AbstractValidator<CreateSeasonRequest>
{
    public CreateSeasonRequestValidator()
    {
        RuleFor(x => x.CompanyId).NotEmpty();
        RuleFor(x => x.SeasonCode).NotEmpty().MaximumLength(50);
        RuleFor(x => x.SeasonName).NotEmpty().MaximumLength(150);
    }
}

public sealed class CreateGarmentItemRequestValidator : AbstractValidator<CreateGarmentItemRequest>
{
    public CreateGarmentItemRequestValidator()
    {
        RuleFor(x => x.CompanyId).NotEmpty();
        RuleFor(x => x.ItemCode).NotEmpty().MaximumLength(50);
        RuleFor(x => x.ItemName).NotEmpty().MaximumLength(150);
    }
}

public sealed class CreateStyleRequestValidator : AbstractValidator<CreateStyleRequest>
{
    public CreateStyleRequestValidator()
    {
        RuleFor(x => x.CompanyId).NotEmpty();
        RuleFor(x => x.BuyerId).NotEmpty();
        RuleFor(x => x.StyleNo).NotEmpty().MaximumLength(100);
    }
}
