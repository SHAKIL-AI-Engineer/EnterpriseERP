using AttendanceService.Application.Common.Interfaces;
using AttendanceService.Application.DTOs;
using AttendanceService.Application.Features.Attendance;
using AttendanceService.Domain.Enums;
using Erp.BuildingBlocks.SharedKernel;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace AttendanceService.Application.Features.Attendance.Queries;

public sealed record GetApprovedMonthlyAttendanceSummaryQuery(
    Guid CompanyId,
    Guid EmployeeId,
    int Year,
    int Month) : IRequest<PayrollMonthlyAttendanceSummaryDto?>;

public sealed record IsMonthlyAttendanceApprovedQuery(Guid CompanyId, int Year, int Month) : IRequest<bool>;

public sealed class PayrollMonthlyAttendanceQueryHandlers(
    IAttendanceDbContext db,
    IEmployeeDirectory employeeDirectory) :
    IRequestHandler<GetApprovedMonthlyAttendanceSummaryQuery, PayrollMonthlyAttendanceSummaryDto?>,
    IRequestHandler<IsMonthlyAttendanceApprovedQuery, bool>
{
    public async Task<PayrollMonthlyAttendanceSummaryDto?> Handle(
        GetApprovedMonthlyAttendanceSummaryQuery request,
        CancellationToken cancellationToken)
    {
        var (start, end) = MonthRange(request.Year, request.Month);
        var rows = await db.DailyAttendances.AsNoTracking()
            .Where(a => a.CompanyId == request.CompanyId
                        && a.EmployeeId == request.EmployeeId
                        && a.AttendanceDate >= start
                        && a.AttendanceDate < end)
            .ToListAsync(cancellationToken);

        if (rows.Count == 0)
        {
            return null;
        }

        var employees = await employeeDirectory.GetEmployeesByIdAsync(request.CompanyId, cancellationToken);
        var isOtEnabled = employees.TryGetValue(request.EmployeeId, out var employee) && employee.IsOtEnabled;

        return BuildSummary(request.CompanyId, request.EmployeeId, request.Year, request.Month, rows, isOtEnabled);
    }

    public async Task<bool> Handle(IsMonthlyAttendanceApprovedQuery request, CancellationToken cancellationToken)
    {
        var (start, end) = MonthRange(request.Year, request.Month);
        var rows = await db.DailyAttendances.AsNoTracking()
            .Where(a => a.CompanyId == request.CompanyId
                        && a.AttendanceDate >= start
                        && a.AttendanceDate < end)
            .Select(a => a.IsApproved)
            .ToListAsync(cancellationToken);

        return rows.Count > 0 && rows.All(x => x);
    }

    private static PayrollMonthlyAttendanceSummaryDto BuildSummary(
        Guid companyId,
        Guid employeeId,
        int year,
        int month,
        IReadOnlyList<Domain.Entities.DailyAttendance> rows,
        bool isOtEnabled)
    {
        var totalDays = DateTime.DaysInMonth(year, month);
        var presentStatuses = new HashSet<AttendanceStatus>
        {
            AttendanceStatus.Present,
            AttendanceStatus.Late,
            AttendanceStatus.EarlyOut,
            AttendanceStatus.ManualPresent,
            AttendanceStatus.HolidayPresent,
            AttendanceStatus.WeeklyOffPresent,
            AttendanceStatus.HalfDay,
        };

        decimal Present() => rows.Count(x => presentStatuses.Contains(x.Status));
        decimal Absent() => rows.Count(x => AttendanceReportHelper.IsAbsent(x.Status));
        decimal Late() => rows.Count(x => x.Status == AttendanceStatus.Late);
        decimal Leave() => rows.Count(x => x.Status == AttendanceStatus.Leave);
        decimal Lwp() => rows.Count(x => x.Status == AttendanceStatus.LeaveWithoutPay);
        decimal HolidayPresent() => rows.Count(x => x.Status == AttendanceStatus.HolidayPresent);
        decimal WeeklyOffPresent() => rows.Count(x => x.Status == AttendanceStatus.WeeklyOffPresent);
        decimal Missing() => rows.Count(x => x.Status == AttendanceStatus.MissingPunch);
        var workingDays = rows.Count(x => x.DayType == DayType.WorkingDay || x.DayType == DayType.SpecialWorkingDay);

        var overtimeMinutes = isOtEnabled ? rows.Sum(x => x.OvertimeMinutes) : 0;
        var overtimeHours = rows.Sum(r => OvertimeHourRules.ResolveOtHours(r.OvertimeMinutes, isOtEnabled));

        return new PayrollMonthlyAttendanceSummaryDto(
            companyId,
            employeeId,
            year,
            month,
            rows.All(x => x.IsApproved),
            totalDays,
            workingDays,
            Present(),
            Absent(),
            Leave(),
            Lwp(),
            Late(),
            HolidayPresent(),
            WeeklyOffPresent(),
            overtimeMinutes,
            overtimeHours,
            0,
            0,
            Missing());
    }

    private static (DateTime Start, DateTime End) MonthRange(int year, int month)
    {
        var start = new DateTime(year, month, 1, 0, 0, 0, DateTimeKind.Unspecified);
        var end = start.AddMonths(1);
        return (start, end);
    }
}
