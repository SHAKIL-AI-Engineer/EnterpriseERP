namespace LeaveService.Contracts.LeaveEncashments;

public sealed record LeaveEncashmentRequest(
    Guid CompanyId,
    Guid EmployeeId,
    Guid LeaveTypeId,
    int YearNo,
    decimal EncashDays,
    decimal RatePerDay,
    Guid? RequestedBy);

public sealed record LeaveEncashmentDto(
    Guid Id,
    Guid CompanyId,
    Guid EmployeeId,
    Guid LeaveTypeId,
    int YearNo,
    decimal EncashDays,
    decimal RatePerDay,
    decimal TotalAmount,
    string Status,
    Guid? RequestedBy,
    Guid? ApprovedBy,
    DateTime? ApprovedAt,
    DateTime CreatedAt);
