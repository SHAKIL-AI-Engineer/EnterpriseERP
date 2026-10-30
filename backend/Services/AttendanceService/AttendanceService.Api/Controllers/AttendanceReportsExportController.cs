using AttendanceService.Application.DTOs;
using AttendanceService.Application.Features.Attendance.Queries;
using AttendanceService.Api.Controllers;
using AttendanceService.Api.Export;
using Erp.BuildingBlocks.CommonSecurity;
using Erp.BuildingBlocks.ReportExport;
using Erp.BuildingBlocks.ReportExport.Mvc;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AttendanceService.Api.Controllers;

[ApiController]
[Route("api/v1/attendance/reports")]
[Authorize]
public sealed class AttendanceReportsExportController(
    IMediator mediator,
    IReportExportClient exporter,
    ITenantContext tenant) : ControllerBase
{
    [HttpGet("daily-report/export.{format}")]
    public async Task<IActionResult> DailyReport([FromQuery] AttendanceReportQueryParams q, string format, CancellationToken ct)
    {
        q.CompanyId = TenantCompanyResolver.ResolveCompanyId(tenant, q.CompanyId);
        var data = await mediator.Send(new GetDailyReportQuery(q.ToFilter()), ct);
        var reportTitle = q.FromDate == q.ToDate
            ? $"Daily Attendance Report — {q.FromDate:yyyy-MM-dd}"
            : $"Daily Attendance Report — {q.FromDate:yyyy-MM-dd} to {q.ToDate:yyyy-MM-dd}";
        var normalized = ReportExportControllerExtensions.NormalizeFormat(format);
        var meta = AttendanceMeta(q);

        var request = normalized.Equals("PDF", StringComparison.OrdinalIgnoreCase)
            ? DailyAttendanceReportExportBuilder.BuildPdf(reportTitle, data, meta)
            : DailyAttendanceReportExportBuilder.BuildExcelWorkbook(reportTitle, data, meta);

        return await this.ExportFileAsync(exporter, request, ct);
    }

    [HttpGet("daily-summary/export.{format}")]
    public Task<IActionResult> DailySummary([FromQuery] AttendanceReportQueryParams q, string format, CancellationToken ct) =>
        ExportAsync("Daily Summary Report", q, format, ct, async () =>
        {
            var data = await mediator.Send(new GetDailySummaryReportQuery(q.ToFilter()), ct);
            var rows = data.DepartmentSummaries
                .Select(r => (IReadOnlyList<string>)[
                    "Department", r.Name, r.TotalEmployees.ToString(), r.Present.ToString(),
                    r.Absent.ToString(), r.Late.ToString(), r.OnLeave.ToString(), r.AttendanceRate.ToString("0.##")])
                .Concat(data.SectionSummaries.Select(r => (IReadOnlyList<string>)[
                    "Section", r.Name, r.TotalEmployees.ToString(), r.Present.ToString(),
                    r.Absent.ToString(), r.Late.ToString(), r.OnLeave.ToString(), r.AttendanceRate.ToString("0.##")]))
                .ToList();
            return new ReportExportRequestDto(
                "Daily Summary Report",
                ReportExportControllerExtensions.NormalizeFormat(format),
                ["Level", "Name", "Total", "Present", "Absent", "Late", "OnLeave", "Rate"],
                rows,
                AttendanceMeta(q));
        });

    [HttpGet("job-card/export.{format}")]
    public async Task<IActionResult> JobCard(
        [FromQuery] AttendanceReportQueryParams q,
        [FromQuery] int? employeeCard,
        [FromQuery] string? employeeId,
        string format,
        CancellationToken ct)
    {
        var data = await mediator.Send(new GetJobCardQuery(q.ToFilter(), employeeCard, employeeId), ct);
        if (data is null)
        {
            return NotFound();
        }

        var request = ReportExportMapper.Build(
            "Job Card Report",
            ReportExportControllerExtensions.NormalizeFormat(format),
            data.AttendanceRecords,
            [
                new("Date", r => r.Date),
                new("Day", r => r.Day),
                new("Status", r => r.Status),
                new("In", r => r.InTime ?? ""),
                new("Out", r => r.OutTime ?? ""),
                new("Late Min", r => r.LateMinutes.ToString()),
                new("Early Min", r => r.EarlyMinutes.ToString()),
                new("OT Hours", r => r.OtHours.ToString("0.##")),
                new("Total Hours", r => r.TotalHours.ToString("0.##")),
                new("Shift", r => r.Shift ?? ""),
            ],
            AttendanceMeta(q, new Dictionary<string, string>
            {
                ["Employee"] = $"{data.Employee.EmployeeName} ({data.Employee.EmployeeId})",
                ["Department"] = data.Employee.Department,
            }));
        return await this.ExportFileAsync(exporter, request, ct);
    }

    [HttpGet("missing-entries/export.{format}")]
    public Task<IActionResult> MissingEntries([FromQuery] AttendanceReportQueryParams q, string format, CancellationToken ct) =>
        ExportAsync("Missing Entries Report", q, format, ct, async () =>
        {
            var data = await mediator.Send(new GetMissingEntriesQuery(q.ToFilter()), ct);
            return ReportExportMapper.Build(
                "Missing Entries Report",
                ReportExportControllerExtensions.NormalizeFormat(format),
                data.Entries,
                [
                    new("Employee ID", r => r.EmployeeId),
                    new("Name", r => r.EmployeeName),
                    new("Department", r => r.Department),
                    new("Designation", r => r.Designation),
                    new("Date", r => r.Date),
                    new("In", r => r.InTime ?? ""),
                    new("Out", r => r.OutTime ?? ""),
                    new("Missing Type", r => r.MissingType),
                    new("Status", r => r.Status),
                ],
                AttendanceMeta(q));
        });

    [HttpGet("absenteeism-records/export.{format}")]
    public Task<IActionResult> Absenteeism([FromQuery] AttendanceReportQueryParams q, string format, CancellationToken ct) =>
        ExportAsync("Absenteeism Report", q, format, ct, async () =>
        {
            var data = await mediator.Send(new GetAbsenteeismRecordsQuery(q.ToFilter()), ct);
            return ReportExportMapper.Build(
                "Absenteeism Report",
                ReportExportControllerExtensions.NormalizeFormat(format),
                data.Records,
                [
                    new("Employee ID", r => r.EmployeeId),
                    new("Name", r => r.EmployeeName),
                    new("Department", r => r.Department),
                    new("Designation", r => r.Designation),
                    new("Date", r => r.Date),
                    new("Status", r => r.Status),
                    new("Consecutive Days", r => r.ConsecutiveDays.ToString()),
                    new("Remarks", r => r.Remarks ?? ""),
                ],
                AttendanceMeta(q));
        });

    [HttpGet("daily-ot-sheet/export.{format}")]
    public Task<IActionResult> DailyOtSheet([FromQuery] AttendanceReportQueryParams q, string format, CancellationToken ct) =>
        ExportAsync("Daily OT Sheet", q, format, ct, async () =>
        {
            var data = await mediator.Send(new GetDailyOtSheetQuery(q.ToFilter()), ct);
            return ReportExportMapper.Build(
                "Daily OT Sheet",
                ReportExportControllerExtensions.NormalizeFormat(format),
                data,
                [
                    new("Employee ID", r => r.EmployeeId),
                    new("Name", r => r.EmployeeName),
                    new("Department", r => r.Department),
                    new("Section", r => r.Section),
                    new("Designation", r => r.Designation),
                    new("Date", r => r.Date),
                    new("In", r => r.InTime ?? ""),
                    new("Out", r => r.OutTime ?? ""),
                    new("OT Hours", r => r.OtHours.ToString("0.##")),
                    new("Status", r => r.Status),
                ],
                AttendanceMeta(q));
        });

    [HttpGet("daily-ot-summary/export.{format}")]
    public Task<IActionResult> DailyOtSummary([FromQuery] AttendanceReportQueryParams q, string format, CancellationToken ct) =>
        ExportAsync("Daily OT Summary", q, format, ct, async () =>
        {
            var data = await mediator.Send(new GetDailyOtSummaryQuery(q.ToFilter()), ct);
            return ReportExportMapper.Build(
                "Daily OT Summary",
                ReportExportControllerExtensions.NormalizeFormat(format),
                data,
                [
                    new("Name", r => r.Name),
                    new("Employees", r => r.EmployeeCount.ToString()),
                    new("Total OT Hours", r => r.TotalOtHours.ToString("0.##")),
                    new("Department", r => r.DepartmentName ?? ""),
                    new("Section", r => r.SectionName ?? ""),
                ],
                AttendanceMeta(q));
        });

    private async Task<IActionResult> ExportAsync(
        string title,
        AttendanceReportQueryParams q,
        string format,
        CancellationToken ct,
        Func<Task<ReportExportRequestDto>> build)
    {
        var request = await build();
        return await this.ExportFileAsync(exporter, request, ct);
    }

    private static Dictionary<string, string> AttendanceMeta(
        AttendanceReportQueryParams q,
        IReadOnlyDictionary<string, string>? extra = null)
    {
        var meta = ReportExportMapper.MetaWithFilters(new Dictionary<string, string>
        {
            ["CompanyId"] = q.CompanyId.ToString(),
        });
        if (extra is not null)
        {
            foreach (var (k, v) in extra)
            {
                meta[k] = v;
            }
        }

        return meta;
    }
}
