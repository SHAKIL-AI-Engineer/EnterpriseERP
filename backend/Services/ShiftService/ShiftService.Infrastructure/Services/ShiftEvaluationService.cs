using Microsoft.EntityFrameworkCore;
using ShiftService.Application.Common;
using ShiftService.Application.Common.Interfaces;
using ShiftService.Application.DTOs;
using ShiftService.Domain.Entities;
using ShiftService.Domain.Enums;
using ShiftService.Infrastructure.Persistence;

namespace ShiftService.Infrastructure.Services;

public sealed class ShiftEvaluationService(
    ShiftDbContext db,
    IShiftSelectionService selection,
    ILeaveCalendarProvider leaveCalendar) : IShiftEvaluationService
{
    public async Task<ShiftEvaluationDto> EvaluateAsync(
        Guid companyId,
        Guid employeeId,
        DateTime attendanceDate,
        CancellationToken cancellationToken = default)
    {
        var date = attendanceDate.Date;
        var selected = await selection.GetApplicableShiftWithSourceAsync(companyId, employeeId, date);
        var shift = selected?.Shift
            ?? await db.Shifts.AsNoTracking()
                .FirstOrDefaultAsync(s => s.CompanyId == companyId && s.IsDefault && s.IsActive, cancellationToken)
            ?? await db.Shifts.AsNoTracking()
                .Where(s => s.CompanyId == companyId)
                .OrderByDescending(s => s.IsActive)
                .ThenByDescending(s => s.IsDefault)
                .FirstOrDefaultAsync(cancellationToken)
            ?? CreateFallbackShift(companyId);
        var assignmentSource = selected?.AssignmentSource ?? (shift.Id == Guid.Empty ? "Fallback" : "General");

        var rule = await db.ShiftRules.AsNoTracking()
            .FirstOrDefaultAsync(r => r.ShiftId == shift.Id, cancellationToken)
            ?? ShiftPolicyTemplates.CreateDefaultRule(companyId, shift.Id, shift.ShiftCategory);

        var (shiftStart, shiftEnd) = ShiftWindowCalculator.GetShiftBounds(date, shift);
        var (windowStart, windowEnd) = ShiftWindowCalculator.GetPunchWindow(
            date,
            shift,
            rule.OutGraceMinutes,
            rule.MaximumOvertimeMinutes);

        var isShiftWeeklyOff = shift.WeeklyOffDayOfWeek.HasValue
            && shift.WeeklyOffDayOfWeek.Value == (int)date.DayOfWeek;
        var isLeaveWeeklyOff = await leaveCalendar.IsWeeklyOffAsync(companyId, date, cancellationToken);
        var isWeeklyOff = isShiftWeeklyOff || isLeaveWeeklyOff;
        var isHoliday = await leaveCalendar.IsHolidayAsync(companyId, date, cancellationToken);

        var calendarDayType = isHoliday ? "Holiday"
            : isWeeklyOff ? "WeeklyOff"
            : "WorkingDay";

        var fullOt = (isHoliday && rule.HolidayWorkAllAsOvertime)
            || (isWeeklyOff && rule.WeeklyOffWorkAllAsOvertime);

        return new ShiftEvaluationDto(
            companyId,
            employeeId,
            date,
            shift.Id,
            shift.ShiftName,
            shift.ShiftCategory.ToString(),
            shiftStart,
            shiftEnd,
            shift.IsCrossDay,
            windowStart,
            windowEnd,
            calendarDayType,
            isWeeklyOff,
            isHoliday,
            fullOt,
            ShiftDtoMapping.ToPolicyDto(rule),
            assignmentSource);
    }

    public async Task<IReadOnlyList<ShiftEvaluationDto>> EvaluateManyAsync(
        Guid companyId,
        IReadOnlyCollection<Guid> employeeIds,
        DateTime attendanceDate,
        CancellationToken cancellationToken = default)
    {
        if (employeeIds.Count == 0)
        {
            return [];
        }

        var date = attendanceDate.Date;
        var employees = employeeIds.Distinct().ToList();

        var tempAssignments = new Dictionary<Guid, Shift>();
        foreach (var chunk in employees.Chunk(1000))
        {
            var rows = await db.TemporaryShiftAssignments
                .AsNoTracking()
                .Include(t => t.Shift)
                .ThenInclude(s => s!.Rule)
                .Where(t => t.CompanyId == companyId
                    && chunk.Contains(t.EmployeeId)
                    && t.ShiftDate.Date == date)
                .ToListAsync(cancellationToken);

            foreach (var row in rows)
            {
                if (row.Shift is not null)
                {
                    tempAssignments[row.EmployeeId] = row.Shift;
                }
            }
        }

        var regularAssignments = new Dictionary<Guid, Shift>();
        foreach (var chunk in employees.Chunk(1000))
        {
            var rows = await db.EmployeeShiftAssignments
                .AsNoTracking()
                .Include(a => a.Shift)
                .ThenInclude(s => s!.Rule)
                .Where(a => a.CompanyId == companyId
                    && chunk.Contains(a.EmployeeId)
                    && a.IsCurrent
                    && a.EffectiveFrom <= date
                    && (a.EffectiveTo == null || a.EffectiveTo >= date))
                .ToListAsync(cancellationToken);

            foreach (var row in rows)
            {
                if (row.Shift is not null)
                {
                    regularAssignments[row.EmployeeId] = row.Shift;
                }
            }
        }

        var defaultShift = await db.Shifts
            .AsNoTracking()
            .Include(s => s.Rule)
            .FirstOrDefaultAsync(s => s.CompanyId == companyId && s.IsDefault && s.IsActive, cancellationToken)
            ?? await db.Shifts
                .AsNoTracking()
                .Include(s => s.Rule)
                .Where(s => s.CompanyId == companyId)
                .OrderByDescending(s => s.IsActive)
                .ThenByDescending(s => s.IsDefault)
                .FirstOrDefaultAsync(cancellationToken)
            ?? CreateFallbackShift(companyId);

        var isLeaveWeeklyOff = await leaveCalendar.IsWeeklyOffAsync(companyId, date, cancellationToken);
        var isHoliday = await leaveCalendar.IsHolidayAsync(companyId, date, cancellationToken);

        return employees
            .Select(employeeId =>
            {
                if (tempAssignments.TryGetValue(employeeId, out var tempShift))
                {
                    return BuildEvaluation(companyId, employeeId, date, tempShift, "Temporary", isLeaveWeeklyOff, isHoliday);
                }

                if (regularAssignments.TryGetValue(employeeId, out var rosterShift))
                {
                    return BuildEvaluation(companyId, employeeId, date, rosterShift, "Roster", isLeaveWeeklyOff, isHoliday);
                }

                var source = defaultShift.Id == Guid.Empty ? "Fallback" : "General";
                return BuildEvaluation(companyId, employeeId, date, defaultShift, source, isLeaveWeeklyOff, isHoliday);
            })
            .ToList();
    }

    private static ShiftEvaluationDto BuildEvaluation(
        Guid companyId,
        Guid employeeId,
        DateTime date,
        Shift shift,
        string assignmentSource,
        bool isLeaveWeeklyOff,
        bool isHoliday)
    {
        var rule = shift.Rule
            ?? ShiftPolicyTemplates.CreateDefaultRule(companyId, shift.Id, shift.ShiftCategory);

        var (shiftStart, shiftEnd) = ShiftWindowCalculator.GetShiftBounds(date, shift);
        var (windowStart, windowEnd) = ShiftWindowCalculator.GetPunchWindow(
            date,
            shift,
            rule.OutGraceMinutes,
            rule.MaximumOvertimeMinutes);

        var isShiftWeeklyOff = shift.WeeklyOffDayOfWeek.HasValue
            && shift.WeeklyOffDayOfWeek.Value == (int)date.DayOfWeek;
        var isWeeklyOff = isShiftWeeklyOff || isLeaveWeeklyOff;
        var calendarDayType = isHoliday ? "Holiday"
            : isWeeklyOff ? "WeeklyOff"
            : "WorkingDay";
        var fullOt = (isHoliday && rule.HolidayWorkAllAsOvertime)
            || (isWeeklyOff && rule.WeeklyOffWorkAllAsOvertime);

        return new ShiftEvaluationDto(
            companyId,
            employeeId,
            date,
            shift.Id,
            shift.ShiftName,
            shift.ShiftCategory.ToString(),
            shiftStart,
            shiftEnd,
            shift.IsCrossDay,
            windowStart,
            windowEnd,
            calendarDayType,
            isWeeklyOff,
            isHoliday,
            fullOt,
            ShiftDtoMapping.ToPolicyDto(rule),
            assignmentSource);
    }

    private static Shift CreateFallbackShift(Guid companyId) =>
        new()
        {
            Id = Guid.Empty,
            CompanyId = companyId,
            ShiftName = "General",
            ShiftType = "GeneralDuty",
            ShiftCategory = ShiftCategory.GeneralDuty,
            PunchWindowBeforeMinutes = 60,
            StartTime = new TimeSpan(9, 0, 0),
            EndTime = new TimeSpan(18, 0, 0),
            IsCrossDay = false,
            IsGeneralDuty = true,
            IsDefault = true,
            IsActive = true
        };
}
