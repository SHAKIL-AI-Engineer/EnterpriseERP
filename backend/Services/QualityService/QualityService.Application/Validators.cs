using FluentValidation;
using QualityService.Contracts;

namespace QualityService.Application;

public sealed class CreateQualityCheckpointRequestValidator : AbstractValidator<CreateQualityCheckpointRequest>
{
    public CreateQualityCheckpointRequestValidator()
    {
        RuleFor(x => x.CompanyId).NotEmpty();
        RuleFor(x => x.CheckpointCode).NotEmpty().MaximumLength(50);
        RuleFor(x => x.CheckpointName).NotEmpty().MaximumLength(150);
        RuleFor(x => x.CheckpointType).NotEmpty().MaximumLength(50);
    }
}

public sealed class CreateDefectCategoryRequestValidator : AbstractValidator<CreateDefectCategoryRequest>
{
    public CreateDefectCategoryRequestValidator()
    {
        RuleFor(x => x.CompanyId).NotEmpty();
        RuleFor(x => x.CategoryCode).NotEmpty().MaximumLength(50);
        RuleFor(x => x.CategoryName).NotEmpty().MaximumLength(150);
    }
}

public sealed class CreateDefectTypeRequestValidator : AbstractValidator<CreateDefectTypeRequest>
{
    public CreateDefectTypeRequestValidator()
    {
        RuleFor(x => x.CompanyId).NotEmpty();
        RuleFor(x => x.DefectCategoryId).NotEmpty();
        RuleFor(x => x.DefectCode).NotEmpty().MaximumLength(50);
        RuleFor(x => x.DefectName).NotEmpty().MaximumLength(150);
        RuleFor(x => x.Severity).NotEmpty().Must(x => x is "Critical" or "Major" or "Minor").WithMessage("Severity must be Critical, Major, or Minor.");
    }
}

public sealed class QualityInspectionDefectRequestValidator : AbstractValidator<QualityInspectionDefectRequest>
{
    public QualityInspectionDefectRequestValidator()
    {
        RuleFor(x => x.DefectTypeId).NotEmpty();
        RuleFor(x => x.DefectQty).GreaterThan(0);
        RuleFor(x => x.DefectLocation).MaximumLength(150);
        RuleFor(x => x.ResponsibleDepartment).MaximumLength(100);
    }
}

public sealed class CreateQualityInspectionRequestValidator : AbstractValidator<CreateQualityInspectionRequest>
{
    public CreateQualityInspectionRequestValidator()
    {
        RuleFor(x => x.CompanyId).NotEmpty();
        RuleFor(x => x.OrderId).NotEmpty();
        RuleFor(x => x.CheckpointId).NotEmpty();
        RuleFor(x => x.InspectionNo).NotEmpty().MaximumLength(100);
        RuleFor(x => x.InspectionDate).NotEmpty();
        RuleFor(x => x.InspectionType).NotEmpty();
        RuleFor(x => x.InspectedQty).GreaterThan(0);
        RuleFor(x => x.PassedQty).GreaterThanOrEqualTo(0);
        RuleFor(x => x.DefectQty).GreaterThanOrEqualTo(0);
        RuleFor(x => x.ReworkQty).GreaterThanOrEqualTo(0);
        RuleFor(x => x.RejectQty).GreaterThanOrEqualTo(0);
        RuleFor(x => x.Remarks).MaximumLength(500);

        RuleForEach(x => x.Defects).SetValidator(new QualityInspectionDefectRequestValidator());

        RuleFor(x => x).Must(x => x.PassedQty + x.DefectQty + x.RejectQty <= x.InspectedQty)
            .WithMessage("PassedQty + DefectQty + RejectQty cannot exceed InspectedQty.");
    }
}

public sealed class CreateQualityReworkRequestValidator : AbstractValidator<CreateQualityReworkRequest>
{
    public CreateQualityReworkRequestValidator()
    {
        RuleFor(x => x.CompanyId).NotEmpty();
        RuleFor(x => x.QualityInspectionId).NotEmpty();
        RuleFor(x => x.OrderId).NotEmpty();
        RuleFor(x => x.ReworkNo).NotEmpty().MaximumLength(100);
        RuleFor(x => x.ReworkDate).NotEmpty();
        RuleFor(x => x.ReworkQty).GreaterThan(0);
        RuleFor(x => x.ReworkReason).NotEmpty().MaximumLength(300);
        RuleFor(x => x.SentToDepartment).NotEmpty().MaximumLength(100);
    }
}

