using MediatR;
using AttendanceService.Application.Common.Interfaces;
using AttendanceService.Application.DTOs;
using AttendanceService.Application.Features.Attendance;
using AttendanceService.Domain.Enums;

namespace AttendanceService.Application.Features.Attendance.Queries;

public record GetDailyReportQuery(AttendanceFilterDto Filter) : IRequest<IReadOnlyList<DailyReportRowDto>>;
public record GetDailySummaryReportQuery(AttendanceFilterDto Filter) : IRequest<DailySummaryReportDto>;
public record GetJobCardQuery(AttendanceFilterDto Filter, int? EmployeeCard, string? EmployeeId) : IRequest<JobCardReportDto?>;
public record GetJobCardRosterQuery(AttendanceFilterDto Filter, int Page, int PageSize) : IRequest<PagedJobCardRosterDto>;
public record GetMissingEntriesQuery(AttendanceFilterDto Filter) : IRequest<MissingEntriesReportDto>;
public record GetAbsenteeismRecordsQuery(AttendanceFilterDto Filter) : IRequest<AbsenteeismReportDto>;
public record GetDailyOtSheetQuery(AttendanceFilterDto Filter) : IRequest<IReadOnlyList<DailyOtSheetRowDto>>;
public record GetDailyOtSummaryQuery(AttendanceFilterDto Filter) : IRequest<IReadOnlyList<DailyOtSummaryRowDto>>;

public sealed class GetDailyReportQueryHandler(
    IAttendanceDbContext db,
    IAttendanceEmployeeQuery employeeQuery,
    IEmployeeDirectory employeeDirectory) : IRequestHandler<GetDailyReportQuery, IReadOnlyList<DailyReportRowDto>>
{
    public async Task<IReadOnlyList<DailyReportRowDto>> Handle(GetDailyReportQuery request, CancellationToken cancellationToken)
    {
        var rows = await AttendanceReportHelper.LoadAttendancesAsync(db, request.Filter, employeeQuery, cancellationToken);
        if (!string.IsNullOrWhiteSpace(request.Filter.AttendanceStatus))
        {
            rows = rows
                .Where(a => AttendanceReportHelper.MatchesAttendanceStatusFilter(a.Status, request.Filter.AttendanceStatus))
                .ToList();
        }

        var profiles = await employeeQuery.GetProfilesAsync(AttendanceReportHelper.ToEmployeeFilter(request.Filter), cancellationToken);
        var employees = await employeeDirectory.GetEmployeesByIdAsync(request.Filter.CompanyId, cancellationToken);
        var legacyCompanyId = AttendanceReportHelper.LegacyCompanyId(request.Filter.CompanyId);
        var index = 1;

        return rows.Select(a =>
        {
            profiles.TryGetValue(a.EmployeeId, out var profile);
            var isOtEnabled = employees.TryGetValue(a.EmployeeId, out var employee) && employee.IsOtEnabled;
            return new DailyReportRowDto(
                index++,
                a.PunchNumber > 0 ? a.PunchNumber : profile?.PunchNumber ?? 0,
                !string.IsNullOrWhiteSpace(a.EmployeeID) ? a.EmployeeID : profile?.EmployeeID ?? string.Empty,
                legacyCompanyId,
                profile?.FullName ?? a.EmployeeID,
                profile?.DepartmentName ?? string.Empty,
                profile?.SectionName ?? string.Empty,
                profile?.DesignationName ?? string.Empty,
                profile?.LineName ?? string.Empty,
                a.ShiftName ?? string.Empty,
                AttendanceReportHelper.FormatDate(a.AttendanceDate),
                AttendanceReportHelper.FormatTime(a.InTime),
                AttendanceReportHelper.FormatTime(a.OutTime),
                a.Status.ToString(),
                AttendanceReportHelper.ResolveOtHours(a.OvertimeMinutes, isOtEnabled));
        }).ToList();
    }
}

