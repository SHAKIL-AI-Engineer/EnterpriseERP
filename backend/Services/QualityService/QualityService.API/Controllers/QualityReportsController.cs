using Asp.Versioning;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QualityService.Application;
using QualityService.Contracts;
using QualityService.Domain;

namespace QualityService.API.Controllers;

[ApiController, ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/quality-reports")]
public sealed class QualityReportsController(IMediator mediator, IImportExportServiceClient exporter) : ControllerBase
{
    private static readonly string[] ExportColumns = [
        "ReportType", "CompanyId", "OrderId", "ReferenceNo", "Date", 
        "ColorName", "SizeName", "InspectedQty", "PassedQty", 
        "DefectQty", "ReworkQty", "RejectQty", "Result", "Details"
    ];

    [HttpGet("defect-summary"), Authorize(Policy = QualityPermissions.ReportView)]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<QualityReportRowDto>>>> GetDefectSummary(
        [FromQuery] Guid companyId,
        [FromQuery] DateOnly? fromDate,
        [FromQuery] DateOnly? toDate,
        CancellationToken ct) =>
        Ok(ApiResponse<IReadOnlyList<QualityReportRowDto>>.Ok(await mediator.Send(new GetDefectSummaryReportQuery(companyId, fromDate, toDate), ct)));

    [HttpGet("order-quality"), Authorize(Policy = QualityPermissions.ReportView)]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<QualityReportRowDto>>>> GetOrderQuality(
        [FromQuery] Guid companyId,
        [FromQuery] Guid orderId,
        CancellationToken ct) =>
        Ok(ApiResponse<IReadOnlyList<QualityReportRowDto>>.Ok(await mediator.Send(new GetOrderQualityReportQuery(companyId, orderId), ct)));

    [HttpGet("aql-summary"), Authorize(Policy = QualityPermissions.ReportView)]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<QualityReportRowDto>>>> GetAqlSummary(
        [FromQuery] Guid companyId,
        [FromQuery] DateOnly? fromDate,
        [FromQuery] DateOnly? toDate,
        CancellationToken ct) =>
        Ok(ApiResponse<IReadOnlyList<QualityReportRowDto>>.Ok(await mediator.Send(new GetAqlSummaryReportQuery(companyId, fromDate, toDate), ct)));

    [HttpPost("export"), Authorize(Policy = QualityPermissions.ReportExport)]
    public Task<IActionResult> Export(QualityReportExportRequest request, CancellationToken ct) =>
        ExportReportAsync(request.ReportType, request.Format, request.CompanyId, request.OrderId, request.FromDate, request.ToDate, ct);

    private async Task<IActionResult> ExportReportAsync(string reportType, string format, Guid companyId, Guid? orderId, DateOnly? fromDate, DateOnly? toDate, CancellationToken ct)
    {
        var rows = await mediator.Send(new GetQualityReportQuery(companyId, orderId, reportType, fromDate, toDate), ct);
        var exportRows = rows.Select(x => (IReadOnlyList<string>)[
            x.ReportType,
            x.CompanyId.ToString(),
            x.OrderId.ToString(),
            x.ReferenceNo ?? "",
            x.Date.ToString("yyyy-MM-dd"),
            x.ColorName ?? "",
            x.SizeName ?? "",
            x.InspectedQty.ToString(),
            x.PassedQty.ToString(),
            x.DefectQty.ToString(),
            x.ReworkQty.ToString(),
            x.RejectQty.ToString(),
            x.Result ?? "",
            x.Details ?? ""
        ]).ToList();

        var file = await exporter.ExportAsync(
            $"Quality {reportType} Report",
            format,
            ExportColumns,
            exportRows,
            Request.Headers.Authorization.ToString(),
            ct);

        return File(file.Content, file.ContentType, file.FileName);
    }
}