public sealed class CreateQualityRejectRequestValidator : AbstractValidator<CreateQualityRejectRequest>
{
    public CreateQualityRejectRequestValidator()
    {
        RuleFor(x => x.CompanyId).NotEmpty();
        RuleFor(x => x.QualityInspectionId).NotEmpty();
        RuleFor(x => x.OrderId).NotEmpty();
        RuleFor(x => x.RejectNo).NotEmpty().MaximumLength(100);
        RuleFor(x => x.RejectDate).NotEmpty();
        RuleFor(x => x.RejectQty).GreaterThan(0);
        RuleFor(x => x.RejectReason).NotEmpty().MaximumLength(300);
    }
}

public sealed class CreateAQLStandardRequestValidator : AbstractValidator<CreateAQLStandardRequest>
{
    public CreateAQLStandardRequestValidator()
    {
        RuleFor(x => x.CompanyId).NotEmpty();
        RuleFor(x => x.AQLCode).NotEmpty().MaximumLength(50);
        RuleFor(x => x.AQLLevel).NotEmpty().MaximumLength(50);
        RuleFor(x => x.LotSizeFrom).GreaterThanOrEqualTo(0);
        RuleFor(x => x.LotSizeTo).GreaterThan(x => x.LotSizeFrom);
        RuleFor(x => x.SampleSize).GreaterThan(0);
        RuleFor(x => x.AcceptQty).GreaterThanOrEqualTo(0);
        RuleFor(x => x.RejectQty).GreaterThan(x => x.AcceptQty);
    }
}

public sealed class CreateFinalInspectionRequestValidator : AbstractValidator<CreateFinalInspectionRequest>
{
    public CreateFinalInspectionRequestValidator()
    {
        RuleFor(x => x.CompanyId).NotEmpty();
        RuleFor(x => x.OrderId).NotEmpty();
        RuleFor(x => x.InspectionNo).NotEmpty().MaximumLength(100);
        RuleFor(x => x.InspectionDate).NotEmpty();
        RuleFor(x => x.LotSize).GreaterThan(0);
        RuleFor(x => x.SampleSize).GreaterThan(0);
        RuleFor(x => x.CriticalDefects).GreaterThanOrEqualTo(0);
        RuleFor(x => x.MajorDefects).GreaterThanOrEqualTo(0);
        RuleFor(x => x.MinorDefects).GreaterThanOrEqualTo(0);
        RuleFor(x => x.Remarks).MaximumLength(500);
    }
}

// Command validations wrapping MediatR Requests
public sealed class CreateQualityCheckpointCommandValidator : AbstractValidator<CreateQualityCheckpointCommand>
{
    public CreateQualityCheckpointCommandValidator() => RuleFor(x => x.Request).SetValidator(new CreateQualityCheckpointRequestValidator());
}

public sealed class CreateDefectCategoryCommandValidator : AbstractValidator<CreateDefectCategoryCommand>
{
    public CreateDefectCategoryCommandValidator() => RuleFor(x => x.Request).SetValidator(new CreateDefectCategoryRequestValidator());
}

public sealed class CreateDefectTypeCommandValidator : AbstractValidator<CreateDefectTypeCommand>
{
    public CreateDefectTypeCommandValidator() => RuleFor(x => x.Request).SetValidator(new CreateDefectTypeRequestValidator());
}

public sealed class CreateQualityInspectionCommandValidator : AbstractValidator<CreateQualityInspectionCommand>
{
    public CreateQualityInspectionCommandValidator() => RuleFor(x => x.Request).SetValidator(new CreateQualityInspectionRequestValidator());
}

public sealed class CreateQualityReworkCommandValidator : AbstractValidator<CreateQualityReworkCommand>
{
    public CreateQualityReworkCommandValidator() => RuleFor(x => x.Request).SetValidator(new CreateQualityReworkRequestValidator());
}

public sealed class CreateQualityRejectCommandValidator : AbstractValidator<CreateQualityRejectCommand>
{
    public CreateQualityRejectCommandValidator() => RuleFor(x => x.Request).SetValidator(new CreateQualityRejectRequestValidator());
}

public sealed class CreateAQLStandardCommandValidator : AbstractValidator<CreateAQLStandardCommand>
{
    public CreateAQLStandardCommandValidator() => RuleFor(x => x.Request).SetValidator(new CreateAQLStandardRequestValidator());
}

public sealed class CreateFinalInspectionCommandValidator : AbstractValidator<CreateFinalInspectionCommand>
{
    public CreateFinalInspectionCommandValidator() => RuleFor(x => x.Request).SetValidator(new CreateFinalInspectionRequestValidator());
}