public sealed class GetDailySummaryReportQueryHandler(
    IAttendanceDbContext db,
    IAttendanceEmployeeQuery employeeQuery) : IRequestHandler<GetDailySummaryReportQuery, DailySummaryReportDto>
{
    public async Task<DailySummaryReportDto> Handle(GetDailySummaryReportQuery request, CancellationToken cancellationToken)
    {
        var rows = await AttendanceReportHelper.LoadAttendancesAsync(db, request.Filter, employeeQuery, cancellationToken);
        var profiles = await employeeQuery.GetProfilesAsync(AttendanceReportHelper.ToEmployeeFilter(request.Filter), cancellationToken);

        var present = rows.Count(r => AttendanceReportHelper.IsPresent(r.Status));
        var absent = rows.Count(r => AttendanceReportHelper.IsAbsent(r.Status));
        var late = rows.Count(r => r.Status == AttendanceStatus.Late);
        var leave = rows.Count(r => r.Status == AttendanceStatus.Leave || r.Status == AttendanceStatus.LeaveWithoutPay);
        var total = rows.Count;
        var rate = total == 0 ? 0 : Math.Round((decimal)present / total * 100, 2);

        var overall = new AttendanceSummaryTotalsDto(total, present, absent, late, leave, rate);

        static NamedSummaryBucketDto BuildBucket(
            int id,
            string name,
            int totalEmployees,
            int present,
            int absent,
            int lateCount,
            int onLeave,
            int? departmentId = null,
            int? sectionId = null,
            int? designationId = null)
        {
            var bucketRate = totalEmployees == 0 ? 0 : Math.Round((decimal)present / totalEmployees * 100, 2);
            return new NamedSummaryBucketDto(
                id,
                totalEmployees,
                present,
                absent,
                lateCount,
                onLeave,
                bucketRate,
                name,
                departmentId,
                sectionId,
                designationId);
        }

        var byDept = rows
            .GroupBy(r =>
            {
                profiles.TryGetValue(r.EmployeeId, out var p);
                return p?.DepartmentId;
            })
            .Where(g => g.Key.HasValue)
            .Select((g, i) =>
            {
                var name = profiles.Values.FirstOrDefault(p => p.DepartmentId == g.Key)?.DepartmentName ?? "Unknown";
                return BuildBucket(
                    i + 1,
                    name,
                    g.Count(),
                    g.Count(x => AttendanceReportHelper.IsPresent(x.Status)),
                    g.Count(x => AttendanceReportHelper.IsAbsent(x.Status)),
                    g.Count(x => x.Status == AttendanceStatus.Late),
                    g.Count(x => x.Status == AttendanceStatus.Leave || x.Status == AttendanceStatus.LeaveWithoutPay),
                    AttendanceReportHelper.StableHash(g.Key!.Value));
            })
            .ToList();

        var bySection = rows
            .GroupBy(r =>
            {
                profiles.TryGetValue(r.EmployeeId, out var p);
                return p?.SectionId;
            })
            .Where(g => g.Key.HasValue)
            .Select((g, i) =>
            {
                var name = profiles.Values.FirstOrDefault(p => p.SectionId == g.Key)?.SectionName ?? "Unknown";
                return BuildBucket(
                    i + 1,
                    name,
                    g.Count(),
                    g.Count(x => AttendanceReportHelper.IsPresent(x.Status)),
                    g.Count(x => AttendanceReportHelper.IsAbsent(x.Status)),
                    g.Count(x => x.Status == AttendanceStatus.Late),
                    g.Count(x => x.Status == AttendanceStatus.Leave || x.Status == AttendanceStatus.LeaveWithoutPay),
                    sectionId: AttendanceReportHelper.StableHash(g.Key!.Value));
            })
            .ToList();

        var byDesig = rows
            .GroupBy(r =>
            {
                profiles.TryGetValue(r.EmployeeId, out var p);
                return p?.DesignationId;
            })
            .Where(g => g.Key.HasValue)
            .Select((g, i) =>
            {
                var name = profiles.Values.FirstOrDefault(p => p.DesignationId == g.Key)?.DesignationName ?? "Unknown";
                return BuildBucket(
                    i + 1,
                    name,
                    g.Count(),
                    g.Count(x => AttendanceReportHelper.IsPresent(x.Status)),
                    g.Count(x => AttendanceReportHelper.IsAbsent(x.Status)),
                    g.Count(x => x.Status == AttendanceStatus.Late),
                    g.Count(x => x.Status == AttendanceStatus.Leave || x.Status == AttendanceStatus.LeaveWithoutPay),
                    designationId: AttendanceReportHelper.StableHash(g.Key!.Value));
            })
            .ToList();

        var deptSection = rows
            .GroupBy(r =>
            {
                profiles.TryGetValue(r.EmployeeId, out var p);
                return (p?.DepartmentId, p?.SectionId);
            })
            .Where(g => g.Key.DepartmentId.HasValue && g.Key.SectionId.HasValue)
            .Select((g, i) =>
            {
                var profile = profiles.Values.FirstOrDefault(p =>
                    p.DepartmentId == g.Key.DepartmentId && p.SectionId == g.Key.SectionId);
                var name = $"{profile?.DepartmentName ?? "Dept"} / {profile?.SectionName ?? "Section"}";
                return BuildBucket(
                    i + 1,
                    name,
                    g.Count(),
                    g.Count(x => AttendanceReportHelper.IsPresent(x.Status)),
                    g.Count(x => AttendanceReportHelper.IsAbsent(x.Status)),
                    g.Count(x => x.Status == AttendanceStatus.Late),
                    g.Count(x => x.Status == AttendanceStatus.Leave || x.Status == AttendanceStatus.LeaveWithoutPay),
                    AttendanceReportHelper.StableHash(g.Key.DepartmentId!.Value),
                    AttendanceReportHelper.StableHash(g.Key.SectionId!.Value));
            })
            .ToList();

        return new DailySummaryReportDto(
            overall,
            byDept,
            bySection,
            deptSection,
            byDesig,
            [],
            []);
    }
}

