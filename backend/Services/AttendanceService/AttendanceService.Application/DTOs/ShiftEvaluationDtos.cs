namespace AttendanceService.Application.DTOs;

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

public record ShiftPolicyDto(
    Guid Id, Guid ShiftId, int InGraceMinutes, int OutGraceMinutes,
    int LateAfterMinutes, int EarlyOutBeforeMinutes, int MinimumWorkingMinutes,
    int HalfDayWorkingMinutes, bool AllowOvertime, int OvertimeStartAfterMinutes,
    int MinimumOvertimeMinutes, int MaximumOvertimeMinutes,
    int LunchBreakMinutes, bool DeductLunchFromWorking,
    bool HolidayWorkAllAsOvertime, bool WeeklyOffWorkAllAsOvertime);
