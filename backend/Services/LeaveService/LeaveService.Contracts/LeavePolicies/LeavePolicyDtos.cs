namespace LeaveService.Contracts.LeavePolicies;

public sealed record CreateLeavePolicyRequest(
    Guid CompanyId,
    Guid LeaveTypeId,
    decimal YearlyEntitlement,
    decimal MonthlyAccrual,
    int MinServiceMonths,
    decimal? MaxConsecutiveDays,
    bool RequiresApproval,
    bool AllowHalfDay,
    bool AllowNegativeBalance,
    bool ExcludeHolidaysFromLeaveDays,
    bool ExcludeWeeklyOffFromLeaveDays,
    int ApprovalLevelCount);

public sealed record UpdateLeavePolicyRequest(
    decimal YearlyEntitlement,
    decimal MonthlyAccrual,
    int MinServiceMonths,
    decimal? MaxConsecutiveDays,
    bool RequiresApproval,
    bool AllowHalfDay,
    bool AllowNegativeBalance,
    bool ExcludeHolidaysFromLeaveDays,
    bool ExcludeWeeklyOffFromLeaveDays,
    int ApprovalLevelCount,
    bool IsActive);

public sealed record LeavePolicyDto(
    Guid Id,
    Guid CompanyId,
    Guid LeaveTypeId,
    string? LeaveCode,
    decimal YearlyEntitlement,
    decimal MonthlyAccrual,
    int MinServiceMonths,
    decimal? MaxConsecutiveDays,
    bool RequiresApproval,
    bool AllowHalfDay,
    bool AllowNegativeBalance,
    bool ExcludeHolidaysFromLeaveDays,
    bool ExcludeWeeklyOffFromLeaveDays,
    int ApprovalLevelCount,
    bool IsActive);
