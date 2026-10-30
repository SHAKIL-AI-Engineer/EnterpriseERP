using Erp.BuildingBlocks.ReportExport;
using Erp.BuildingBlocks.ReportExport.Mvc;
using LeaveService.Application.Features.LeaveApplications;
using LeaveService.Application.Features.Operational;
using HolidayListQuery = LeaveService.Application.Features.Operational.HolidayListQuery;
using LeaveEncashmentListQuery = LeaveService.Application.Features.Operational.LeaveEncashmentListQuery;
using LeaveService.Contracts.Holidays;
using LeaveService.Contracts.LeaveApplications;
using LeaveService.Contracts.LeaveBalances;
using LeaveService.Contracts.LeaveEncashments;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LeaveService.Api.Controllers;

[ApiController]
[Route("api/v1/leave/reports")]
[Authorize]
public sealed class LeaveReportsExportController(IMediator mediator, IReportExportClient exporter) : ControllerBase
{
    [HttpGet("applications/export.{format}")]
    public async Task<IActionResult> Applications(
        [FromQuery] LeaveApplicationListQuery query,
        string format,
        CancellationToken cancellationToken)
    {
        query.GetAll = true;
        query.PageSize = 5000;
        query.Normalize();

        var result = await mediator.Send(new ListLeaveApplicationsQuery(query), cancellationToken);
        var request = ReportExportMapper.Build(
            "Leave Applications",
            ReportExportControllerExtensions.NormalizeFormat(format),
            result.Data,
            ApplicationColumns(),
            LeaveMeta(new Dictionary<string, string>
            {
                ["CompanyId"] = query.CompanyId.ToString(),
                ["Status"] = query.Status ?? "",
                ["EmployeeId"] = query.EmployeeId?.ToString() ?? "",
                ["FromDate"] = query.FromDate?.ToString("yyyy-MM-dd") ?? "",
                ["ToDate"] = query.ToDate?.ToString("yyyy-MM-dd") ?? "",
            }));
        return await this.ExportFileAsync(exporter, request, cancellationToken);
    }

    [HttpGet("monthly-report/export.{format}")]
    public async Task<IActionResult> MonthlyReport(
        [FromQuery] Guid companyId,
        [FromQuery] int year,
        [FromQuery] int month,
        string format,
        CancellationToken cancellationToken)
    {
        var from = new DateOnly(year, month, 1);
        var to = from.AddMonths(1).AddDays(-1);
        var query = new LeaveApplicationListQuery
        {
            CompanyId = companyId,
            Status = "Approved",
            FromDate = from,
            ToDate = to,
            GetAll = true,
            PageSize = 5000,
        };
        query.Normalize();

        var result = await mediator.Send(new ListLeaveApplicationsQuery(query), cancellationToken);
        var rows = BuildMonthlyRows(result.Data, year, month);

        var request = ReportExportMapper.Build(
            "Monthly Leave Report",
            ReportExportControllerExtensions.NormalizeFormat(format),
            rows,
            MonthlyColumns(),
            LeaveMeta(new Dictionary<string, string>
            {
                ["CompanyId"] = companyId.ToString(),
                ["Year"] = year.ToString(),
                ["Month"] = month.ToString(),
            }));
        return await this.ExportFileAsync(exporter, request, cancellationToken);
    }

    [HttpGet("balances/export.{format}")]
    [Authorize(Policy = "Permission:LEAVE_BALANCE_VIEW")]
    public async Task<IActionResult> Balances(
        [FromQuery] Guid companyId,
        [FromQuery] Guid employeeId,
        [FromQuery] int year,
        string format,
        CancellationToken cancellationToken)
    {
        var rows = await mediator.Send(new GetEmployeeLeaveBalancesQuery(companyId, employeeId, year), cancellationToken);
        var request = ReportExportMapper.Build(
            "Leave Balances",
            ReportExportControllerExtensions.NormalizeFormat(format),
            rows,
            BalanceColumns(),
            LeaveMeta(new Dictionary<string, string>
            {
                ["CompanyId"] = companyId.ToString(),
                ["EmployeeId"] = employeeId.ToString(),
                ["Year"] = year.ToString(),
            }));
        return await this.ExportFileAsync(exporter, request, cancellationToken);
    }

