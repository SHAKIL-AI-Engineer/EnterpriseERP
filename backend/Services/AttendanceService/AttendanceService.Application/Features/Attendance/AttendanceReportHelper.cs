using AttendanceService.Application.Common;
using AttendanceService.Application.Common.Interfaces;
using AttendanceService.Application.DTOs;
using AttendanceService.Domain.Entities;
using AttendanceService.Domain.Enums;
using Erp.BuildingBlocks.SharedKernel;
using Microsoft.EntityFrameworkCore;

namespace AttendanceService.Application.Features.Attendance;

public static class AttendanceReportHelper
{
    public static AttendanceEmployeeFilter ToEmployeeFilter(AttendanceFilterDto filter) =>
        new(
            filter.CompanyId,
            filter.DepartmentId,
            filter.SectionId,
            filter.DesignationId,
            filter.GroupId,
            filter.LineName,
            filter.SearchTerm,
            filter.EmployeeID);

    public static (DateTime Start, DateTime End) ResolveRange(AttendanceFilterDto filter)
    {
        if (filter.Date.HasValue)
        {
            var day = AttendanceDateRange.ToCalendarDate(filter.Date.Value);
            return (day, day.AddDays(1));
        }

        return AttendanceDateRange.ToInclusiveRange(filter.FromDate, filter.ToDate);
    }

    public static async Task<List<DailyAttendance>> LoadAttendancesAsync(
        IAttendanceDbContext db,
        AttendanceFilterDto filter,
        IAttendanceEmployeeQuery employeeQuery,
        CancellationToken cancellationToken)
    {
        var (start, end) = ResolveRange(filter);
        var query = db.DailyAttendances.AsNoTracking()
            .Where(a => a.CompanyId == filter.CompanyId && a.AttendanceDate >= start && a.AttendanceDate < end);

        var employeeFilter = ToEmployeeFilter(filter);
        var hasEmployeeFilter = filter.DepartmentId.HasValue
            || filter.SectionId.HasValue
            || filter.DesignationId.HasValue
            || filter.GroupId.HasValue
            || !string.IsNullOrWhiteSpace(filter.LineName)
            || !string.IsNullOrWhiteSpace(filter.SearchTerm)
            || !string.IsNullOrWhiteSpace(filter.EmployeeID);

        if (hasEmployeeFilter)
        {
            var ids = await employeeQuery.GetEmployeeIdsMatchingFilterAsync(employeeFilter, cancellationToken);
            if (ids.Count == 0)
            {
                return [];
            }

            query = query.Where(a => ids.Contains(a.EmployeeId));
        }

        return await query
            .OrderBy(a => a.AttendanceDate)
            .ThenBy(a => a.EmployeeID)
            .ToListAsync(cancellationToken);
    }

    public static string FormatTime(DateTime? value) =>
        value.HasValue ? value.Value.ToString("HH:mm") : null!;

    public static string FormatDate(DateTime value) => value.ToString("yyyy-MM-dd");

    public static decimal ToOtHours(int otMinutes) => OvertimeHourRules.ConvertMinutesToHours(otMinutes);

    public static decimal ResolveOtHours(int otMinutes, bool isOtEnabled) =>
        OvertimeHourRules.ResolveOtHours(otMinutes, isOtEnabled);

    public static bool IsPresent(AttendanceStatus status) =>
        status is AttendanceStatus.Present or AttendanceStatus.Late or AttendanceStatus.EarlyOut;

    public static bool IsAbsent(AttendanceStatus status) =>
        status == AttendanceStatus.Absent;

    public static string FormatJobCardStatus(AttendanceStatus status) =>
        status switch
        {
            AttendanceStatus.WeeklyOff => "Weekend",
            _ => status.ToString()
        };

    public static string ResolveMissingType(DailyAttendance row)
    {
        if (row.InTime is null && row.OutTime is null)
        {
            return "Both";
        }

        if (row.InTime is null)
        {
            return "InTime";
        }

        if (row.OutTime is null)
        {
            return "OutTime";
        }

        return "None";
    }

    public static bool IsMissingEntry(DailyAttendance row) =>
        row.InTime is null ^ row.OutTime is null;

    public static int StableHash(Guid id) => Math.Abs(id.GetHashCode());

    public static int LegacyCompanyId(Guid companyId) => Math.Abs(companyId.GetHashCode() % 10000);

    public static bool MatchesAttendanceStatusFilter(AttendanceStatus status, string? filter)
    {
        if (string.IsNullOrWhiteSpace(filter) || filter.Equals("all", StringComparison.OrdinalIgnoreCase))
        {
            return true;
        }

        return status.ToString().Contains(filter.Trim(), StringComparison.OrdinalIgnoreCase);
    }
}
