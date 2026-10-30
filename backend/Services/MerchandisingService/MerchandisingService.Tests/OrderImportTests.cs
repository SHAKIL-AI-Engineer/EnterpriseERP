using System.Text;
using MerchandisingService.Application;

namespace MerchandisingService.Tests;

public sealed class OrderImportTests
{
    [Fact]
    public async Task Order_import_template_has_expected_headers()
    {
        var handler = new OrderImportExportHandlers(null!, null!, null!);
        var bytes = await handler.Handle(new GetOrderImportTemplateQuery(), CancellationToken.None);
        var csv = Encoding.UTF8.GetString(bytes);
        Assert.Contains("OrderNo", csv);
        Assert.Contains("BuyerCode", csv);
        Assert.Contains("ColorName", csv);
        Assert.Contains("SizeName", csv);
    }
}
