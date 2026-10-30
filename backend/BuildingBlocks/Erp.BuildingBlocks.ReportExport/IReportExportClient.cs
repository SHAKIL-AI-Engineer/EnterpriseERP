namespace Erp.BuildingBlocks.ReportExport;

public interface IReportExportClient
{
    Task<ReportExportFile> ExportAsync(ReportExportRequestDto request, string? bearerToken, string? companyId = null, CancellationToken cancellationToken = default);
}
