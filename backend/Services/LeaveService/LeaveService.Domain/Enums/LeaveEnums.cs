namespace LeaveService.Domain.Enums;

public enum LeaveStatus
{
    Draft,
    Pending,
    Approved,
    Rejected,
    Cancelled
}

public enum HalfDayType
{
    FirstHalf,
    SecondHalf
}

public enum ApprovalStatus
{
    Pending,
    Approved,
    Rejected
}

public enum TransactionType
{
    Entitlement,
    Accrual,
    Apply,
    Approve,
    Reject,
    Cancel,
    Encash,
    CarryForward,
    Adjustment
}

public enum HolidayType
{
    Government,
    Company,
    Festival,
    Special
}

public enum EarnLeaveCalculationType
{
    Monthly,
    Yearly,
    WorkingDaysBased
}

public enum EncashmentStatus
{
    Pending,
    Approved,
    Rejected,
    Paid
}
