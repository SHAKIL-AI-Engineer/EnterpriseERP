using ShiftService.Domain.Enums;

namespace ShiftService.Application.DTOs;

public record ShiftDto(
    Guid Id, Guid CompanyId, string ShiftName, string ShiftType,
    ShiftCategory ShiftCategory, int PunchWindowBeforeMinutes,
    TimeSpan StartTime, TimeSpan EndTime, bool IsCrossDay, bool IsGeneralDuty,
    bool IsDefault, bool IsActive, int? WeeklyOffDayOfWeek = null);

public record ShiftDetailDto(
    ShiftDto Shift,
    ShiftPolicyDto? Policy,
    IReadOnlyList<ShiftBreakDto> Breaks);

public record ShiftPolicyDto(
    Guid Id, Guid ShiftId, int InGraceMinutes, int OutGraceMinutes,
    int LateAfterMinutes, int EarlyOutBeforeMinutes, int MinimumWorkingMinutes,
    int HalfDayWorkingMinutes, bool AllowOvertime, int OvertimeStartAfterMinutes,
    int MinimumOvertimeMinutes, int MaximumOvertimeMinutes,
    int LunchBreakMinutes, bool DeductLunchFromWorking,
    bool HolidayWorkAllAsOvertime, bool WeeklyOffWorkAllAsOvertime);

public record ShiftBreakDto(
    Guid Id, Guid ShiftId, BreakType BreakType, string BreakName, TimeSpan BreakStartTime,
    TimeSpan BreakEndTime, int BreakMinutes, bool IsPaidBreak, bool IsActive);

public record EmployeeShiftAssignmentDto(
    Guid Id, Guid EmployeeId, Guid ShiftId, string ShiftName,
    DateTime EffectiveFrom, DateTime? EffectiveTo, bool IsCurrent);

public record TemporaryShiftAssignmentDto(
    Guid Id, Guid EmployeeId, Guid ShiftId, string ShiftName,
    DateTime ShiftDate, string? Reason, Guid CompanyId = default);

public record ShiftCalendarDto(
    Guid Id, Guid? EmployeeId, Guid? ShiftId, DateTime CalendarDate,
    string DayType, string? Remarks);

public record ShiftEvaluationDto(
    Guid CompanyId,
    Guid EmployeeId,
    DateTime AttendanceDate,
    Guid ShiftId,
    string ShiftName,
    string ShiftCategory,
    DateTime ShiftStart,
    DateTime ShiftEnd,
    bool IsCrossDay,
    DateTime PunchWindowStart,
    DateTime PunchWindowEnd,
    string CalendarDayType,
    bool IsWeeklyOff,
    bool IsHoliday,
    bool IsOffDayWorkEligibleForFullOt,
    ShiftPolicyDto Policy,
    string AssignmentSource = "Default");

public static class ShiftDtoMapping
{
    public static ShiftDto ToDto(ShiftService.Domain.Entities.Shift s) =>
        new(s.Id, s.CompanyId, s.ShiftName, s.ShiftType,
            s.ShiftCategory, s.PunchWindowBeforeMinutes,
            s.StartTime, s.EndTime, s.IsCrossDay, s.IsGeneralDuty, s.IsDefault, s.IsActive, s.WeeklyOffDayOfWeek);

    public static ShiftPolicyDto ToPolicyDto(ShiftService.Domain.Entities.ShiftRule r) =>
        new(r.Id, r.ShiftId, r.InGraceMinutes, r.OutGraceMinutes,
            r.LateAfterMinutes, r.EarlyOutBeforeMinutes, r.MinimumWorkingMinutes,
            r.HalfDayWorkingMinutes, r.AllowOvertime, r.OvertimeStartAfterMinutes,
            r.MinimumOvertimeMinutes, r.MaximumOvertimeMinutes,
            r.LunchBreakMinutes, r.DeductLunchFromWorking,
            r.HolidayWorkAllAsOvertime, r.WeeklyOffWorkAllAsOvertime);

    public static ShiftBreakDto ToBreakDto(ShiftService.Domain.Entities.ShiftBreak b) =>
        new(b.Id, b.ShiftId, b.BreakType, b.BreakName, b.BreakStartTime,
            b.BreakEndTime, b.BreakMinutes, b.IsPaidBreak, b.IsActive);
}
