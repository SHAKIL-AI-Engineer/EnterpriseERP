using FluentValidation;
using SecurityService.Domain;

namespace SecurityService.Application;

public sealed class CreateGateCommandValidator : AbstractValidator<CreateGateCommand>
{
    public CreateGateCommandValidator()
    {
        RuleFor(x => x.Request.CompanyId).NotEmpty();
        RuleFor(x => x.Request.GateCode).NotEmpty().MaximumLength(50);
        RuleFor(x => x.Request.GateName).NotEmpty().MaximumLength(150);
    }
}

public sealed class CreateVisitorCommandValidator : AbstractValidator<CreateVisitorCommand>
{
    public CreateVisitorCommandValidator()
    {
        RuleFor(x => x.Request.CompanyId).NotEmpty();
        RuleFor(x => x.Request.VisitorName).NotEmpty().MaximumLength(150);
        RuleFor(x => x.Request.Phone).MaximumLength(50);
    }
}

public sealed class CreateVisitorEntryCommandValidator : AbstractValidator<CreateVisitorEntryCommand>
{
    public CreateVisitorEntryCommandValidator()
    {
        RuleFor(x => x.Request.CompanyId).NotEmpty();
        RuleFor(x => x.Request.GateId).NotEmpty();
        RuleFor(x => x.Request.VisitorId).NotEmpty();
        RuleFor(x => x.Request.EntryNo).NotEmpty().MaximumLength(100);
        RuleFor(x => x.Request.Purpose).NotEmpty().MaximumLength(300);
    }
}

public sealed class CreateEmployeeOutPassCommandValidator : AbstractValidator<CreateEmployeeOutPassCommand>
{
    public CreateEmployeeOutPassCommandValidator()
    {
        RuleFor(x => x.Request.CompanyId).NotEmpty();
        RuleFor(x => x.Request.GateId).NotEmpty();
        RuleFor(x => x.Request.EmployeeId).NotEmpty();
        RuleFor(x => x.Request.PassNo).NotEmpty().MaximumLength(100);
        RuleFor(x => x.Request.Reason).NotEmpty().MaximumLength(300);
    }
}

public sealed class CreateVehicleCommandValidator : AbstractValidator<CreateVehicleCommand>
{
    public CreateVehicleCommandValidator()
    {
        RuleFor(x => x.Request.CompanyId).NotEmpty();
        RuleFor(x => x.Request.VehicleNo).NotEmpty().MaximumLength(100);
    }
}

public sealed class CreateVehicleEntryCommandValidator : AbstractValidator<CreateVehicleEntryCommand>
{
    public CreateVehicleEntryCommandValidator()
    {
        RuleFor(x => x.Request.CompanyId).NotEmpty();
        RuleFor(x => x.Request.VehicleId).NotEmpty();
        RuleFor(x => x.Request.GateId).NotEmpty();
        RuleFor(x => x.Request.EntryNo).NotEmpty().MaximumLength(100);
    }
}

public sealed class CreateGatePassCommandValidator : AbstractValidator<CreateGatePassCommand>
{
    public CreateGatePassCommandValidator()
    {
        RuleFor(x => x.Request.CompanyId).NotEmpty();
        RuleFor(x => x.Request.GateId).NotEmpty();
        RuleFor(x => x.Request.GatePassNo).NotEmpty().MaximumLength(100);
        RuleFor(x => x.Request.GatePassType).Must(t => GatePassTypes.All.Contains(t)).WithMessage("Invalid gate pass type.");
        RuleFor(x => x.Request.Direction).Must(d => d is GatePassDirections.In or GatePassDirections.Out);
        RuleFor(x => x.Request.Items).NotEmpty();
        RuleForEach(x => x.Request.Items).ChildRules(item =>
        {
            item.RuleFor(x => x.ItemName).NotEmpty().MaximumLength(200);
            item.RuleFor(x => x.Quantity).GreaterThan(0);
        });
        RuleFor(x => x.Request.ExpectedReturnDate)
            .NotNull()
            .When(x => x.Request.IsReturnable || x.Request.GatePassType == GatePassTypes.Returnable)
            .WithMessage("Returnable gate pass must have ExpectedReturnDate.");
    }
}

public sealed class CreateReturnableGatePassReturnCommandValidator : AbstractValidator<CreateReturnableGatePassReturnCommand>
{
    public CreateReturnableGatePassReturnCommandValidator()
    {
        RuleFor(x => x.Request.CompanyId).NotEmpty();
        RuleFor(x => x.Request.GatePassId).NotEmpty();
        RuleFor(x => x.Request.Items).NotEmpty();
        RuleForEach(x => x.Request.Items).ChildRules(item =>
        {
            item.RuleFor(x => x.GatePassItemId).NotEmpty();
            item.RuleFor(x => x.ReturnQty).GreaterThan(0);
        });
    }
}

public sealed class CreateChalanCommandValidator : AbstractValidator<CreateChalanCommand>
{
    public CreateChalanCommandValidator()
    {
        RuleFor(x => x.Request.CompanyId).NotEmpty();
        RuleFor(x => x.Request.ChalanNo).NotEmpty().MaximumLength(100);
        RuleFor(x => x.Request.ChalanType).NotEmpty().MaximumLength(50);
        RuleFor(x => x.Request.Items).NotEmpty();
    }
}

public sealed class CreateBillEntryCommandValidator : AbstractValidator<CreateBillEntryCommand>
{
    public CreateBillEntryCommandValidator()
    {
        RuleFor(x => x.Request.CompanyId).NotEmpty();
        RuleFor(x => x.Request.BillNo).NotEmpty().MaximumLength(100);
        RuleFor(x => x.Request.BillType).NotEmpty().MaximumLength(50);
        RuleFor(x => x.Request.Amount).GreaterThan(0);
        RuleFor(x => x.Request.TotalAmount).GreaterThanOrEqualTo(x => x.Request.Amount);
    }
}

public sealed class CreateSecurityCheckCommandValidator : AbstractValidator<CreateSecurityCheckCommand>
{
    public CreateSecurityCheckCommandValidator()
    {
        RuleFor(x => x.Request.CompanyId).NotEmpty();
        RuleFor(x => x.Request.GateId).NotEmpty();
        RuleFor(x => x.Request.ReferenceType).NotEmpty().MaximumLength(50);
        RuleFor(x => x.Request.ReferenceId).NotEmpty();
        RuleFor(x => x.Request.CheckResult).Must(r => r is CheckResults.Passed or CheckResults.Failed or CheckResults.Hold);
    }
}
