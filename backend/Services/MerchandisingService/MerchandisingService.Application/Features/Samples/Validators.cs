using FluentValidation;
using MerchandisingService.Contracts;
using MerchandisingService.Domain;

namespace MerchandisingService.Application;

public sealed class CreateSampleRequestValidator : AbstractValidator<CreateSampleRequest>
{
    public CreateSampleRequestValidator()
    {
        RuleFor(x => x.CompanyId).NotEmpty();
        RuleFor(x => x.BuyerId).NotEmpty();
        RuleFor(x => x.StyleId).NotEmpty();
        RuleFor(x => x.SampleType).NotEmpty().Must(x => SampleTypes.Values.Contains(x)).WithMessage("Invalid sample type.");
        RuleFor(x => x.RequestDate).NotEmpty();
    }
}
