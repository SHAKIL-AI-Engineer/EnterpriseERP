using Erp.BuildingBlocks.ReportExport;
using Microsoft.AspNetCore.Mvc;

namespace Erp.BuildingBlocks.ReportExport.Mvc;

public static class ReportExportControllerExtensions
{
    public static async Task<IActionResult> ExportFileAsync(
        this ControllerBase controller,
        IReportExportClient exporter,
        ReportExportRequestDto request,
        CancellationToken cancellationToken)
    {
        var bearer = controller.Request.Headers.Authorization.ToString();
        var companyId = controller.Request.Headers["X-Company-Id"].ToString();
        if (string.IsNullOrWhiteSpace(companyId)
            && controller.Request.Query.TryGetValue("companyId", out var queryCompanyId))
        {
            companyId = queryCompanyId.ToString();
        }
        if (string.IsNullOrWhiteSpace(companyId)
            && request.Meta is not null
            && request.Meta.TryGetValue("CompanyId", out var metaCompanyId)
            && !string.IsNullOrWhiteSpace(metaCompanyId))
        {
            companyId = metaCompanyId;
        }
        if (string.IsNullOrWhiteSpace(companyId))
        {
            companyId = null;
        }

        var file = await exporter.ExportAsync(request, bearer, companyId, cancellationToken);
        return controller.File(file.Content, file.ContentType, file.FileName);
    }

    public static string NormalizeFormat(string? format) =>
        format?.Equals("pdf", StringComparison.OrdinalIgnoreCase) == true ? "PDF" : "Excel";
}
