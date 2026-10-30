using FluentValidation;
using SewingService.Contracts;

namespace SewingService.Application;

public sealed class CreateSewingLineRequestValidator : AbstractValidator<CreateSewingLineRequest>
{
    public CreateSewingLineRequestValidator() => RuleFor(x => x.LineName).NotEmpty().MaximumLength(100);
}

public sealed class CreateProductionAssignmentRequestValidator : AbstractValidator<CreateProductionAssignmentRequest>
{
    public CreateProductionAssignmentRequestValidator()
    {
        RuleFor(x => x.TotalTarget).GreaterThan(0);
        RuleFor(x => x.OrderId).NotEmpty();
        RuleFor(x => x.SewingLineId).NotEmpty();
    }
}