public sealed class GetJobCardRosterQueryHandler(
    IAttendanceEmployeeQuery employeeQuery) : IRequestHandler<GetJobCardRosterQuery, PagedJobCardRosterDto>
{
    public Task<PagedJobCardRosterDto> Handle(GetJobCardRosterQuery request, CancellationToken cancellationToken) =>
        employeeQuery.GetPagedRosterAsync(
            AttendanceReportHelper.ToEmployeeFilter(request.Filter),
            request.Page,
            request.PageSize,
            cancellationToken);
}

public sealed class GetJobCardQueryHandler(
    IAttendanceDbContext db,
    IAttendanceEmployeeQuery employeeQuery,
    IEmployeeDirectory employeeDirectory) : IRequestHandler<GetJobCardQuery, JobCardReportDto?>
{
    public async Task<JobCardReportDto?> Handle(GetJobCardQuery request, CancellationToken cancellationToken)
    {
        Guid? employeeGuid = null;
        if (request.EmployeeCard is > 0)
        {
            var map = await employeeDirectory.GetEmployeeIdsByPunchNumberAsync(request.Filter.CompanyId, cancellationToken);
            if (map.TryGetValue(request.EmployeeCard.Value, out var id))
            {
                employeeGuid = id;
            }
        }
        else if (!string.IsNullOrWhiteSpace(request.EmployeeId))
        {
            employeeGuid = await employeeDirectory.ResolveEmployeeIdByEmployeeIDAsync(
                request.Filter.CompanyId,
                request.EmployeeId.Trim(),
                cancellationToken);
        }

        if (employeeGuid is null)
        {
            return null;
        }

        var filter = request.Filter with { EmployeeID = null, SearchTerm = null };
        var rows = (await AttendanceReportHelper.LoadAttendancesAsync(db, filter, employeeQuery, cancellationToken))
            .Where(a => a.EmployeeId == employeeGuid)
            .ToList();

        var profiles = await employeeQuery.GetProfilesAsync(
            new AttendanceEmployeeFilter(request.Filter.CompanyId),
            cancellationToken);
        profiles.TryGetValue(employeeGuid.Value, out var profile);
        if (profile is null)
        {
            return null;
        }

        var employees = await employeeDirectory.GetEmployeesByIdAsync(request.Filter.CompanyId, cancellationToken);
        var isOtEnabled = employees.TryGetValue(employeeGuid.Value, out var employeeEntry) && employeeEntry.IsOtEnabled;

        var dayRows = rows.Select(a => new JobCardDayRowDto(
            AttendanceReportHelper.FormatDate(a.AttendanceDate),
            a.AttendanceDate.ToString("dddd"),
            AttendanceReportHelper.FormatJobCardStatus(a.Status),
            AttendanceReportHelper.FormatTime(a.InTime),
            AttendanceReportHelper.FormatTime(a.OutTime),
            a.LateMinutes,
            a.EarlyOutMinutes,
            AttendanceReportHelper.ResolveOtHours(a.OvertimeMinutes, isOtEnabled),
            Math.Round(a.WorkingMinutes / 60m, 2),
            a.ShiftName,
            null,
            a.DayType is DayType.WeeklyOff or DayType.Holiday,
            a.Remarks)).ToList();

        var summary = new JobCardSummaryDto(
            rows.Count(r => AttendanceReportHelper.IsPresent(r.Status)),
            rows.Count(r => AttendanceReportHelper.IsAbsent(r.Status)),
            rows.Count(r => r.DayType == DayType.WeeklyOff),
            rows.Count(r => r.DayType == DayType.Holiday),
            rows.Sum(r => AttendanceReportHelper.ResolveOtHours(r.OvertimeMinutes, isOtEnabled)),
            rows.Sum(r => r.LateMinutes),
            rows.Sum(r => r.EarlyOutMinutes));

        var (start, _) = AttendanceReportHelper.ResolveRange(request.Filter);
        var end = request.Filter.Date?.Date ?? request.Filter.ToDate.Date;

        return new JobCardReportDto(
            new JobCardEmployeeDto(
                profile.PunchNumber,
                profile.EmployeeID,
                profile.FullName,
                profile.DepartmentName ?? string.Empty,
                profile.DesignationName ?? string.Empty,
                profile.SectionName ?? string.Empty,
                null,
                null,
                rows.FirstOrDefault()?.ShiftName),
            summary,
            dayRows,
            AttendanceReportHelper.FormatDate(start),
            AttendanceReportHelper.FormatDate(end));
    }
}

