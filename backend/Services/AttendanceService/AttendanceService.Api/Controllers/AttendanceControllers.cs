using System.Globalization;
using System.Text;
using Erp.BuildingBlocks.CommonSecurity;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using AttendanceService.Application.Features.Attendance.Commands;
using AttendanceService.Application.Features.Attendance.Queries;
using AttendanceService.Application.DTOs;
using Erp.BuildingBlocks.CommonResponses;

using Erp.BuildingBlocks.SharedKernel;

namespace AttendanceService.Api.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
[Authorize]
public class AttendanceController(IMediator mediator, ITenantContext tenant) : ControllerBase
{
    [HttpPost("process")]
    [Authorize(Policy = "Permission:attendance.process.write")]
    public async Task<ActionResult<ApiResponse<ProcessDailyAttendanceResult>>> Process(ProcessDailyAttendanceCommand command)
    {
        var result = await mediator.Send(command);
        return Ok(ApiResponse<ProcessDailyAttendanceResult>.Ok(result, HttpContext.TraceIdentifier));
    }

    [HttpPost("process/range")]
    public async Task<ActionResult<ApiResponse<ProcessRangeResult>>> ProcessRange(ProcessDailyAttendanceRangeCommand command)
    {
        var result = await mediator.Send(command);
        return Ok(ApiResponse<ProcessRangeResult>.Ok(result, HttpContext.TraceIdentifier));
    }

    [HttpGet]
    [Authorize(Policy = "Permission:attendance.read")]
    public async Task<ActionResult<ApiResponse<IEnumerable<DailyAttendanceDto>>>> Get(
        [FromQuery] Guid companyId,
        [FromQuery] DateTime fromDate,
        [FromQuery] DateTime toDate,
        [FromQuery] string? employeeID = null)
    {
        companyId = TenantCompanyResolver.ResolveCompanyId(tenant, companyId);
        var data = await mediator.Send(new GetDailyAttendanceQuery(companyId, fromDate, toDate, employeeID));
        return Ok(ApiResponse<IEnumerable<DailyAttendanceDto>>.Ok(data, HttpContext.TraceIdentifier));
    }

