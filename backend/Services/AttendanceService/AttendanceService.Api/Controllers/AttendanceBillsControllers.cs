using AttendanceService.Application.Common.Interfaces;
using AttendanceService.Application.DTOs;
using Erp.BuildingBlocks.CommonResponses;
using Erp.BuildingBlocks.ReportExport;
using Erp.BuildingBlocks.ReportExport.Mvc;
using Microsoft.AspNetCore.Mvc;

namespace AttendanceService.Api.Controllers;

public abstract class AttendanceBillsControllerBase(IAttendanceBillService bills, string billType, IReportExportClient exporter) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<ApiResponse<BillResponseDto>>> List(
        [FromQuery] Guid companyId,
        [FromQuery] DateTime fromDate,
        [FromQuery] DateTime toDate,
        [FromQuery] Guid? departmentId = null,
        [FromQuery] string? employeeType = null,
        [FromQuery] string? searchTerm = null)
    {
        var data = await bills.GetAsync(
            billType,
            new BillQuery(companyId, fromDate, toDate, departmentId, employeeType, searchTerm));
        return Ok(ApiResponse<BillResponseDto>.Ok(data, HttpContext.TraceIdentifier));
    }

    [HttpPost("process")]
    public async Task<ActionResult<ApiResponse<int>>> Process([FromBody] ProcessBillsRequest request)
    {
        var count = await bills.ProcessAsync(billType, request);
        return Ok(ApiResponse<int>.Ok(count, HttpContext.TraceIdentifier));
    }

    [HttpDelete("{id:int}")]
    public async Task<ActionResult<ApiResponse<bool>>> Delete(int id)
    {
        var ok = await bills.DeleteAsync(billType, id);
        return Ok(ApiResponse<bool>.Ok(ok, HttpContext.TraceIdentifier));
    }

    [HttpPost("delete-multiple")]
    public async Task<ActionResult<ApiResponse<int>>> DeleteMultiple([FromBody] DeleteMultipleBillsRequest request)
    {
        var count = await bills.DeleteMultipleAsync(billType, request.Ids);
        return Ok(ApiResponse<int>.Ok(count, HttpContext.TraceIdentifier));
    }

    [HttpGet("export")]
    public async Task<IActionResult> Export(
        [FromQuery] Guid companyId,
        [FromQuery] DateTime fromDate,
        [FromQuery] DateTime toDate,
        [FromQuery] Guid? departmentId = null,
        [FromQuery] string? employeeType = null,
        [FromQuery] string? searchTerm = null)
    {
        var bytes = await bills.ExportCsvAsync(
            billType,
            new BillQuery(companyId, fromDate, toDate, departmentId, employeeType, searchTerm));
        return File(bytes, "text/csv", $"{billType.ToLowerInvariant()}-bills-{fromDate:yyyyMMdd}.csv");
    }

    [HttpGet("export.{format}")]
    public async Task<IActionResult> ExportFormatted(
        [FromQuery] Guid companyId,
        [FromQuery] DateTime fromDate,
        [FromQuery] DateTime toDate,
        string format,
        [FromQuery] Guid? departmentId = null,
        [FromQuery] string? employeeType = null,
        [FromQuery] string? searchTerm = null,
        CancellationToken cancellationToken = default)
    {
        var data = await bills.GetAsync(
            billType,
            new BillQuery(companyId, fromDate, toDate, departmentId, employeeType, searchTerm));
        var request = ReportExportMapper.Build(
            $"{billType} Bills",
            ReportExportControllerExtensions.NormalizeFormat(format),
            data.Records,
            [
                new ReportColumn<BillDto>("Employee ID", r => r.EmployeeId),
                new ReportColumn<BillDto>("Name", r => r.EmployeeName),
                new ReportColumn<BillDto>("Department", r => r.Department),
                new ReportColumn<BillDto>("Designation", r => r.Designation),
                new ReportColumn<BillDto>("Date", r => r.Date),
                new ReportColumn<BillDto>("Amount", r => r.Amount.ToString("0.00")),
                new ReportColumn<BillDto>("Status", r => r.Status),
                new ReportColumn<BillDto>("Shift", r => r.ShiftName),
            ],
            ReportExportMapper.MetaWithFilters(new Dictionary<string, string>
            {
                ["CompanyId"] = companyId.ToString(),
                ["FromDate"] = fromDate.ToString("yyyy-MM-dd"),
                ["ToDate"] = toDate.ToString("yyyy-MM-dd"),
                ["TotalAmount"] = data.Summary.TotalAmount.ToString("0.00"),
                ["TotalRecords"] = data.Summary.TotalRecords.ToString(),
            }));
        return await this.ExportFileAsync(exporter, request, cancellationToken);
    }
}

[ApiController]
[Route("api/v1/night-bills")]
public sealed class NightBillsController(IAttendanceBillService bills, IReportExportClient exporter)
    : AttendanceBillsControllerBase(bills, "Night", exporter);

[ApiController]
[Route("api/v1/tiffin-bills")]
public sealed class TiffinBillsController(IAttendanceBillService bills, IReportExportClient exporter)
    : AttendanceBillsControllerBase(bills, "Tiffin", exporter);

[ApiController]
[Route("api/v1/ifter-bills")]
public sealed class IfterBillsController(IAttendanceBillService bills, IReportExportClient exporter)
    : AttendanceBillsControllerBase(bills, "Ifter", exporter);

[ApiController]
[Route("api/v1/holiday-bills")]
public sealed class HolidayBillsController(IAttendanceBillService bills, IReportExportClient exporter)
    : AttendanceBillsControllerBase(bills, "Holiday", exporter);
