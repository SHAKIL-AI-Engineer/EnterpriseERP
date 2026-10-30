using Asp.Versioning;
using FinishingService.Application;
using FinishingService.Contracts;
using FinishingService.Domain;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FinishingService.API.Controllers;

[ApiController, ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/finishing-reports")]
public sealed class FinishingReportsController(IMediator mediator, IReportExportClient exporter) : ControllerBase
{
    private static readonly string[] ExportColumns = ["ReportType", "CompanyId", "OrderId", "ReferenceNo", "Date", "Color", "Size", "Quantity", "WastageQty", "Status"];

    [HttpGet("balances"), Authorize(Policy = FinishingPermissions.BalanceView)]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<FinishingBalanceDto>>>> GetBalances([FromQuery] Guid companyId, [FromQuery] Guid? orderId, CancellationToken ct) =>
        Ok(ApiResponse<IReadOnlyList<FinishingBalanceDto>>.Ok(await mediator.Send(new GetFinishingBalancesQuery(companyId, orderId), ct)));

    [HttpGet, Authorize(Policy = FinishingPermissions.ReportView)]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<FinishingReportRowDto>>>> GetReport(
        [FromQuery] Guid companyId, 
        [FromQuery] Guid? orderId, 
        [FromQuery] string reportType, 
        [FromQuery] DateOnly? fromDate, 
        [FromQuery] DateOnly? toDate, 
        CancellationToken ct) =>
        Ok(ApiResponse<IReadOnlyList<FinishingReportRowDto>>.Ok(await mediator.Send(new GetFinishingReportQuery(companyId, orderId, reportType, fromDate, toDate), ct)));

    [HttpPost("export"), Authorize(Policy = FinishingPermissions.ReportView)]
    public Task<IActionResult> Export(FinishingReportExportRequest request, CancellationToken ct) =>
        ExportReportAsync(request.ReportType, request.Format, request.CompanyId, request.OrderId, request.FromDate, request.ToDate, ct);

    [HttpGet("finishing-receive/export.xlsx"), Authorize(Policy = FinishingPermissions.ReportView)]
    public Task<IActionResult> ExportReceiveExcel([FromQuery] Guid companyId, [FromQuery] Guid? orderId, [FromQuery] DateOnly? fromDate, [FromQuery] DateOnly? toDate, CancellationToken ct) =>
        ExportReportAsync("Finishing Receive", "Excel", companyId, orderId, fromDate, toDate, ct);

    [HttpGet("finishing-receive/export.pdf"), Authorize(Policy = FinishingPermissions.ReportView)]
    public Task<IActionResult> ExportReceivePdf([FromQuery] Guid companyId, [FromQuery] Guid? orderId, [FromQuery] DateOnly? fromDate, [FromQuery] DateOnly? toDate, CancellationToken ct) =>
        ExportReportAsync("Finishing Receive", "PDF", companyId, orderId, fromDate, toDate, ct);

    [HttpGet("folding-packing/export.xlsx"), Authorize(Policy = FinishingPermissions.ReportView)]
    public Task<IActionResult> ExportFoldingExcel([FromQuery] Guid companyId, [FromQuery] Guid? orderId, [FromQuery] DateOnly? fromDate, [FromQuery] DateOnly? toDate, CancellationToken ct) =>
        ExportReportAsync("Folding Packing", "Excel", companyId, orderId, fromDate, toDate, ct);

    [HttpGet("folding-packing/export.pdf"), Authorize(Policy = FinishingPermissions.ReportView)]
    public Task<IActionResult> ExportFoldingPdf([FromQuery] Guid companyId, [FromQuery] Guid? orderId, [FromQuery] DateOnly? fromDate, [FromQuery] DateOnly? toDate, CancellationToken ct) =>
        ExportReportAsync("Folding Packing", "PDF", companyId, orderId, fromDate, toDate, ct);

    [HttpGet("carton-packing/export.xlsx"), Authorize(Policy = FinishingPermissions.ReportView)]
    public Task<IActionResult> ExportCartonExcel([FromQuery] Guid companyId, [FromQuery] Guid? orderId, [FromQuery] DateOnly? fromDate, [FromQuery] DateOnly? toDate, CancellationToken ct) =>
        ExportReportAsync("Carton Packing", "Excel", companyId, orderId, fromDate, toDate, ct);

    [HttpGet("carton-packing/export.pdf"), Authorize(Policy = FinishingPermissions.ReportView)]
    public Task<IActionResult> ExportCartonPdf([FromQuery] Guid companyId, [FromQuery] Guid? orderId, [FromQuery] DateOnly? fromDate, [FromQuery] DateOnly? toDate, CancellationToken ct) =>
        ExportReportAsync("Carton Packing", "PDF", companyId, orderId, fromDate, toDate, ct);

    [HttpGet("transfer/export.xlsx"), Authorize(Policy = FinishingPermissions.ReportView)]
    public Task<IActionResult> ExportTransferExcel([FromQuery] Guid companyId, [FromQuery] Guid? orderId, [FromQuery] DateOnly? fromDate, [FromQuery] DateOnly? toDate, CancellationToken ct) =>
        ExportReportAsync("Finished Goods Transfer", "Excel", companyId, orderId, fromDate, toDate, ct);

    [HttpGet("transfer/export.pdf"), Authorize(Policy = FinishingPermissions.ReportView)]
    public Task<IActionResult> ExportTransferPdf([FromQuery] Guid companyId, [FromQuery] Guid? orderId, [FromQuery] DateOnly? fromDate, [FromQuery] DateOnly? toDate, CancellationToken ct) =>
        ExportReportAsync("Finished Goods Transfer", "PDF", companyId, orderId, fromDate, toDate, ct);

    [HttpGet("wastage/export.xlsx"), Authorize(Policy = FinishingPermissions.ReportView)]
    public Task<IActionResult> ExportWastageExcel([FromQuery] Guid companyId, [FromQuery] Guid? orderId, [FromQuery] DateOnly? fromDate, [FromQuery] DateOnly? toDate, CancellationToken ct) =>
        ExportReportAsync("Finishing Wastage", "Excel", companyId, orderId, fromDate, toDate, ct);

    [HttpGet("wastage/export.pdf"), Authorize(Policy = FinishingPermissions.ReportView)]
    public Task<IActionResult> ExportWastagePdf([FromQuery] Guid companyId, [FromQuery] Guid? orderId, [FromQuery] DateOnly? fromDate, [FromQuery] DateOnly? toDate, CancellationToken ct) =>
        ExportReportAsync("Finishing Wastage", "PDF", companyId, orderId, fromDate, toDate, ct);

    [HttpGet("balance/export.xlsx"), Authorize(Policy = FinishingPermissions.ReportView)]
    public Task<IActionResult> ExportBalanceExcel([FromQuery] Guid companyId, [FromQuery] Guid? orderId, CancellationToken ct) =>
        ExportReportAsync("Finishing Summary Report", "Excel", companyId, orderId, null, null, ct);

    [HttpGet("balance/export.pdf"), Authorize(Policy = FinishingPermissions.ReportView)]
    public Task<IActionResult> ExportBalancePdf([FromQuery] Guid companyId, [FromQuery] Guid? orderId, CancellationToken ct) =>
        ExportReportAsync("Finishing Summary Report", "PDF", companyId, orderId, null, null, ct);

    private async Task<IActionResult> ExportReportAsync(string reportType, string format, Guid companyId, Guid? orderId, DateOnly? fromDate, DateOnly? toDate, CancellationToken ct)
    {
        var rows = await mediator.Send(new GetFinishingReportQuery(companyId, orderId, reportType, fromDate, toDate), ct);
        var exportRows = rows.Select(x => (IReadOnlyList<string>)[
            x.ReportType,
            x.CompanyId.ToString(),
            x.OrderId.ToString(),
            x.ReferenceNo ?? "",
            x.Date.ToString("yyyy-MM-dd"),
            x.ColorName ?? "",
            x.SizeName ?? "",
            x.Quantity.ToString(),
            x.WastageQty.ToString(),
            x.Status ?? ""
        ]).ToList();

        var file = await exporter.ExportAsync(
            $"Finishing {reportType} Report",
            format,
            ExportColumns,
            exportRows,
            Request.Headers.Authorization.ToString(),
            ct);

        return File(file.Content, file.ContentType, file.FileName);
    }
}
