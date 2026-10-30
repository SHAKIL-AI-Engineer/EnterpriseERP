namespace LeaveService.Contracts.LeaveBalances;

public sealed record GenerateYearlyBalancesRequest(Guid CompanyId, int YearNo, Guid? TriggeredBy);

public sealed record AccrueMonthlyBalancesRequest(Guid CompanyId, int YearNo, int Month, Guid? TriggeredBy);

public sealed record AdjustLeaveBalanceRequest(
    Guid CompanyId,
    Guid EmployeeId,
    Guid LeaveTypeId,
    int YearNo,
    decimal AdjustmentDays,
    string Remarks);

public sealed record EmployeeLeaveBalanceDto(
    Guid Id,
    Guid LeaveTypeId,
    string? LeaveCode,
    string? LeaveName,
    int YearNo,
    decimal OpeningBalance,
    decimal EntitledDays,
    decimal AccruedDays,
    decimal UsedDays,
    decimal PendingDays,
    decimal EncashDays,
    decimal CarryForwardDays,
    decimal BalanceDays);
