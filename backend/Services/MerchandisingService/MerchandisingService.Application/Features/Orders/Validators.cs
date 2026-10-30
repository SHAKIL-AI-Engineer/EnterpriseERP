using FluentValidation;
using MerchandisingService.Contracts;
using MerchandisingService.Domain;

namespace MerchandisingService.Application;

public sealed class CreateOrderRequestValidator : AbstractValidator<CreateOrderRequest>
{
    public CreateOrderRequestValidator()
    {
        RuleFor(x => x.CompanyId).NotEmpty();
        RuleFor(x => x.BuyerId).NotEmpty();
        RuleFor(x => x.StyleId).NotEmpty();
        RuleFor(x => x.OrderNo).NotEmpty().MaximumLength(100);
        RuleFor(x => x.OrderDate).NotEmpty();
        RuleFor(x => x.TotalOrderQty).GreaterThan(0);
        RuleFor(x => x.UnitPrice).GreaterThanOrEqualTo(0);
    }
}

public sealed class CreateColorSizeBreakdownRequestValidator : AbstractValidator<CreateColorSizeBreakdownRequest>
{
    public CreateColorSizeBreakdownRequestValidator()
    {
        RuleFor(x => x.CompanyId).NotEmpty();
        RuleFor(x => x.ColorName).NotEmpty().MaximumLength(100);
        RuleFor(x => x.SizeName).NotEmpty().MaximumLength(50);
        RuleFor(x => x.Quantity).GreaterThan(0);
    }
}

public sealed class CreateBomItemRequestValidator : AbstractValidator<CreateBomItemRequest>
{
    public CreateBomItemRequestValidator()
    {
        RuleFor(x => x.CompanyId).NotEmpty();
        RuleFor(x => x.ItemType).NotEmpty().Must(x => BomItemTypes.Values.Contains(x)).WithMessage("Invalid BOM item type.");
        RuleFor(x => x.ItemName).NotEmpty().MaximumLength(150);
        RuleFor(x => x.UnitName).NotEmpty().MaximumLength(50);
        RuleFor(x => x.Consumption).GreaterThanOrEqualTo(0);
        RuleFor(x => x.WastagePercent).GreaterThanOrEqualTo(0);
        RuleFor(x => x.UnitPrice).GreaterThanOrEqualTo(0);
    }
}

public sealed class CreateShipmentPlanRequestValidator : AbstractValidator<CreateShipmentPlanRequest>
{
    public CreateShipmentPlanRequestValidator()
    {
        RuleFor(x => x.CompanyId).NotEmpty();
        RuleFor(x => x.OrderId).NotEmpty();
        RuleFor(x => x.PlannedShipmentDate).NotEmpty();
        RuleFor(x => x.PlannedQty).GreaterThan(0);
        RuleFor(x => x.ShipmentMode).Must(x => string.IsNullOrWhiteSpace(x) || ShipmentModes.Values.Contains(x)).WithMessage("Invalid shipment mode.");
    }
}

public sealed class CreateBuyerPoRequestValidator : AbstractValidator<CreateBuyerPoRequest>
{
    public CreateBuyerPoRequestValidator()
    {
        RuleFor(x => x.CompanyId).NotEmpty();
        RuleFor(x => x.PONo).NotEmpty().MaximumLength(100);
        RuleFor(x => x.OrderQty).GreaterThan(0);
        RuleFor(x => x.UnitPrice).GreaterThanOrEqualTo(0);
    }
}
