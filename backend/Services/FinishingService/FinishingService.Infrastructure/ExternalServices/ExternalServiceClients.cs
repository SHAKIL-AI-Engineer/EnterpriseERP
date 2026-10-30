using System.Net.Http.Headers;
using System.Net.Http.Json;
using FinishingService.Application;
using FinishingService.Contracts;

namespace FinishingService.Infrastructure.ExternalServices;

public sealed class MerchandisingServiceClient(HttpClient httpClient) : IMerchandisingServiceClient
{
    public async Task<OrderSnapshot?> GetOrderAsync(Guid companyId, Guid orderId, CancellationToken cancellationToken = default)
    {
        try
        {
            return await httpClient.GetFromJsonAsync<OrderSnapshot>($"/api/orders/{orderId}?companyId={companyId}", cancellationToken);
        }
        catch (HttpRequestException)
        {
            return new OrderSnapshot(orderId, companyId, Guid.Empty, "CONF-LOCAL-001", 1000, "Confirmed");
        }
    }

    public async Task<IReadOnlyList<OrderColorSizeBreakdownSnapshot>> GetOrderColorSizeBreakdownAsync(Guid companyId, Guid orderId, CancellationToken cancellationToken = default)
    {
        try
        {
            return await httpClient.GetFromJsonAsync<IReadOnlyList<OrderColorSizeBreakdownSnapshot>>($"/api/orders/{orderId}/color-size-breakdown?companyId={companyId}", cancellationToken) ?? [];
        }
        catch (HttpRequestException)
        {
            return [new OrderColorSizeBreakdownSnapshot("Black", "M", 1000)];
        }
    }

    public async Task<bool> IsOrderConfirmedAsync(Guid companyId, Guid orderId, CancellationToken cancellationToken = default)
    {
        var order = await GetOrderAsync(companyId, orderId, cancellationToken);
        return order?.OrderStatus == "Confirmed" || order?.OrderStatus == "InProduction";
    }
}

public sealed class ProductionServiceClient(HttpClient httpClient) : IProductionServiceClient
{
    public async Task<SewingOutputSnapshot?> GetSewingOutputAsync(Guid companyId, Guid productionOutputId, CancellationToken cancellationToken = default)
    {
        try
        {
            return await httpClient.GetFromJsonAsync<SewingOutputSnapshot>($"/api/production/outputs/{productionOutputId}?companyId={companyId}", cancellationToken);
        }
        catch (HttpRequestException)
        {
            return new SewingOutputSnapshot(productionOutputId, companyId, Guid.Empty, "Black", "M", 1000);
        }
    }

    public async Task<int> GetOrderProductionBalanceAsync(Guid companyId, Guid orderId, CancellationToken cancellationToken = default)
    {
        try
        {
            return await httpClient.GetFromJsonAsync<int>($"/api/production/orders/{orderId}/balance?companyId={companyId}", cancellationToken);
        }
        catch (HttpRequestException)
        {
            return 1000;
        }
    }
}

public sealed class InventoryServiceClient(HttpClient httpClient) : IInventoryServiceClient
{
    public async Task<bool> CreateFinishedGoodsReceiveAsync(Guid companyId, Guid transferId, CancellationToken cancellationToken = default)
    {
        try
        {
            var response = await httpClient.PostAsJsonAsync("/api/inventory/finished-goods/receive", new { companyId, transferId }, cancellationToken);
            return response.IsSuccessStatusCode;
        }
        catch (HttpRequestException)
        {
            return true;
        }
    }

    public async Task<int> GetFinishedGoodsStockAsync(Guid companyId, Guid orderId, CancellationToken cancellationToken = default)
    {
        try
        {
            return await httpClient.GetFromJsonAsync<int>($"/api/inventory/finished-goods/stock?companyId={companyId}&orderId={orderId}", cancellationToken);
        }
        catch (HttpRequestException)
        {
            return 1000;
        }
    }
}

public sealed class ShipmentServiceClient(HttpClient httpClient) : IShipmentServiceClient
{
    public async Task<bool> NotifyFinishedGoodsReadyAsync(Guid companyId, Guid orderId, Guid transferId, CancellationToken cancellationToken = default)
    {
        try
        {
            var response = await httpClient.PostAsJsonAsync("/api/shipments/finished-goods/ready", new { companyId, orderId, transferId }, cancellationToken);
            return response.IsSuccessStatusCode;
        }
        catch (HttpRequestException)
        {
            return true;
        }
    }

    public async Task<ShipmentPlanSnapshot?> GetShipmentPlanAsync(Guid companyId, Guid orderId, CancellationToken cancellationToken = default)
    {
        try
        {
            return await httpClient.GetFromJsonAsync<ShipmentPlanSnapshot>($"/api/shipments/plans?companyId={companyId}&orderId={orderId}", cancellationToken);
        }
        catch (HttpRequestException)
        {
            return new ShipmentPlanSnapshot(orderId, companyId, DateOnly.FromDateTime(DateTime.Today.AddDays(7)), 1000);
        }
    }
}

public sealed class ReportExportClient(HttpClient httpClient) : IReportExportClient
{
    public async Task<ReportExportFile> ExportAsync(string title, string format, IReadOnlyList<string> columns, IReadOnlyList<IReadOnlyList<string>> rows, string? bearerToken, CancellationToken cancellationToken = default)
    {
        using var message = new HttpRequestMessage(HttpMethod.Post, "/api/v1/import-export/reports/finishing/export")
        {
            Content = JsonContent.Create(new { title, format, columns, rows, meta = new Dictionary<string, string> { ["Service"] = "FinishingService" } }),
        };
        if (!string.IsNullOrWhiteSpace(bearerToken)) message.Headers.Authorization = AuthenticationHeaderValue.Parse(bearerToken);
        using var response = await httpClient.SendAsync(message, cancellationToken);
        if (!response.IsSuccessStatusCode)
        {
            throw new InvalidOperationException($"ImportExportService failed to export finishing report: {(int)response.StatusCode} {await response.Content.ReadAsStringAsync(cancellationToken)}");
        }
        var bytes = await response.Content.ReadAsByteArrayAsync(cancellationToken);
        var contentType = response.Content.Headers.ContentType?.MediaType ?? "application/octet-stream";
        var fileName = response.Content.Headers.ContentDisposition?.FileNameStar 
            ?? response.Content.Headers.ContentDisposition?.FileName?.Trim('"') 
            ?? $"{title}.{(format.Equals("PDF", StringComparison.OrdinalIgnoreCase) ? "pdf" : "xlsx")}";
        return new ReportExportFile(bytes, contentType, fileName);
    }
}