    [HttpGet("daily-report")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<DailyReportRowDto>>>> GetDailyReport(
        [FromQuery] AttendanceReportQueryParams q)
    {
        q.CompanyId = TenantCompanyResolver.ResolveCompanyId(tenant, q.CompanyId);
        var data = await mediator.Send(new GetDailyReportQuery(q.ToFilter()));
        return Ok(ApiResponse<IReadOnlyList<DailyReportRowDto>>.Ok(data, HttpContext.TraceIdentifier));
    }

    [HttpGet("daily-report/export/csv")]
    public async Task<IActionResult> ExportDailyReportCsv([FromQuery] AttendanceReportQueryParams q)
    {
        var data = await mediator.Send(new GetDailyReportQuery(q.ToFilter()));
        var csv = BuildDailyReportCsv(data);
        return File(Encoding.UTF8.GetBytes(csv), "text/csv", $"daily-report-{BusinessTime.Now:yyyyMMdd}.csv");
    }

    [HttpGet("daily-summary")]
    public async Task<ActionResult<ApiResponse<DailySummaryReportDto>>> GetDailySummary(
        [FromQuery] AttendanceReportQueryParams q)
    {
        var data = await mediator.Send(new GetDailySummaryReportQuery(q.ToFilter()));
        return Ok(ApiResponse<DailySummaryReportDto>.Ok(data, HttpContext.TraceIdentifier));
    }

    [HttpGet("daily-summary/export/csv")]
    public async Task<IActionResult> ExportDailySummaryCsv([FromQuery] AttendanceReportQueryParams q)
    {
        var data = await mediator.Send(new GetDailySummaryReportQuery(q.ToFilter()));
        var csv = BuildDailySummaryCsv(data);
        return File(Encoding.UTF8.GetBytes(csv), "text/csv", $"daily-summary-{BusinessTime.Now:yyyyMMdd}.csv");
    }

    [HttpGet("job-card/roster")]
    public async Task<ActionResult<ApiResponse<PagedJobCardRosterDto>>> GetJobCardRoster(
        [FromQuery] AttendanceReportQueryParams q,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 1)
    {
        var data = await mediator.Send(new GetJobCardRosterQuery(q.ToFilter(), page, pageSize));
        return Ok(ApiResponse<PagedJobCardRosterDto>.Ok(data, HttpContext.TraceIdentifier));
    }

    [HttpGet("job-card")]
    public async Task<ActionResult<ApiResponse<JobCardReportDto>>> GetJobCard(
        [FromQuery] AttendanceReportQueryParams q,
        [FromQuery] int? employeeCard = null,
        [FromQuery] string? employeeId = null)
    {
        var data = await mediator.Send(new GetJobCardQuery(q.ToFilter(), employeeCard, employeeId));
        if (data is null)
        {
            return NotFound(ApiResponse<JobCardReportDto>.Fail(
                HttpContext.TraceIdentifier,
                [new ApiError("NOT_FOUND", "Employee or attendance not found")]));
        }

        return Ok(ApiResponse<JobCardReportDto>.Ok(data, HttpContext.TraceIdentifier));
    }

    [HttpGet("missing-entries")]
    public async Task<ActionResult<ApiResponse<MissingEntriesReportDto>>> GetMissingEntries(
        [FromQuery] AttendanceReportQueryParams q)
    {
        var data = await mediator.Send(new GetMissingEntriesQuery(q.ToFilter()));
        return Ok(ApiResponse<MissingEntriesReportDto>.Ok(data, HttpContext.TraceIdentifier));
    }

    [HttpGet("absenteeism-records")]
    public async Task<ActionResult<ApiResponse<AbsenteeismReportDto>>> GetAbsenteeism(
        [FromQuery] AttendanceReportQueryParams q)
    {
        var data = await mediator.Send(new GetAbsenteeismRecordsQuery(q.ToFilter()));
        return Ok(ApiResponse<AbsenteeismReportDto>.Ok(data, HttpContext.TraceIdentifier));
    }

    [HttpGet("daily-ot-sheet")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<DailyOtSheetRowDto>>>> GetDailyOtSheet(
        [FromQuery] AttendanceReportQueryParams q)
    {
        var data = await mediator.Send(new GetDailyOtSheetQuery(q.ToFilter()));
        return Ok(ApiResponse<IReadOnlyList<DailyOtSheetRowDto>>.Ok(data, HttpContext.TraceIdentifier));
    }

    [HttpGet("daily-ot-summary")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<DailyOtSummaryRowDto>>>> GetDailyOtSummary(
        [FromQuery] AttendanceReportQueryParams q)
    {
        var data = await mediator.Send(new GetDailyOtSummaryQuery(q.ToFilter()));
        return Ok(ApiResponse<IReadOnlyList<DailyOtSummaryRowDto>>.Ok(data, HttpContext.TraceIdentifier));
    }

    [HttpPost("bulk-adjust")]
    public async Task<ActionResult<ApiResponse<BulkAdjustResult>>> BulkAdjust(BulkAdjustAttendanceCommand command)
    {
        var result = await mediator.Send(command);
        return Ok(ApiResponse<BulkAdjustResult>.Ok(result, HttpContext.TraceIdentifier));
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult<ApiResponse<bool>>> Delete(Guid id, [FromQuery] Guid companyId)
    {
        var success = await mediator.Send(new DeleteDailyAttendanceCommand(id, companyId));
        return Ok(ApiResponse<bool>.Ok(success, HttpContext.TraceIdentifier));
    }

    [HttpPatch("adjust")]
    public async Task<ActionResult<ApiResponse<bool>>> Adjust(ManualAdjustmentCommand command)
    {
        var success = await mediator.Send(command);
        return Ok(ApiResponse<bool>.Ok(success, HttpContext.TraceIdentifier));
    }

    [HttpPatch("{id}/approve")]
    public async Task<ActionResult<ApiResponse<bool>>> Approve(Guid id, [FromQuery] Guid adminId)
    {
        var success = await mediator.Send(new ApproveAttendanceCommand(id, adminId));
        return Ok(ApiResponse<bool>.Ok(success, HttpContext.TraceIdentifier));
    }

    [HttpGet("summary")]
    public async Task<ActionResult<ApiResponse<IEnumerable<AttendanceSummaryDto>>>> GetSummary(
        [FromQuery] Guid companyId,
        [FromQuery] DateTime fromDate,
        [FromQuery] DateTime toDate,
        [FromQuery] string? employeeID = null)
    {
        var data = await mediator.Send(new GetAttendanceSummaryQuery(companyId, fromDate, toDate, employeeID));
        return Ok(ApiResponse<IEnumerable<AttendanceSummaryDto>>.Ok(data, HttpContext.TraceIdentifier));
    }

    private static string BuildDailyReportCsv(IReadOnlyList<DailyReportRowDto> rows)
    {
        var sb = new StringBuilder();
        sb.AppendLine("EmployeeId,Name,Department,Section,Designation,Shift,Date,InTime,OutTime,Status,OtHours");
        foreach (var r in rows)
        {
            sb.AppendLine(string.Join(",",
                Csv(r.EmployeeId),
                Csv(r.EmployeeName),
                Csv(r.Department),
                Csv(r.Section),
                Csv(r.Designation),
                Csv(r.Shift),
                Csv(r.Date),
                Csv(r.InTime),
                Csv(r.OutTime),
                Csv(r.Status),
                r.OtHours.ToString(CultureInfo.InvariantCulture)));
        }

        return sb.ToString();
    }

    private static string BuildDailySummaryCsv(DailySummaryReportDto data)
    {
        var sb = new StringBuilder();
        sb.AppendLine("Level,Name,Total,Present,Absent,Late,OnLeave,Rate");
        foreach (var row in data.DepartmentSummaries)
        {
            sb.AppendLine($"Department,{Csv(row.Name)},{row.TotalEmployees},{row.Present},{row.Absent},{row.Late},{row.OnLeave},{row.AttendanceRate}");
        }

        foreach (var row in data.SectionSummaries)
        {
            sb.AppendLine($"Section,{Csv(row.Name)},{row.TotalEmployees},{row.Present},{row.Absent},{row.Late},{row.OnLeave},{row.AttendanceRate}");
        }

        return sb.ToString();
    }

    private static string Csv(string? value)
    {
        var v = value ?? string.Empty;
        if (v.Contains('"') || v.Contains(',') || v.Contains('\n'))
        {
            return $"\"{v.Replace("\"", "\"\"", StringComparison.Ordinal)}\"";
        }

        return v;
    }
}

public sealed class AttendanceReportQueryParams
{
    public Guid CompanyId { get; set; }
    public DateTime FromDate { get; set; }
    public DateTime ToDate { get; set; }
    public DateTime? Date { get; set; }
    public Guid? DepartmentId { get; set; }
    public Guid? SectionId { get; set; }
    public Guid? DesignationId { get; set; }
    public Guid? GroupId { get; set; }
    public string? LineName { get; set; }
    public string? AttendanceStatus { get; set; }
    public string? EmployeeID { get; set; }
    public string? SearchTerm { get; set; }

    public AttendanceFilterDto ToFilter()
    {
        var day = Date?.Date;
        var from = FromDate == default && day.HasValue ? day.Value : FromDate.Date;
        var to = ToDate == default && day.HasValue ? day.Value : ToDate.Date;
        if (from == default)
        {
            from = DateTime.UtcNow.Date;
        }

        if (to == default)
        {
            to = from;
        }

        return new AttendanceFilterDto(
            CompanyId,
            from,
            to,
            DepartmentId,
            SectionId,
            DesignationId,
            GroupId,
            string.IsNullOrWhiteSpace(LineName) ? null : LineName.Trim(),
            string.IsNullOrWhiteSpace(AttendanceStatus) ? null : AttendanceStatus.Trim(),
            string.IsNullOrWhiteSpace(EmployeeID) ? null : EmployeeID.Trim(),
            string.IsNullOrWhiteSpace(SearchTerm) ? null : SearchTerm.Trim(),
            day ?? (from == to ? from : null));
    }
}

[ApiController]
[Route("api/v1/[controller]")]
public class PunchLogsController(IMediator mediator) : ControllerBase
{
    [HttpPost("upload")]
    public async Task<ActionResult<ApiResponse<int>>> Upload(UploadPunchLogsCommand command)
    {
        var count = await mediator.Send(command);
        return Ok(ApiResponse<int>.Ok(count, HttpContext.TraceIdentifier));
    }
}
