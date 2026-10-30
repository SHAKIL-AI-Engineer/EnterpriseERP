namespace AttendanceService.Domain.Enums;

public enum AttendanceStatus
{
    Present,
    Absent,
    Late,
    EarlyOut,
    HalfDay,
    MissingPunch,
    HolidayPresent,
    WeeklyOffPresent,
    Leave,
    LeaveWithoutPay,
    ManualPresent,
    /// <summary>Weekly off / weekend rest day with no attendance.</summary>
    WeeklyOff,
    /// <summary>Holiday rest day with no attendance.</summary>
    Holiday
}

public enum DayType
{
    WorkingDay,
    WeeklyOff,
    Holiday,
    SpecialWorkingDay
}

public enum ApprovalStatus
{
    Pending,
    Approved,
    Rejected
}

public enum PunchType
{
    IN,
    OUT,
    UNKNOWN
}

public enum SourceType
{
    Device,
    Excel,
    CSV,
    Manual,
    API
}

public enum ApprovalType
{
    Daily,
    Monthly,
    Adjustment
}

public enum ProcessStatus
{
    Started,
    Processing,
    Success,
    Failed,
    Partial
}
