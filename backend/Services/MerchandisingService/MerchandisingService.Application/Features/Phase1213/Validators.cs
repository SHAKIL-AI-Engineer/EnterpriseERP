using FluentValidation;
using MerchandisingService.Contracts;
using MerchandisingService.Domain;

namespace MerchandisingService.Application;

public sealed class CreateStyleDocumentRequestValidator : AbstractValidator<CreateStyleDocumentRequest>
{
    public CreateStyleDocumentRequestValidator()
    {
        RuleFor(x => x.CompanyId).NotEmpty();
        RuleFor(x => x.StyleId).NotEmpty();
        RuleFor(x => x.DocumentType).NotEmpty().Must(x => DocumentTypes.Values.Contains(x));
        RuleFor(x => x.FileName).NotEmpty().MaximumLength(255);
        RuleFor(x => x.FileUrl).NotEmpty().MaximumLength(500);
    }
}

public sealed class CreateOrderDocumentRequestValidator : AbstractValidator<CreateOrderDocumentRequest>
{
    public CreateOrderDocumentRequestValidator()
    {
        RuleFor(x => x.CompanyId).NotEmpty();
        RuleFor(x => x.OrderId).NotEmpty();
        RuleFor(x => x.DocumentType).NotEmpty().Must(x => DocumentTypes.Values.Contains(x));
        RuleFor(x => x.FileName).NotEmpty().MaximumLength(255);
        RuleFor(x => x.FileUrl).NotEmpty().MaximumLength(500);
    }
}

public sealed class CreateCommunicationLogRequestValidator : AbstractValidator<CreateCommunicationLogRequest>
{
    public CreateCommunicationLogRequestValidator()
    {
        RuleFor(x => x.CompanyId).NotEmpty();
        RuleFor(x => x).Must(x => x.StyleId.HasValue || x.OrderId.HasValue).WithMessage("Either styleId or orderId is required.");
        RuleFor(x => x.Direction).NotEmpty().Must(x => CommunicationDirections.Values.Contains(x));
        RuleFor(x => x.Subject).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Message).NotEmpty().MaximumLength(4000);
    }
}

public sealed class CreateApprovalRequestRequestValidator : AbstractValidator<CreateApprovalRequestRequest>
{
    public CreateApprovalRequestRequestValidator()
    {
        RuleFor(x => x.CompanyId).NotEmpty();
        RuleFor(x => x.EntityType).NotEmpty().MaximumLength(100);
        RuleFor(x => x.EntityId).NotEmpty();
        RuleFor(x => x.RequestType).NotEmpty().MaximumLength(100);
        RuleFor(x => x.RequestedBy).NotEmpty().MaximumLength(150);
        RuleFor(x => x.Steps).NotEmpty();
    }
}

public sealed class CreateShipmentExecutionRequestValidator : AbstractValidator<CreateShipmentExecutionRequest>
{
    public CreateShipmentExecutionRequestValidator()
    {
        RuleFor(x => x.CompanyId).NotEmpty();
        RuleFor(x => x.ShipmentPlanId).NotEmpty();
        RuleFor(x => x.ShippedQty).GreaterThanOrEqualTo(0);
    }
}

public sealed class CreatePackingListRequestValidator : AbstractValidator<CreatePackingListRequest>
{
    public CreatePackingListRequestValidator()
    {
        RuleFor(x => x.CompanyId).NotEmpty();
        RuleFor(x => x.ShipmentExecutionId).NotEmpty();
        RuleFor(x => x.CartonCount).GreaterThan(0);
        RuleFor(x => x.GrossWeightKg).GreaterThanOrEqualTo(0);
        RuleFor(x => x.NetWeightKg).GreaterThanOrEqualTo(0);
    }
}
