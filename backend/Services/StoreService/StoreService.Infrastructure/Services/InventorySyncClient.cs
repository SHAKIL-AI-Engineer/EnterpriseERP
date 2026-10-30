using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using StoreService.Application;

namespace StoreService.Infrastructure.Services;

public sealed class InventorySyncClient(HttpClient http, IConfiguration configuration, ILogger<InventorySyncClient> logger) : IInventorySyncClient
{
    private static readonly JsonSerializerOptions JsonOptions = new() { PropertyNameCaseInsensitive = true };

    public async Task<Guid?> ReceiveAsync(
        Guid companyId, string itemCode, string itemName, string unitName, decimal quantity, string? referenceNo, CancellationToken cancellationToken)
    {
        if (!IsEnabled())
        {
            return null;
        }

        try
        {
            var payload = new { companyId, itemCode, itemName, unitName, quantity, referenceNo };
            using var response = await http.PostAsJsonAsync("api/v1/inventory/receive", payload, cancellationToken);
            if (!response.IsSuccessStatusCode)
            {
                logger.LogWarning("Inventory receive sync failed with status {StatusCode}", response.StatusCode);
                return null;
            }

            var body = await response.Content.ReadFromJsonAsync<InventoryApiResponse<InventoryStockItem>>(JsonOptions, cancellationToken);
            return body?.Data?.Id;
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Inventory receive sync failed.");
            return null;
        }
    }

    public async Task IssueAsync(Guid companyId, Guid inventoryItemId, decimal quantity, string? referenceNo, CancellationToken cancellationToken)
    {
        if (!IsEnabled())
        {
            return;
        }

        try
        {
            var payload = new { companyId, quantity, referenceNo };
            using var response = await http.PostAsJsonAsync($"api/v1/inventory/items/{inventoryItemId}/issue", payload, cancellationToken);
            if (!response.IsSuccessStatusCode)
            {
                logger.LogWarning("Inventory issue sync failed with status {StatusCode}", response.StatusCode);
            }
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Inventory issue sync failed.");
        }
    }

    private bool IsEnabled() => configuration.GetValue("InventorySync:Enabled", true);

    private sealed record InventoryApiResponse<T>(bool Success, T? Data);
    private sealed record InventoryStockItem(Guid Id);
}