    [HttpGet("holidays/export.{format}")]
    public async Task<IActionResult> Holidays(
        [FromQuery] HolidayListQuery query,
        string format,
        CancellationToken cancellationToken)
    {
        query.GetAll = true;
        query.PageSize = 5000;
        query.Normalize();

        var result = await mediator.Send(new GetHolidaysQuery(query), cancellationToken);
        var request = ReportExportMapper.Build(
            "Holiday Calendar",
            ReportExportControllerExtensions.NormalizeFormat(format),
            result.Data,
            HolidayColumns(),
            LeaveMeta(new Dictionary<string, string>
            {
                ["CompanyId"] = query.CompanyId.ToString(),
                ["Year"] = query.Year.ToString(),
                ["Search"] = query.Search ?? "",
            }));
        return await this.ExportFileAsync(exporter, request, cancellationToken);
    }

    [HttpGet("encashments/export.{format}")]
    public async Task<IActionResult> Encashments(
        [FromQuery] LeaveEncashmentListQuery query,
        string format,
        CancellationToken cancellationToken)
    {
        query.GetAll = true;
        query.PageSize = 5000;
        query.Normalize();

        var result = await mediator.Send(new GetLeaveEncashmentsQuery(query), cancellationToken);
        var request = ReportExportMapper.Build(
            "Leave Encashments",
            ReportExportControllerExtensions.NormalizeFormat(format),
            result.Data,
            EncashmentColumns(),
            LeaveMeta(new Dictionary<string, string>
            {
                ["CompanyId"] = query.CompanyId.ToString(),
                ["Year"] = query.Year?.ToString() ?? "",
            }));
        return await this.ExportFileAsync(exporter, request, cancellationToken);
    }

    private static Dictionary<string, string> LeaveMeta(IReadOnlyDictionary<string, string> filters) =>
        ReportExportMapper.MetaWithFilters(filters);

    private static IReadOnlyList<MonthlyLeaveExportRow> BuildMonthlyRows(
        IReadOnlyList<LeaveApplicationListItemDto> apps,
        int year,
        int month)
    {
        var agg = new Dictionary<Guid, MonthlyLeaveExportRow>();

        foreach (var app in apps)
        {
            if (!string.Equals(app.Status, "Approved", StringComparison.OrdinalIgnoreCase))
                continue;

            var start = app.FromDate;
            if (start.Year != year || start.Month != month)
                continue;

            if (!agg.TryGetValue(app.EmployeeId, out var row))
            {
                row = new MonthlyLeaveExportRow(
                    app.EmployeeCode,
                    app.EmployeeName,
                    app.DepartmentName ?? "",
                    0, 0, 0, 0, 0, 0, 0, 0);
                agg[app.EmployeeId] = row;
            }

            var code = (app.LeaveCode ?? app.LeaveTypeName ?? "").ToLowerInvariant();
            var days = app.TotalDays;
            row = code switch
            {
                var c when c.Contains("sick") => row with { SickLeave = row.SickLeave + days },
                var c when c.Contains("casual") => row with { CasualLeave = row.CasualLeave + days },
                var c when c.Contains("earn") => row with { EarnedLeave = row.EarnedLeave + days },
                var c when c.Contains("patern") => row with { PaternityLeave = row.PaternityLeave + days },
                var c when c.Contains("matern") => row with { MaternityLeave = row.MaternityLeave + days },
                var c when c.Contains("lwp") || c.Contains("without") => row with { Lwp = row.Lwp + days },
                _ => row with { OtherLeave = row.OtherLeave + days },
            };
            row = row with { TotalDays = row.SickLeave + row.CasualLeave + row.EarnedLeave + row.PaternityLeave + row.MaternityLeave + row.Lwp + row.OtherLeave };
            agg[app.EmployeeId] = row;
        }

        return agg.Values.OrderBy(r => r.EmployeeName).ToList();
    }

