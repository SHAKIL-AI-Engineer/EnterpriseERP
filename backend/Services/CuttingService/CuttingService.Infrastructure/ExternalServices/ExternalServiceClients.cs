using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using CuttingService.Application;
using CuttingService.Contracts;

namespace CuttingService.Infrastructure.ExternalServices;

public sealed class MerchandisingServiceClient(HttpClient httpClient) : IMerchandisingServiceClient
{
    public async Task<OrderSnapshot?> GetOrderAsync(Guid companyId, Guid orderId, CancellationToken cancellationToken = default)
    {
        try
        {
            var res = await httpClient.GetAsync($"/api/v1/merchandising/orders/{orderId}?companyId={companyId}", cancellationToken);
            if (!res.IsSuccessStatusCode) return new OrderSnapshot(orderId, companyId, Guid.Empty, "LOCAL", 1000, "Confirmed");
            var payload = await res.Content.ReadFromJsonAsync<ApiResponse<JsonElement>>(cancellationToken);
            if (payload?.Data.ValueKind == JsonValueKind.Undefined || payload?.Data.ValueKind == JsonValueKind.Null) return null;
            var d = payload!.Data;
            return new OrderSnapshot(
                orderId,
                companyId,
                d.TryGetProperty("styleId", out var sid) && sid.TryGetGuid(out var styleId) ? styleId : Guid.Empty,
                d.TryGetProperty("orderNumber", out var on) ? on.GetString() ?? "LOCAL" : "LOCAL",
                d.TryGetProperty("totalQuantity", out var tq) ? tq.GetInt32() : 1000,
                d.TryGetProperty("status", out var st) ? st.GetString() ?? "Confirmed" : "Confirmed");
        }
        catch (HttpRequestException) { return new OrderSnapshot(orderId, companyId, Guid.Empty, "LOCAL", 1000, "Confirmed"); }
    }

    public async Task<IReadOnlyList<OrderColorSizeBreakdownSnapshot>> GetOrderColorSizeBreakdownAsync(Guid companyId, Guid orderId, CancellationToken cancellationToken = default)
    {
        try
        {
            var res = await httpClient.GetAsync($"/api/v1/merchandising/orders/{orderId}/color-size-breakdown?companyId={companyId}", cancellationToken);
            if (!res.IsSuccessStatusCode) return [new OrderColorSizeBreakdownSnapshot("Black", "M", 1000)];
            var payload = await res.Content.ReadFromJsonAsync<ApiResponse<JsonElement>>(cancellationToken);
            if (payload?.Data.ValueKind != JsonValueKind.Array) return [];
            return payload.Data.EnumerateArray()
                .Select(x => new OrderColorSizeBreakdownSnapshot(
                    x.TryGetProperty("colorName", out var c) ? c.GetString() : null,
                    x.TryGetProperty("sizeName", out var s) ? s.GetString() ?? "M" : "M",
                    x.TryGetProperty("quantity", out var q) ? q.GetInt32() : 0))
                .ToList();
        }
        catch (HttpRequestException) { return [new OrderColorSizeBreakdownSnapshot("Black", "M", 1000)]; }
    }

    public async Task<bool> IsOrderConfirmedAsync(Guid companyId, Guid orderId, CancellationToken cancellationToken = default)
    {
        var order = await GetOrderAsync(companyId, orderId, cancellationToken);
        return order?.OrderStatus == "Confirmed" || order?.OrderStatus == "InProduction";
    }
}

public sealed class InventoryServiceClient(HttpClient httpClient) : IInventoryServiceClient
{
    public async Task<FabricIssueSnapshot?> GetFabricIssueAsync(Guid companyId, Guid inventoryIssueId, CancellationToken cancellationToken = default)
    {
        try
        {
            var res = await httpClient.GetAsync($"/api/v1/inventory/items/{inventoryIssueId}/exists?companyId={companyId}", cancellationToken);
            if (!res.IsSuccessStatusCode) return null;
            return new FabricIssueSnapshot(inventoryIssueId, companyId, Guid.Empty, inventoryIssueId, 0, "Yds");
        }
        catch (HttpRequestException) { return null; }
    }

    public async Task<decimal> GetStockBalanceAsync(Guid companyId, Guid itemId, Guid orderId, CancellationToken cancellationToken = default)
    {
        try
        {
            var res = await httpClient.GetAsync($"/api/v1/inventory/items/{itemId}/stock-balance?companyId={companyId}", cancellationToken);
            if (!res.IsSuccessStatusCode) return 0;
            var payload = await res.Content.ReadFromJsonAsync<ApiResponse<decimal>>(cancellationToken);
            return payload?.Data ?? 0;
        }
        catch (HttpRequestException) { return 0; }
    }

    public Task<Guid?> RequestFabricIssueAsync(Guid companyId, Guid orderId, CancellationToken cancellationToken = default) =>
        Task.FromResult<Guid?>(null);
}

public sealed class ProductionServiceClient(HttpClient httpClient) : IProductionServiceClient
{
    public async Task NotifyPanelTransferAsync(Guid companyId, Guid orderId, Guid transferId, CancellationToken cancellationToken = default)
    {
        try { await httpClient.PostAsJsonAsync("/api/production/panel-transfers/receive", new { companyId, orderId, transferId }, cancellationToken); }
        catch (HttpRequestException) { }
    }
}

public sealed class ReportExportClient(HttpClient httpClient) : IReportExportClient
{
    public async Task<ReportExportFile> ExportAsync(string title, string format, IReadOnlyList<string> columns, IReadOnlyList<IReadOnlyList<string>> rows, string? bearerToken, CancellationToken cancellationToken = default)
    {
        using var message = new HttpRequestMessage(HttpMethod.Post, "/api/v1/import-export/reports/cutting/export")
        {
            Content = JsonContent.Create(new { title, format, columns, rows, meta = new Dictionary<string, string> { ["Service"] = "CuttingService" } }),
        };
        if (!string.IsNullOrWhiteSpace(bearerToken)) message.Headers.Authorization = AuthenticationHeaderValue.Parse(bearerToken);
        using var response = await httpClient.SendAsync(message, cancellationToken);
        if (!response.IsSuccessStatusCode) throw new InvalidOperationException($"ImportExportService failed to export cutting report: {(int)response.StatusCode} {await response.Content.ReadAsStringAsync(cancellationToken)}");
        var bytes = await response.Content.ReadAsByteArrayAsync(cancellationToken);
        var contentType = response.Content.Headers.ContentType?.MediaType ?? "application/octet-stream";
        var fileName = response.Content.Headers.ContentDisposition?.FileNameStar ?? response.Content.Headers.ContentDisposition?.FileName?.Trim('"') ?? $"{title}.{(format.Equals("PDF", StringComparison.OrdinalIgnoreCase) ? "pdf" : "xlsx")}";
        return new ReportExportFile(bytes, contentType, fileName);
    }
}
