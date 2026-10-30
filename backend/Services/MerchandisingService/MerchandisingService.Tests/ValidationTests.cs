using MerchandisingService.Application;
using MerchandisingService.Contracts;

namespace MerchandisingService.Tests;

public sealed class ValidationTests
{
    [Fact]
    public void Create_order_requires_positive_quantity()
    {
        var validator = new CreateOrderRequestValidator();
        var result = validator.Validate(new CreateOrderRequest(Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(), "ORD-001", DateOnly.FromDateTime(DateTime.Today), null, 0, 0));

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.PropertyName == nameof(CreateOrderRequest.TotalOrderQty));
    }
}