    private sealed record MonthlyLeaveExportRow(
        string EmployeeId,
        string EmployeeName,
        string Department,
        decimal SickLeave,
        decimal CasualLeave,
        decimal EarnedLeave,
        decimal PaternityLeave,
        decimal MaternityLeave,
        decimal Lwp,
        decimal OtherLeave,
        decimal TotalDays);

    private static IReadOnlyList<ReportColumn<LeaveApplicationListItemDto>> ApplicationColumns() =>
    [
        new("Employee ID", r => r.EmployeeCode),
        new("Name", r => r.EmployeeName),
        new("Department", r => r.DepartmentName ?? ""),
        new("Leave Type", r => r.LeaveTypeName ?? r.LeaveCode ?? ""),
        new("From", r => r.FromDate.ToString("yyyy-MM-dd")),
        new("To", r => r.ToDate.ToString("yyyy-MM-dd")),
        new("Days", r => r.TotalDays.ToString("0.##")),
        new("Status", r => r.Status),
        new("Applied At", r => r.AppliedAt.ToString("yyyy-MM-dd HH:mm")),
    ];

    private static IReadOnlyList<ReportColumn<MonthlyLeaveExportRow>> MonthlyColumns() =>
    [
        new("Employee ID", r => r.EmployeeId),
        new("Name", r => r.EmployeeName),
        new("Department", r => r.Department),
        new("Sick", r => r.SickLeave.ToString("0.##")),
        new("Casual", r => r.CasualLeave.ToString("0.##")),
        new("Earned", r => r.EarnedLeave.ToString("0.##")),
        new("Paternity", r => r.PaternityLeave.ToString("0.##")),
        new("Maternity", r => r.MaternityLeave.ToString("0.##")),
        new("LWP", r => r.Lwp.ToString("0.##")),
        new("Other", r => r.OtherLeave.ToString("0.##")),
        new("Total", r => r.TotalDays.ToString("0.##")),
    ];

    private static IReadOnlyList<ReportColumn<EmployeeLeaveBalanceDto>> BalanceColumns() =>
    [
        new("Leave Type", r => r.LeaveName ?? r.LeaveCode ?? ""),
        new("Year", r => r.YearNo.ToString()),
        new("Entitled", r => r.EntitledDays.ToString("0.##")),
        new("Used", r => r.UsedDays.ToString("0.##")),
        new("Balance", r => r.BalanceDays.ToString("0.##")),
    ];

    private static IReadOnlyList<ReportColumn<HolidayDto>> HolidayColumns() =>
    [
        new("Name", r => r.HolidayName),
        new("Date", r => r.HolidayDate.ToString("yyyy-MM-dd")),
        new("Type", r => r.HolidayType),
        new("Paid", r => r.IsPaid ? "Yes" : "No"),
        new("Active", r => r.IsActive ? "Yes" : "No"),
    ];

    private static IReadOnlyList<ReportColumn<LeaveEncashmentDto>> EncashmentColumns() =>
    [
        new("Employee ID", r => r.EmployeeId.ToString()),
        new("Leave Type ID", r => r.LeaveTypeId.ToString()),
        new("Year", r => r.YearNo.ToString()),
        new("Days", r => r.EncashDays.ToString("0.##")),
        new("Rate/Day", r => r.RatePerDay.ToString("0.00")),
        new("Amount", r => r.TotalAmount.ToString("0.00")),
        new("Status", r => r.Status),
        new("Created At", r => r.CreatedAt.ToString("yyyy-MM-dd")),
    ];
}
