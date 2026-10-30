using CuttingService.Contracts;
using FluentValidation;

namespace CuttingService.Application;

public sealed class CreateCuttingPlanRequestValidator : AbstractValidator<CreateCuttingPlanRequest>
{
    public CreateCuttingPlanRequestValidator()
    {
        RuleFor(x => x.CompanyId).NotEmpty();
        RuleFor(x => x.OrderId).NotEmpty();
        RuleFor(x => x.PlanNo).NotEmpty().MaximumLength(100);
        RuleFor(x => x.PlanDate).NotEmpty();
        RuleFor(x => x.TotalPlanQty).GreaterThan(0);
    }
}

public sealed class CreateCuttingLayRequestValidator : AbstractValidator<CreateCuttingLayRequest>
{
    public CreateCuttingLayRequestValidator()
    {
        RuleFor(x => x.CompanyId).NotEmpty();
        RuleFor(x => x.CuttingPlanId).NotEmpty();
        RuleFor(x => x.LayNo).NotEmpty();
        RuleFor(x => x.PlyQty).GreaterThan(0);
        RuleFor(x => x.LayQty).GreaterThan(0);
    }
}

public sealed class CreateCuttingOutputRequestValidator : AbstractValidator<CreateCuttingOutputRequest>
{
    public CreateCuttingOutputRequestValidator()
    {
        RuleFor(x => x.CompanyId).NotEmpty();
        RuleFor(x => x.CuttingPlanId).NotEmpty();
        RuleFor(x => x.OrderId).NotEmpty();
        RuleFor(x => x.OutputDate).NotEmpty();
        RuleFor(x => x.SizeName).NotEmpty();
        RuleFor(x => x.OutputQty).GreaterThan(0);
    }
}

public sealed class CreateCuttingWastageRequestValidator : AbstractValidator<CreateCuttingWastageRequest>
{
    public CreateCuttingWastageRequestValidator()
    {
        RuleFor(x => x.WastageQty).GreaterThan(0);
        RuleFor(x => x.WastageReason).NotEmpty().MaximumLength(300);
    }
}

public sealed class CreatePanelTransferRequestValidator : AbstractValidator<CreatePanelTransferRequest>
{
    public CreatePanelTransferRequestValidator()
    {
        RuleFor(x => x.CompanyId).NotEmpty();
        RuleFor(x => x.OrderId).NotEmpty();
        RuleFor(x => x.TransferDate).NotEmpty();
        RuleFor(x => x.Items).NotEmpty();
        RuleForEach(x => x.Items).ChildRules(x => x.RuleFor(i => i.TransferQty).GreaterThan(0));
    }
}
