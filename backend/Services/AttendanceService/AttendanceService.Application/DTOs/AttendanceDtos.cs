namespace AttendanceService.Application.DTOs;

public record ShiftDto(
    Guid Id, Guid CompanyId, string ShiftName, string ShiftType,
    TimeSpan StartTime, TimeSpan EndTime, bool IsCrossDay, bool IsGeneralDuty,
    bool IsDefault, bool IsActive);

public record ShiftRuleDto(
    Guid Id, Guid ShiftId, int InGraceMinutes, int OutGraceMinutes,
    int LateAfterMinutes, int EarlyOutBeforeMinutes, int MinimumWorkingMinutes,
    int HalfDayWorkingMinutes, bool AllowOvertime, int OvertimeStartAfterMinutes,
    int MinimumOvertimeMinutes, int MaximumOvertimeMinutes);

public record ShiftBreakDto(
    Guid Id, Guid ShiftId, string BreakName, TimeSpan BreakStartTime,
    TimeSpan BreakEndTime, int BreakMinutes, bool IsPaidBreak, bool IsActive);

public record DailyAttendanceDto(
    Guid Id, string EmployeeID, int PunchNumber, DateTime AttendanceDate, DateTime? InTime,
    DateTime? OutTime, string? ShiftName, int LateMinutes, int OTMinutes,
    int WorkingMinutes, string Status, string? Remarks);

public record PunchLogDto(
    Guid Id, int PunchNumber, string? EmployeeID, DateTime PunchTime, string? DeviceSerial);
