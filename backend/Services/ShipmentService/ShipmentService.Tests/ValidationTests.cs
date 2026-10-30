using ShipmentService.Contracts;

namespace ShipmentService.Tests;

public sealed class ValidationTests
{
    [Fact]
    public void CreateSewingOutputRequest_positive_quantity_is_valid()
    {
        var request = new CreateSewingOutputRequest(
            Guid.NewGuid(), Guid.NewGuid(), null,
            DateOnly.FromDateTime(DateTime.Today), "Black", "M", 100);

        Assert.True(request.OutputQty > 0);
    }

    [Fact]
    public void CreateSewingOutputRequest_zero_quantity_is_not_positive()
    {
        var request = new CreateSewingOutputRequest(
            Guid.NewGuid(), Guid.NewGuid(), null,
            DateOnly.FromDateTime(DateTime.Today), "Black", "M", 0);

        Assert.False(request.OutputQty > 0);
    }
}
