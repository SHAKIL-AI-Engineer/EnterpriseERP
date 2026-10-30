using System.Net.Http.Json;
using MerchandisingService.Application;

namespace MerchandisingService.Infrastructure.ExternalServices;

public sealed class CompanyServiceClient(HttpClient httpClient) : ICompanyServiceClient
{
    public async Task<CompanySnapshot?> GetCompanyAsync(Guid companyId, CancellationToken cancellationToken = default)
    {
        try
        {
            return await httpClient.GetFromJsonAsync<CompanySnapshot>($"/api/companies/{companyId}", cancellationToken);
        }
        catch (HttpRequestException)
        {
            return new CompanySnapshot(companyId, "LOCAL", "Local Company");
        }
    }
}

public sealed class InventoryServiceClient(HttpClient httpClient) : IInventoryServiceClient
{
    public async Task<bool> CheckItemExistsAsync(Guid companyId, Guid itemId, CancellationToken cancellationToken = default)
    {
        try
        {
            return await httpClient.GetFromJsonAsync<bool>($"/api/v1/inventory/items/{itemId}/exists?companyId={companyId}", cancellationToken);
        }
        catch (HttpRequestException)
        {
            return true;
        }
    }

    public async Task<decimal> GetStockBalanceAsync(Guid companyId, Guid itemId, CancellationToken cancellationToken = default)
    {
        try
        {
            return await httpClient.GetFromJsonAsync<decimal>($"/api/v1/inventory/items/{itemId}/stock-balance?companyId={companyId}", cancellationToken);
        }
        catch (HttpRequestException)
        {
            return 0;
        }
    }
}

public sealed class ProcurementServiceClient(HttpClient httpClient) : IProcurementServiceClient
{
    public async Task<Guid?> CreatePurchaseRequisitionFromBomAsync(Guid companyId, Guid orderId, CancellationToken cancellationToken = default)
    {
        try
        {
            var response = await httpClient.PostAsJsonAsync("/api/v1/procurement/requisitions/from-bom", new { companyId, orderId }, cancellationToken);
            return response.IsSuccessStatusCode ? await response.Content.ReadFromJsonAsync<Guid>(cancellationToken) : null;
        }
        catch (HttpRequestException)
        {
            return null;
        }
    }

    public async Task<Guid?> CreatePurchaseOrderFromRequisitionAsync(Guid companyId, Guid requisitionId, CancellationToken cancellationToken = default)
    {
        try
        {
            var response = await httpClient.PostAsJsonAsync($"/api/v1/procurement/requisitions/{requisitionId}/create-po", new { companyId }, cancellationToken);
            return response.IsSuccessStatusCode ? await response.Content.ReadFromJsonAsync<Guid>(cancellationToken) : null;
        }
        catch (HttpRequestException)
        {
            return null;
        }
    }
}

public sealed class ProductionServiceClient(HttpClient httpClient) : IProductionServiceClient
{
    public async Task<string?> GetOrderProductionStatusAsync(Guid companyId, Guid orderId, CancellationToken cancellationToken = default)
    {
        try
        {
            return await httpClient.GetStringAsync($"/api/production/orders/{orderId}/status?companyId={companyId}", cancellationToken);
        }
        catch (HttpRequestException)
        {
            return null;
        }
    }
}

public sealed class ShipmentServiceClient(HttpClient httpClient) : IShipmentServiceClient
{
    public async Task<string?> GetShipmentStatusAsync(Guid companyId, Guid orderId, CancellationToken cancellationToken = default)
    {
        try
        {
            return await httpClient.GetStringAsync($"/api/shipments/orders/{orderId}/status?companyId={companyId}", cancellationToken);
        }
        catch (HttpRequestException)
        {
            return null;
        }
    }
}
