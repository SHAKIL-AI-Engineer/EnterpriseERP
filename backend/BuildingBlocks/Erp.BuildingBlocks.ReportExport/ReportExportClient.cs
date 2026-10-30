using System.Net.Http.Headers;
using System.Net.Http.Json;

namespace Erp.BuildingBlocks.ReportExport;

public sealed class ReportExportClient(HttpClient httpClient, string moduleSegment) : IReportExportClient
{
    public async Task<ReportExportFile> ExportAsync(ReportExportRequestDto request, string? bearerToken, string? companyId = null, CancellationToken cancellationToken = default)
    {
        var segment = string.IsNullOrWhiteSpace(moduleSegment) ? "reports" : moduleSegment.Trim('/');
        using var message = new HttpRequestMessage(HttpMethod.Post, $"/api/v1/import-export/reports/{segment}/export")
        {
            Content = JsonContent.Create(request),
        };

        if (!string.IsNullOrWhiteSpace(bearerToken))
        {
            message.Headers.Authorization = AuthenticationHeaderValue.Parse(bearerToken);
        }

        if (!string.IsNullOrWhiteSpace(companyId))
        {
            message.Headers.TryAddWithoutValidation("X-Company-Id", companyId.Trim());
        }

        using var response = await httpClient.SendAsync(message, cancellationToken);
        if (!response.IsSuccessStatusCode)
        {
            var body = await response.Content.ReadAsStringAsync(cancellationToken);
            throw new InvalidOperationException($"ImportExportService failed to export report: {(int)response.StatusCode} {body}");
        }

        var bytes = await response.Content.ReadAsByteArrayAsync(cancellationToken);
        var contentType = response.Content.Headers.ContentType?.MediaType ?? "application/octet-stream";
        var fileName = response.Content.Headers.ContentDisposition?.FileNameStar
            ?? response.Content.Headers.ContentDisposition?.FileName?.Trim('"')
            ?? BuildFileName(request.Title, request.Format);
        return new ReportExportFile(bytes, contentType, fileName);
    }

    private static string BuildFileName(string title, string format)
    {
        var extension = format.Equals("PDF", StringComparison.OrdinalIgnoreCase) ? "pdf" : "xlsx";
        var safe = string.Join("-", title.ToLowerInvariant().Split(Path.GetInvalidFileNameChars(), StringSplitOptions.RemoveEmptyEntries)).Replace(' ', '-');
        return $"{safe}.{extension}";
    }
}