public sealed class GetMissingEntriesQueryHandler(
    IAttendanceDbContext db,
    IAttendanceEmployeeQuery employeeQuery) : IRequestHandler<GetMissingEntriesQuery, MissingEntriesReportDto>
{
    public async Task<MissingEntriesReportDto> Handle(GetMissingEntriesQuery request, CancellationToken cancellationToken)
    {
        var rows = await AttendanceReportHelper.LoadAttendancesAsync(db, request.Filter, employeeQuery, cancellationToken);
        var missing = rows.Where(AttendanceReportHelper.IsMissingEntry).ToList();
        var profiles = await employeeQuery.GetProfilesAsync(AttendanceReportHelper.ToEmployeeFilter(request.Filter), cancellationToken);
        var legacyCompanyId = AttendanceReportHelper.LegacyCompanyId(request.Filter.CompanyId);
        var index = 1;

        var entries = missing.Select(a =>
        {
            profiles.TryGetValue(a.EmployeeId, out var profile);
            var missingType = AttendanceReportHelper.ResolveMissingType(a);
            return new MissingEntryRowDto(
                index++,
                a.PunchNumber > 0 ? a.PunchNumber : profile?.PunchNumber ?? 0,
                !string.IsNullOrWhiteSpace(a.EmployeeID) ? a.EmployeeID : profile?.EmployeeID ?? string.Empty,
                profile?.FullName ?? a.EmployeeID,
                legacyCompanyId,
                profile?.DepartmentName ?? string.Empty,
                profile?.DesignationName ?? string.Empty,
                a.ShiftName,
                AttendanceReportHelper.FormatDate(a.AttendanceDate),
                AttendanceReportHelper.FormatTime(a.InTime),
                AttendanceReportHelper.FormatTime(a.OutTime),
                missingType,
                a.Status.ToString());
        }).ToList();

        var summary = new MissingEntrySummaryDto(
            entries.Count,
            entries.Count(e => e.MissingType == "InTime"),
            entries.Count(e => e.MissingType == "OutTime"),
            entries.Count(e => e.MissingType == "Both"),
            entries.Count(e => e.MissingType == "Both" && e.Status == "Absent"));

        return new MissingEntriesReportDto(summary, entries);
    }
}

