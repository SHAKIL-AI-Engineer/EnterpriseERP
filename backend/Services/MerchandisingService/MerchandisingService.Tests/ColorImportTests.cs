using System.Text;
using MerchandisingService.Application;

namespace MerchandisingService.Tests;

public sealed class ColorImportTests
{
    [Fact]
    public async Task Color_import_template_has_expected_headers()
    {
        var handler = new MasterColorImportHandlers(null!);
        var bytes = await handler.Handle(new GetColorImportTemplateQuery(), CancellationToken.None);
        var csv = Encoding.UTF8.GetString(bytes);
        Assert.Contains("ColorCode", csv);
        Assert.Contains("ColorName", csv);
        Assert.Contains("PantoneCode", csv);
    }
}
