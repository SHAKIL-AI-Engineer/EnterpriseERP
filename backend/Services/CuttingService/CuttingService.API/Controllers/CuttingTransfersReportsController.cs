using Asp.Versioning;
using CuttingService.Application;
using CuttingService.Contracts;
using CuttingService.Domain;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CuttingService.API.Controllers;

[ApiController, ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/cutting-panel-transfers")]
public sealed class CuttingPanelTransfersController(IMediator mediator) : ControllerBase
{
    [HttpPost, Authorize(Policy = CuttingPermissions.TransferCreate)]
    public async Task<ActionResult<ApiResponse<CuttingPanelTransferDto>>> Create(CreatePanelTransferRequest request, CancellationToken ct) => Ok(ApiResponse<CuttingPanelTransferDto>.Ok(await mediator.Send(new CreateCuttingPanelTransferCommand(request), ct), "Panel transfer created."));
    [HttpGet, Authorize]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<CuttingPanelTransferDto>>>> Get([FromQuery] Guid companyId, [FromQuery] Guid? orderId, CancellationToken ct) => Ok(ApiResponse<IReadOnlyList<CuttingPanelTransferDto>>.Ok(await mediator.Send(new GetCuttingPanelTransfersQuery(companyId, orderId), ct)));
    [HttpGet("{id:guid}"), Authorize]
    public async Task<ActionResult<ApiResponse<CuttingPanelTransferDto>>> GetById(Guid id, CancellationToken ct) => Ok(ApiResponse<CuttingPanelTransferDto>.Ok(await mediator.Send(new GetCuttingPanelTransferByIdQuery(id), ct)));
    [HttpPatch("{id:guid}/confirm"), Authorize(Policy = CuttingPermissions.TransferConfirm)]
    public async Task<ActionResult<ApiResponse<CuttingPanelTransferDto>>> Confirm(Guid id, CancellationToken ct) => Ok(ApiResponse<CuttingPanelTransferDto>.Ok(await mediator.Send(new ConfirmCuttingPanelTransferCommand(id), ct), "Panel transfer confirmed."));
    [HttpPatch("{id:guid}/cancel"), Authorize(Policy = CuttingPermissions.TransferConfirm)]
    public async Task<ActionResult<ApiResponse<CuttingPanelTransferDto>>> Cancel(Guid id, CancellationToken ct) => Ok(ApiResponse<CuttingPanelTransferDto>.Ok(await mediator.Send(new CancelCuttingPanelTransferCommand(id), ct), "Panel transfer cancelled."));
}

[ApiController, ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/cutting-reports")]
public sealed class CuttingReportsController(IMediator mediator, IReportExportClient exporter) : ControllerBase
{
    private static readonly string[] ExportColumns = ["ReportType", "CompanyId", "OrderId", "PlanNo", "Date", "Color", "Size", "Quantity", "WastageQty", "Status"];

    [HttpGet, Authorize(Policy = CuttingPermissions.ReportView)]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<CuttingReportRowDto>>>> Get([FromQuery] Guid companyId, [FromQuery] Guid? orderId, [FromQuery] string reportType, [FromQuery] DateOnly? fromDate, [FromQuery] DateOnly? toDate, CancellationToken ct) =>
        Ok(ApiResponse<IReadOnlyList<CuttingReportRowDto>>.Ok(await mediator.Send(new GetCuttingReportQuery(companyId, orderId, reportType, fromDate, toDate), ct)));

    [HttpPost("export"), Authorize(Policy = CuttingPermissions.ReportView)]
    public Task<IActionResult> Export(CuttingReportExportRequest request, CancellationToken ct) =>
        ExportReportAsync(request.ReportType, request.Format, request.CompanyId, request.OrderId, request.FromDate, request.ToDate, ct);

    [HttpGet("cutting-plan/export.xlsx"), Authorize(Policy = CuttingPermissions.ReportView)]
    public Task<IActionResult> ExportCuttingPlanExcel([FromQuery] Guid companyId, [FromQuery] Guid? orderId, [FromQuery] DateOnly? fromDate, [FromQuery] DateOnly? toDate, CancellationToken ct) =>
        ExportReportAsync("Cutting Plan", "Excel", companyId, orderId, fromDate, toDate, ct);

    [HttpGet("cutting-plan/export.pdf"), Authorize(Policy = CuttingPermissions.ReportView)]
    public Task<IActionResult> ExportCuttingPlanPdf([FromQuery] Guid companyId, [FromQuery] Guid? orderId, [FromQuery] DateOnly? fromDate, [FromQuery] DateOnly? toDate, CancellationToken ct) =>
        ExportReportAsync("Cutting Plan", "PDF", companyId, orderId, fromDate, toDate, ct);

    [HttpGet("cutting-output/export.xlsx"), Authorize(Policy = CuttingPermissions.ReportView)]
    public Task<IActionResult> ExportCuttingOutputExcel([FromQuery] Guid companyId, [FromQuery] Guid? orderId, [FromQuery] DateOnly? fromDate, [FromQuery] DateOnly? toDate, CancellationToken ct) =>
        ExportReportAsync("Cutting Output", "Excel", companyId, orderId, fromDate, toDate, ct);

    [HttpGet("cutting-output/export.pdf"), Authorize(Policy = CuttingPermissions.ReportView)]
    public Task<IActionResult> ExportCuttingOutputPdf([FromQuery] Guid companyId, [FromQuery] Guid? orderId, [FromQuery] DateOnly? fromDate, [FromQuery] DateOnly? toDate, CancellationToken ct) =>
        ExportReportAsync("Cutting Output", "PDF", companyId, orderId, fromDate, toDate, ct);

    [HttpGet("cutting-balance/export.xlsx"), Authorize(Policy = CuttingPermissions.ReportView)]
    public Task<IActionResult> ExportCuttingBalanceExcel([FromQuery] Guid companyId, [FromQuery] Guid? orderId, CancellationToken ct) =>
        ExportReportAsync("Cutting Balance", "Excel", companyId, orderId, null, null, ct);

    [HttpGet("cutting-balance/export.pdf"), Authorize(Policy = CuttingPermissions.ReportView)]
    public Task<IActionResult> ExportCuttingBalancePdf([FromQuery] Guid companyId, [FromQuery] Guid? orderId, CancellationToken ct) =>
        ExportReportAsync("Cutting Balance", "PDF", companyId, orderId, null, null, ct);

    [HttpGet("cutting-wastage/export.xlsx"), Authorize(Policy = CuttingPermissions.ReportView)]
    public Task<IActionResult> ExportCuttingWastageExcel([FromQuery] Guid companyId, [FromQuery] Guid? orderId, [FromQuery] DateOnly? fromDate, [FromQuery] DateOnly? toDate, CancellationToken ct) =>
        ExportReportAsync("Cutting Wastage", "Excel", companyId, orderId, fromDate, toDate, ct);

    [HttpGet("cutting-wastage/export.pdf"), Authorize(Policy = CuttingPermissions.ReportView)]
    public Task<IActionResult> ExportCuttingWastagePdf([FromQuery] Guid companyId, [FromQuery] Guid? orderId, [FromQuery] DateOnly? fromDate, [FromQuery] DateOnly? toDate, CancellationToken ct) =>
        ExportReportAsync("Cutting Wastage", "PDF", companyId, orderId, fromDate, toDate, ct);

    [HttpGet("lay/export.xlsx"), Authorize(Policy = CuttingPermissions.ReportView)]
    public Task<IActionResult> ExportLayExcel([FromQuery] Guid companyId, [FromQuery] Guid? orderId, [FromQuery] DateOnly? fromDate, [FromQuery] DateOnly? toDate, CancellationToken ct) =>
        ExportReportAsync("Lay Report", "Excel", companyId, orderId, fromDate, toDate, ct);

    [HttpGet("lay/export.pdf"), Authorize(Policy = CuttingPermissions.ReportView)]
    public Task<IActionResult> ExportLayPdf([FromQuery] Guid companyId, [FromQuery] Guid? orderId, [FromQuery] DateOnly? fromDate, [FromQuery] DateOnly? toDate, CancellationToken ct) =>
        ExportReportAsync("Lay Report", "PDF", companyId, orderId, fromDate, toDate, ct);

    [HttpGet("color-size-cutting/export.xlsx"), Authorize(Policy = CuttingPermissions.ReportView)]
    public Task<IActionResult> ExportColorSizeCuttingExcel([FromQuery] Guid companyId, [FromQuery] Guid? orderId, [FromQuery] DateOnly? fromDate, [FromQuery] DateOnly? toDate, CancellationToken ct) =>
        ExportReportAsync("Color Size Cutting", "Excel", companyId, orderId, fromDate, toDate, ct);

    [HttpGet("color-size-cutting/export.pdf"), Authorize(Policy = CuttingPermissions.ReportView)]
    public Task<IActionResult> ExportColorSizeCuttingPdf([FromQuery] Guid companyId, [FromQuery] Guid? orderId, [FromQuery] DateOnly? fromDate, [FromQuery] DateOnly? toDate, CancellationToken ct) =>
        ExportReportAsync("Color Size Cutting", "PDF", companyId, orderId, fromDate, toDate, ct);

    [HttpGet("order-wise-summary/export.xlsx"), Authorize(Policy = CuttingPermissions.ReportView)]
    public Task<IActionResult> ExportOrderWiseSummaryExcel([FromQuery] Guid companyId, [FromQuery] Guid? orderId, CancellationToken ct) =>
        ExportReportAsync("Order Wise Cutting Summary", "Excel", companyId, orderId, null, null, ct);

    [HttpGet("order-wise-summary/export.pdf"), Authorize(Policy = CuttingPermissions.ReportView)]
    public Task<IActionResult> ExportOrderWiseSummaryPdf([FromQuery] Guid companyId, [FromQuery] Guid? orderId, CancellationToken ct) =>
        ExportReportAsync("Order Wise Cutting Summary", "PDF", companyId, orderId, null, null, ct);

    [HttpGet("panel-transfer/export.xlsx"), Authorize(Policy = CuttingPermissions.ReportView)]
    public Task<IActionResult> ExportPanelTransferExcel([FromQuery] Guid companyId, [FromQuery] Guid? orderId, [FromQuery] DateOnly? fromDate, [FromQuery] DateOnly? toDate, CancellationToken ct) =>
        ExportReportAsync("Panel Transfer", "Excel", companyId, orderId, fromDate, toDate, ct);

    [HttpGet("panel-transfer/export.pdf"), Authorize(Policy = CuttingPermissions.ReportView)]
    public Task<IActionResult> ExportPanelTransferPdf([FromQuery] Guid companyId, [FromQuery] Guid? orderId, [FromQuery] DateOnly? fromDate, [FromQuery] DateOnly? toDate, CancellationToken ct) =>
        ExportReportAsync("Panel Transfer", "PDF", companyId, orderId, fromDate, toDate, ct);

    [HttpGet("daily-cutting-production/export.xlsx"), Authorize(Policy = CuttingPermissions.ReportView)]
    public Task<IActionResult> ExportDailyCuttingProductionExcel([FromQuery] Guid companyId, [FromQuery] Guid? orderId, [FromQuery] DateOnly date, CancellationToken ct) =>
        ExportReportAsync("Daily Cutting Production", "Excel", companyId, orderId, date, date, ct);

    [HttpGet("daily-cutting-production/export.pdf"), Authorize(Policy = CuttingPermissions.ReportView)]
    public Task<IActionResult> ExportDailyCuttingProductionPdf([FromQuery] Guid companyId, [FromQuery] Guid? orderId, [FromQuery] DateOnly date, CancellationToken ct) =>
        ExportReportAsync("Daily Cutting Production", "PDF", companyId, orderId, date, date, ct);

    [HttpGet("monthly-cutting-summary/export.xlsx"), Authorize(Policy = CuttingPermissions.ReportView)]
    public Task<IActionResult> ExportMonthlyCuttingSummaryExcel([FromQuery] Guid companyId, [FromQuery] Guid? orderId, [FromQuery] int year, [FromQuery] int month, CancellationToken ct) =>
        ExportReportAsync("Monthly Cutting Summary", "Excel", companyId, orderId, new DateOnly(year, month, 1), new DateOnly(year, month, DateTime.DaysInMonth(year, month)), ct);

    [HttpGet("monthly-cutting-summary/export.pdf"), Authorize(Policy = CuttingPermissions.ReportView)]
    public Task<IActionResult> ExportMonthlyCuttingSummaryPdf([FromQuery] Guid companyId, [FromQuery] Guid? orderId, [FromQuery] int year, [FromQuery] int month, CancellationToken ct) =>
        ExportReportAsync("Monthly Cutting Summary", "PDF", companyId, orderId, new DateOnly(year, month, 1), new DateOnly(year, month, DateTime.DaysInMonth(year, month)), ct);

    private async Task<IActionResult> ExportReportAsync(string reportType, string format, Guid companyId, Guid? orderId, DateOnly? fromDate, DateOnly? toDate, CancellationToken ct)
    {
        var rows = await mediator.Send(new GetCuttingReportQuery(companyId, orderId, reportType, fromDate, toDate), ct);
        var exportRows = rows.Select(x => (IReadOnlyList<string>)[x.ReportType, x.CompanyId.ToString(), x.OrderId.ToString(), x.PlanNo ?? "", x.Date.ToString("yyyy-MM-dd"), x.ColorName ?? "", x.SizeName, x.Quantity.ToString(), x.WastageQty.ToString("0.####"), x.Status ?? ""]).ToList();
        var file = await exporter.ExportAsync(
            $"Cutting {reportType} Report",
            format,
            ExportColumns,
            exportRows,
            Request.Headers.Authorization.ToString(),
            ct);
        return File(file.Content, file.ContentType, file.FileName);
    }
}
