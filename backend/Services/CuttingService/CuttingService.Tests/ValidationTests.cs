using CuttingService.Application;
using CuttingService.Contracts;

namespace CuttingService.Tests;

public sealed class ValidationTests
{
    [Fact]
    public void Cutting_output_requires_positive_quantity()
    {
        var validator = new CreateCuttingOutputRequestValidator();
        var result = validator.Validate(new CreateCuttingOutputRequest(Guid.NewGuid(), Guid.NewGuid(), null, Guid.NewGuid(), DateOnly.FromDateTime(DateTime.Today), "Black", "M", 0, false, null));

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, x => x.PropertyName == nameof(CreateCuttingOutputRequest.OutputQty));
    }
}