public sealed class GetAbsenteeismRecordsQueryHandler(
    IAttendanceDbContext db,
    IAttendanceEmployeeQuery employeeQuery) : IRequestHandler<GetAbsenteeismRecordsQuery, AbsenteeismReportDto>
{
    public async Task<AbsenteeismReportDto> Handle(GetAbsenteeismRecordsQuery request, CancellationToken cancellationToken)
    {
        var rows = await AttendanceReportHelper.LoadAttendancesAsync(db, request.Filter, employeeQuery, cancellationToken);
        var absentRows = rows.Where(r => AttendanceReportHelper.IsAbsent(r.Status)).OrderBy(r => r.EmployeeId).ThenBy(r => r.AttendanceDate).ToList();
        var profiles = await employeeQuery.GetProfilesAsync(AttendanceReportHelper.ToEmployeeFilter(request.Filter), cancellationToken);

        var consecutiveByKey = new Dictionary<(Guid EmployeeId, DateTime Date), int>();
        foreach (var group in absentRows.GroupBy(r => r.EmployeeId))
        {
            var ordered = group.OrderBy(r => r.AttendanceDate).ToList();
            var streak = 0;
            DateTime? prev = null;
            foreach (var row in ordered)
            {
                if (prev.HasValue && row.AttendanceDate.Date == prev.Value.AddDays(1))
                {
                    streak++;
                }
                else
                {
                    streak = 1;
                }

                consecutiveByKey[(row.EmployeeId, row.AttendanceDate)] = streak;
                prev = row.AttendanceDate;
            }
        }

        var index = 1;
        var records = absentRows.Select(a =>
        {
            profiles.TryGetValue(a.EmployeeId, out var profile);
            consecutiveByKey.TryGetValue((a.EmployeeId, a.AttendanceDate), out var streak);
            return new AbsenteeismRowDto(
                index++,
                a.PunchNumber > 0 ? a.PunchNumber : profile?.PunchNumber ?? 0,
                !string.IsNullOrWhiteSpace(a.EmployeeID) ? a.EmployeeID : profile?.EmployeeID ?? string.Empty,
                profile?.FullName ?? a.EmployeeID,
                profile?.DepartmentName ?? string.Empty,
                profile?.DesignationName ?? string.Empty,
                AttendanceReportHelper.FormatDate(a.AttendanceDate),
                a.Status.ToString(),
                streak,
                a.Remarks);
        }).ToList();

        var summary = new AbsenteeismSummaryDto(
            records.Count,
            records.Count,
            0,
            records.Count(r => r.ConsecutiveDays >= 3));

        return new AbsenteeismReportDto(summary, records);
    }
}

