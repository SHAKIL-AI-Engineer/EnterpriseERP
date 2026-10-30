using SewingService.Application;
using SewingService.Contracts;

namespace SewingService.Tests;

public sealed class ValidationTests
{
    [Fact]
    public void Sewing_line_requires_name()
    {
        var validator = new CreateSewingLineRequestValidator();
        var result = validator.Validate(new CreateSewingLineRequest(Guid.NewGuid(), 1, "", null));

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, x => x.PropertyName == nameof(CreateSewingLineRequest.LineName));
    }
}
