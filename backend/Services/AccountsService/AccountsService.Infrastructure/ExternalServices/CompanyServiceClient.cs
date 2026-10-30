using AccountsService.Application;

namespace AccountsService.Infrastructure.ExternalServices;

public sealed class CompanyServiceClient(HttpClient httpClient) : ICompanyServiceClient
{
    public async Task<bool> CompanyExistsAsync(Guid companyId, CancellationToken cancellationToken = default)
    {
        try
        {
            var response = await httpClient.GetAsync($"/api/companies/{companyId}", cancellationToken);
            return response.IsSuccessStatusCode;
        }
        catch (HttpRequestException)
        {
            return true;
        }
    }
}
