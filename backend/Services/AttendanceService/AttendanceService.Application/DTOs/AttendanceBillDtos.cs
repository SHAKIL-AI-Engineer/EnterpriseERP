namespace AttendanceService.Application.DTOs;

public sealed record BillSummaryDto(decimal TotalAmount, int TotalEmployees, int TotalRecords);

public sealed record BillDto(
    int Id,
    int EmployeeCard,
    string EmployeeId,
    string EmployeeName,
    string Department,
    string Designation,
    string Date,
    decimal Amount,
    string Status,
    string CreatedAt,
    string ShiftName,
    string CompanyName,
    string? InTime,
    string? OutTime,
    int? TiffinCount);

public sealed record BillResponseDto(BillSummaryDto Summary, IReadOnlyList<BillDto> Records);

public sealed record ProcessBillsRequest(
    Guid CompanyId,
    DateTime FromDate,
    DateTime ToDate,
    Guid? DepartmentId = null,
    string? EmployeeType = null,
    string? SearchTerm = null);

public sealed record DeleteMultipleBillsRequest(IReadOnlyList<int> Ids);
