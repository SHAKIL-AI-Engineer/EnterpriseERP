using FluentValidation;
using MerchandisingService.Contracts;

namespace MerchandisingService.Application;

public sealed class CreateBuyerRequestValidator : AbstractValidator<CreateBuyerRequest>
{
    public CreateBuyerRequestValidator()
    {
        RuleFor(x => x.CompanyId).NotEmpty();
        RuleFor(x => x.BuyerCode).NotEmpty().MaximumLength(50);
        RuleFor(x => x.BuyerName).NotEmpty().MaximumLength(150);
        RuleFor(x => x.Email).EmailAddress().When(x => !string.IsNullOrWhiteSpace(x.Email));
    }
}
