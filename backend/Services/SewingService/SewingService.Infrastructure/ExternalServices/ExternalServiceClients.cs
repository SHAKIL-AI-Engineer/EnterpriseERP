using SewingService.Application;

namespace SewingService.Infrastructure.ExternalServices;

public sealed class MerchandisingServiceClient(HttpClient httpClient) : IMerchandisingServiceClient
{
    public async Task<bool> IsOrderConfirmedAsync(Guid companyId, Guid orderId, CancellationToken cancellationToken = default)
    {
        try
        {
            var response = await httpClient.GetAsync($"/api/v1/merchandising/orders/{orderId}?companyId={companyId}", cancellationToken);
            return response.IsSuccessStatusCode;
        }
        catch (HttpRequestException)
        {
            return true;
        }
    }
}

public sealed class ReportExportClient(HttpClient httpClient) : IReportExportClient
{
    public Task<ReportExportFile> ExportAsync(string title, string format, IReadOnlyList<string> columns, IReadOnlyList<IReadOnlyList<string>> rows, string? bearerToken, CancellationToken cancellationToken = default)
    {
        _ = httpClient;
        return Task.FromResult(new ReportExportFile([], "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", $"{title}.xlsx"));
    }
}
