namespace LeaveService.Contracts.LeaveApplications;

public sealed record ApplyLeaveRequest(
    Guid CompanyId,
    Guid EmployeeId,
    Guid LeaveTypeId,
    DateOnly FromDate,
    DateOnly ToDate,
    bool IsHalfDay,
    string? HalfDayType,
    string? Reason,
    string? AttachmentUrl,
    Guid AppliedBy,
    IReadOnlyList<ApprovalStepSeedDto>? ApprovalSteps);

public sealed record ApprovalStepSeedDto(int ApprovalLevel, Guid? ApproverUserId, Guid? ApproverEmployeeId);

public sealed record ApproveLeaveRequest(Guid LeaveApplicationId, Guid ApprovedBy, Guid? ApproverUserId);

public sealed record RejectLeaveRequest(Guid LeaveApplicationId, Guid RejectedBy, string Remarks, Guid? ApproverUserId);

public sealed record CancelLeaveRequest(Guid LeaveApplicationId, Guid CancelledBy);

public sealed record LeaveApplicationListItemDto(
    Guid Id,
    Guid CompanyId,
    Guid EmployeeId,
    string EmployeeCode,
    string EmployeeName,
    string? DepartmentName,
    string? DesignationName,
    Guid LeaveTypeId,
    string? LeaveCode,
    string? LeaveTypeName,
    DateOnly FromDate,
    DateOnly ToDate,
    decimal TotalDays,
    bool IsHalfDay,
    string? HalfDayType,
    string? Reason,
    string Status,
    Guid AppliedBy,
    DateTime AppliedAt,
    DateTime? ApprovedAt,
    DateTime? RejectedAt,
    DateTime? CancelledAt);

public sealed record LeaveApplicationDto(
    Guid Id,
    Guid CompanyId,
    Guid EmployeeId,
    Guid LeaveTypeId,
    string? LeaveCode,
    DateOnly FromDate,
    DateOnly ToDate,
    decimal TotalDays,
    bool IsHalfDay,
    string? HalfDayType,
    string? Reason,
    string Status,
    Guid AppliedBy,
    DateTime AppliedAt,
    DateTime? ApprovedAt,
    DateTime? RejectedAt,
    DateTime? CancelledAt,
    IReadOnlyList<LeaveApprovalStepDto> Steps);

public sealed record LeaveApprovalStepDto(
    Guid Id,
    int ApprovalLevel,
    Guid? ApproverUserId,
    Guid? ApproverEmployeeId,
    string Status,
    string? Remarks,
    DateTime? ActionAt);
