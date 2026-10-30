using System.Net.Http.Json;
using SecurityService.Application;
using SecurityService.Contracts;

namespace SecurityService.Infrastructure.ExternalServices;

public sealed class EmployeeServiceClient(HttpClient client) : IEmployeeServiceClient
{
    public Task<object?> GetEmployeeAsync(Guid companyId, Guid employeeId, CancellationToken cancellationToken = default) =>
        client.GetFromJsonAsync<object>($"/api/v1/employees/{employeeId}?companyId={companyId}", cancellationToken);

    public async Task<bool> IsEmployeeActiveAsync(Guid companyId, Guid employeeId, CancellationToken cancellationToken = default)
    {
        var employee = await GetEmployeeAsync(companyId, employeeId, cancellationToken);
        return employee is not null;
    }
}

public sealed class InventoryServiceClient(HttpClient client) : IInventoryServiceClient
{
    public Task<object?> GetStockIssueAsync(Guid companyId, Guid issueId, CancellationToken cancellationToken = default) =>
        client.GetFromJsonAsync<object>($"/api/v1/stock-issues/{issueId}?companyId={companyId}", cancellationToken);
}

public sealed class ProcurementServiceClient(HttpClient client) : IProcurementServiceClient
{
    public Task<object?> GetSupplierAsync(Guid companyId, Guid supplierId, CancellationToken cancellationToken = default) =>
        client.GetFromJsonAsync<object>($"/api/v1/suppliers/{supplierId}?companyId={companyId}", cancellationToken);
}

public sealed class MerchandisingServiceClient(HttpClient client) : IMerchandisingServiceClient
{
    public Task<object?> GetBuyerAsync(Guid companyId, Guid buyerId, CancellationToken cancellationToken = default) =>
        client.GetFromJsonAsync<object>($"/api/v1/buyers/{buyerId}?companyId={companyId}", cancellationToken);

    public Task<object?> GetOrderAsync(Guid companyId, Guid orderId, CancellationToken cancellationToken = default) =>
        client.GetFromJsonAsync<object>($"/api/v1/orders/{orderId}?companyId={companyId}", cancellationToken);
}

public sealed class AccountsServiceClient(HttpClient client) : IAccountsServiceClient
{
    public async Task CreatePayableFromBillEntryAsync(Guid companyId, Guid billEntryId, CancellationToken cancellationToken = default)
    {
        var response = await client.PostAsJsonAsync($"/api/v1/payables/from-security-bill", new { companyId, billEntryId }, cancellationToken);
        response.EnsureSuccessStatusCode();
    }
}

public sealed class ImportExportServiceClient(HttpClient client) : IImportExportServiceClient
{
    public async Task<ExportResultDto> ExportGateReportAsync(ReportExportRequest request, CancellationToken cancellationToken = default)
    {
        var response = await client.PostAsJsonAsync("/api/v1/exports/gate-reports", request, cancellationToken);
        if (!response.IsSuccessStatusCode)
        {
            return new ExportResultDto(Guid.NewGuid().ToString("N"), "QueuedFallback", null);
        }

        return await response.Content.ReadFromJsonAsync<ExportResultDto>(cancellationToken: cancellationToken)
            ?? new ExportResultDto(Guid.NewGuid().ToString("N"), "Queued", null);
    }
}