public sealed class GetDailyOtSheetQueryHandler(
    IAttendanceDbContext db,
    IAttendanceEmployeeQuery employeeQuery,
    IEmployeeDirectory employeeDirectory) : IRequestHandler<GetDailyOtSheetQuery, IReadOnlyList<DailyOtSheetRowDto>>
{
    public async Task<IReadOnlyList<DailyOtSheetRowDto>> Handle(GetDailyOtSheetQuery request, CancellationToken cancellationToken)
    {
        var rows = await AttendanceReportHelper.LoadAttendancesAsync(db, request.Filter, employeeQuery, cancellationToken);
        var employees = await employeeDirectory.GetEmployeesByIdAsync(request.Filter.CompanyId, cancellationToken);
        var otRows = rows
            .Where(r =>
            {
                var isOtEnabled = employees.TryGetValue(r.EmployeeId, out var e) && e.IsOtEnabled;
                return AttendanceReportHelper.ResolveOtHours(r.OvertimeMinutes, isOtEnabled) > 0;
            })
            .ToList();
        var profiles = await employeeQuery.GetProfilesAsync(AttendanceReportHelper.ToEmployeeFilter(request.Filter), cancellationToken);
        var index = 1;

        return otRows.Select(a =>
        {
            profiles.TryGetValue(a.EmployeeId, out var profile);
            var isOtEnabled = employees.TryGetValue(a.EmployeeId, out var e) && e.IsOtEnabled;
            return new DailyOtSheetRowDto(
                index++,
                a.PunchNumber > 0 ? a.PunchNumber : profile?.PunchNumber ?? 0,
                !string.IsNullOrWhiteSpace(a.EmployeeID) ? a.EmployeeID : profile?.EmployeeID ?? string.Empty,
                profile?.FullName ?? a.EmployeeID,
                profile?.DepartmentName ?? string.Empty,
                profile?.SectionName ?? string.Empty,
                profile?.DesignationName ?? string.Empty,
                a.ShiftName ?? string.Empty,
                AttendanceReportHelper.FormatDate(a.AttendanceDate),
                AttendanceReportHelper.FormatTime(a.InTime),
                AttendanceReportHelper.FormatTime(a.OutTime),
                AttendanceReportHelper.ResolveOtHours(a.OvertimeMinutes, isOtEnabled),
                a.Status.ToString());
        }).ToList();
    }
}

public sealed class GetDailyOtSummaryQueryHandler(
    IAttendanceDbContext db,
    IAttendanceEmployeeQuery employeeQuery,
    IEmployeeDirectory employeeDirectory) : IRequestHandler<GetDailyOtSummaryQuery, IReadOnlyList<DailyOtSummaryRowDto>>
{
    public async Task<IReadOnlyList<DailyOtSummaryRowDto>> Handle(GetDailyOtSummaryQuery request, CancellationToken cancellationToken)
    {
        var rows = await AttendanceReportHelper.LoadAttendancesAsync(db, request.Filter, employeeQuery, cancellationToken);
        var employees = await employeeDirectory.GetEmployeesByIdAsync(request.Filter.CompanyId, cancellationToken);
        var otRows = rows
            .Where(r =>
            {
                var isOtEnabled = employees.TryGetValue(r.EmployeeId, out var e) && e.IsOtEnabled;
                return AttendanceReportHelper.ResolveOtHours(r.OvertimeMinutes, isOtEnabled) > 0;
            })
            .ToList();
        var profiles = await employeeQuery.GetProfilesAsync(AttendanceReportHelper.ToEmployeeFilter(request.Filter), cancellationToken);

        return otRows
            .GroupBy(r =>
            {
                profiles.TryGetValue(r.EmployeeId, out var p);
                return p?.DepartmentId;
            })
            .Where(g => g.Key.HasValue)
            .Select((g, i) =>
            {
                var name = profiles.Values.FirstOrDefault(p => p.DepartmentId == g.Key)?.DepartmentName ?? "Unknown";
                return new DailyOtSummaryRowDto(
                    i + 1,
                    name,
                    g.Select(x => x.EmployeeId).Distinct().Count(),
                    g.Sum(x =>
                    {
                        var isOtEnabled = employees.TryGetValue(x.EmployeeId, out var e) && e.IsOtEnabled;
                        return AttendanceReportHelper.ResolveOtHours(x.OvertimeMinutes, isOtEnabled);
                    }),
                    name);
            })
            .ToList();
    }
}
