using MediatR;
using Microsoft.EntityFrameworkCore;
using AttendanceService.Application.Common;
using AttendanceService.Application.Common.Interfaces;
using AttendanceService.Application.Features.Attendance;
using AttendanceService.Application.DTOs;
using AttendanceService.Domain.Enums;

namespace AttendanceService.Application.Features.Attendance.Queries;

public record GetDailyAttendanceQuery(
    Guid CompanyId,
    DateTime FromDate,
    DateTime ToDate,
    string? EmployeeID = null) : IRequest<IEnumerable<DailyAttendanceDto>>;

public class AttendanceQueryHandlers(IAttendanceDbContext db, IEmployeeDirectory employeeDirectory) :
    IRequestHandler<GetDailyAttendanceQuery, IEnumerable<DailyAttendanceDto>>
{
    public async Task<IEnumerable<DailyAttendanceDto>> Handle(
        GetDailyAttendanceQuery request,
        CancellationToken cancellationToken)
    {
        var (start, end) = AttendanceDateRange.ToInclusiveRange(request.FromDate, request.ToDate);
        var query = db.DailyAttendances.AsNoTracking()
            .Where(a => a.CompanyId == request.CompanyId && a.AttendanceDate >= start && a.AttendanceDate < end);

        if (!string.IsNullOrWhiteSpace(request.EmployeeID))
        {
            var employeeId = await employeeDirectory.ResolveEmployeeIdByEmployeeIDAsync(
                request.CompanyId, request.EmployeeID.Trim(), cancellationToken);
            if (employeeId is null)
            {
                return [];
            }

            query = query.Where(a => a.EmployeeId == employeeId);
        }

        var rows = await query
            .OrderBy(a => a.EmployeeID)
            .ThenBy(a => a.AttendanceDate)
            .ToListAsync(cancellationToken);

        var employeesById = await employeeDirectory.GetEmployeesByIdAsync(request.CompanyId, cancellationToken);

        return rows.Select(a => new DailyAttendanceDto(
            a.Id,
            ResolveEmployeeID(a.EmployeeID, a.EmployeeId, employeesById),
            ResolvePunchNumber(a.PunchNumber, a.EmployeeId, employeesById),
            a.AttendanceDate,
            a.InTime,
            a.OutTime,
            a.ShiftName,
            a.LateMinutes,
            a.OvertimeMinutes,
            a.WorkingMinutes,
            a.Status.ToString(),
            a.Remarks));
    }

    private static string ResolveEmployeeID(
        string stored,
        Guid employeeId,
        IReadOnlyDictionary<Guid, EmployeeDirectoryEntry> byId)
    {
        if (!string.IsNullOrWhiteSpace(stored))
        {
            return stored.Trim();
        }

        return byId.TryGetValue(employeeId, out var e) ? e.EmployeeID : string.Empty;
    }

    private static int ResolvePunchNumber(
        int stored,
        Guid employeeId,
        IReadOnlyDictionary<Guid, EmployeeDirectoryEntry> byId)
    {
        if (stored > 0)
        {
            return stored;
        }

        return byId.TryGetValue(employeeId, out var e) ? e.PunchNumber : 0;
    }
}

public record GetAttendanceSummaryQuery(
    Guid CompanyId,
    DateTime FromDate,
    DateTime ToDate,
    string? EmployeeID = null) : IRequest<IEnumerable<AttendanceSummaryDto>>;

public class AttendanceSummaryQueryHandler(IAttendanceDbContext db, IEmployeeDirectory employeeDirectory) :
    IRequestHandler<GetAttendanceSummaryQuery, IEnumerable<AttendanceSummaryDto>>
{
    public async Task<IEnumerable<AttendanceSummaryDto>> Handle(
        GetAttendanceSummaryQuery request,
        CancellationToken cancellationToken)
    {
        var (start, end) = AttendanceDateRange.ToInclusiveRange(request.FromDate, request.ToDate);
        var query = db.DailyAttendances.AsNoTracking()
            .Where(a => a.CompanyId == request.CompanyId && a.AttendanceDate >= start && a.AttendanceDate < end);

        if (!string.IsNullOrWhiteSpace(request.EmployeeID))
        {
            var employeeId = await employeeDirectory.ResolveEmployeeIdByEmployeeIDAsync(
                request.CompanyId,
                request.EmployeeID.Trim(),
                cancellationToken);
            if (employeeId is null)
            {
                return [];
            }

            query = query.Where(a => a.EmployeeId == employeeId);
        }

        var rows = await query
            .Select(a => new
            {
                a.EmployeeId,
                a.EmployeeID,
                a.PunchNumber,
                a.Status,
                a.OvertimeMinutes,
                a.WorkingMinutes,
                a.DayType
            })
            .ToListAsync(cancellationToken);

        var employeesById = await employeeDirectory.GetEmployeesByIdAsync(request.CompanyId, cancellationToken);

        var data = rows
            .GroupBy(a => a.EmployeeId)
            .Select(g =>
            {
                var first = g.First();
                var empId = ResolveEmployeeID(first.EmployeeID, g.Key, employeesById);
                var punchNum = ResolvePunchNumber(first.PunchNumber, g.Key, employeesById);
                return new AttendanceSummaryDto(
                    empId,
                    punchNum,
                    g.Count(x => x.Status == AttendanceStatus.Present || x.Status == AttendanceStatus.Late || x.Status == AttendanceStatus.EarlyOut),
                    g.Count(x => AttendanceReportHelper.IsAbsent(x.Status)),
                    g.Count(x => x.Status == AttendanceStatus.Late),
                    g.Count(x => x.Status == AttendanceStatus.EarlyOut),
                    g.Sum(x => x.OvertimeMinutes),
                    g.Sum(x => x.WorkingMinutes),
                    g.Count(x => x.DayType == DayType.Holiday),
                    g.Count(x => x.DayType == DayType.WeeklyOff));
            })
            .OrderBy(x => x.EmployeeID)
            .ToList();

        return data;
    }

    private static string ResolveEmployeeID(
        string stored,
        Guid employeeId,
        IReadOnlyDictionary<Guid, EmployeeDirectoryEntry> byId)
    {
        if (!string.IsNullOrWhiteSpace(stored))
        {
            return stored.Trim();
        }

        return byId.TryGetValue(employeeId, out var e) ? e.EmployeeID : string.Empty;
    }

    private static int ResolvePunchNumber(
        int stored,
        Guid employeeId,
        IReadOnlyDictionary<Guid, EmployeeDirectoryEntry> byId)
    {
        if (stored > 0)
        {
            return stored;
        }

        return byId.TryGetValue(employeeId, out var e) ? e.PunchNumber : 0;
    }
}
