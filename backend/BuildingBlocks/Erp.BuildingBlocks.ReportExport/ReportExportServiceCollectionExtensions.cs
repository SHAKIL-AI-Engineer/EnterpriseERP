using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Erp.BuildingBlocks.ReportExport;

public static class ReportExportServiceCollectionExtensions
{
    public static IServiceCollection AddReportExportClient(this IServiceCollection services, IConfiguration configuration, string moduleSegment)
    {
        var baseUrl = configuration["ImportExport:BaseUrl"]
            ?? configuration["Services:ImportExportService"]
            ?? "http://127.0.0.1:8060";

        var clientName = $"ReportExport:{moduleSegment}";
        services.AddHttpClient(clientName, c => c.BaseAddress = new Uri(baseUrl));
        services.AddTransient<IReportExportClient>(sp =>
        {
            var factory = sp.GetRequiredService<IHttpClientFactory>();
            return new ReportExportClient(factory.CreateClient(clientName), moduleSegment);
        });

        return services;
    }
}
