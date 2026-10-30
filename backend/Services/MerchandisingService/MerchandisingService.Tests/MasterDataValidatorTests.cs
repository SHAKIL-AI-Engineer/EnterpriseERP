using MerchandisingService.Application;
using MerchandisingService.Contracts;

namespace MerchandisingService.Tests;

public sealed class MasterDataValidatorTests
{
    [Fact]
    public void Create_buyer_requires_code_and_name()
    {
        var validator = new CreateBuyerRequestValidator();
        var result = validator.Validate(new CreateBuyerRequest(Guid.NewGuid(), "", "", null, null, null, null, null));
        Assert.False(result.IsValid);
    }

    [Fact]
    public void Create_style_requires_style_no()
    {
        var validator = new CreateStyleRequestValidator();
        var result = validator.Validate(new CreateStyleRequest(Guid.NewGuid(), Guid.NewGuid(), null, null, null, "", null, null, null));
        Assert.False(result.IsValid);
    }

    [Fact]
    public void Create_order_requires_positive_quantity()
    {
        var validator = new CreateOrderRequestValidator();
        var result = validator.Validate(new CreateOrderRequest(Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(), "ORD", DateOnly.FromDateTime(DateTime.Today), null, 0, 0));
        Assert.False(result.IsValid);
    }

    [Fact]
    public void Create_bom_item_validates_item_type()
    {
        var validator = new CreateBomItemRequestValidator();
        var result = validator.Validate(new CreateBomItemRequest(Guid.NewGuid(), "InvalidType", null, "Item", "Pcs", 1, 0, 1));
        Assert.False(result.IsValid);
    }

    [Fact]
    public void Create_sample_validates_sample_type()
    {
        var validator = new CreateSampleRequestValidator();
        var result = validator.Validate(new CreateSampleRequest(Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(), "Unknown", DateOnly.FromDateTime(DateTime.Today), null, null));
        Assert.False(result.IsValid);
    }

    [Fact]
    public void Create_shipment_plan_validates_quantity()
    {
        var validator = new CreateShipmentPlanRequestValidator();
        var result = validator.Validate(new CreateShipmentPlanRequest(Guid.NewGuid(), Guid.NewGuid(), null, DateOnly.FromDateTime(DateTime.Today), 0, null, null));
        Assert.False(result.IsValid);
    }
}
