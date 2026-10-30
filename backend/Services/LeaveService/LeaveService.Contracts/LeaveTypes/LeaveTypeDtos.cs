namespace LeaveService.Contracts.LeaveTypes;

public sealed record CreateLeaveTypeRequest(
    Guid CompanyId,
    string LeaveCode,
    string LeaveName,
    bool IsPaid,
    bool IsCarryForward,
    decimal MaxCarryForwardDays,
    bool IsEncashable);

public sealed record UpdateLeaveTypeRequest(
    string LeaveName,
    bool IsPaid,
    bool IsCarryForward,
    decimal MaxCarryForwardDays,
    bool IsEncashable);

public sealed record LeaveTypeDto(
    Guid Id,
    Guid CompanyId,
    string LeaveCode,
    string LeaveName,
    bool IsPaid,
    bool IsCarryForward,
    decimal MaxCarryForwardDays,
    bool IsEncashable,
    bool IsActive,
    DateTime CreatedAt);
