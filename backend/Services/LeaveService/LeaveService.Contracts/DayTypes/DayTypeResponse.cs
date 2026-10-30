namespace LeaveService.Contracts.DayTypes;

public enum DayTypeKind
{
    WorkingDay,
    WeeklyOff,
    Holiday,
    Leave,
    LeaveWithoutPay
}

public sealed record DayTypeResponse(
    DayTypeKind DayType,
    Guid? LeaveTypeId,
    string? LeaveCode,
    bool IsPaidLeave);
