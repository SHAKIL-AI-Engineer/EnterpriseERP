using AttendanceService.Application.DTOs;

namespace AttendanceService.Application.Common.Interfaces;

public interface IAttendanceBillService
{
    Task<BillResponseDto> GetAsync(string billType, BillQuery query, CancellationToken cancellationToken = default);
    Task<int> ProcessAsync(string billType, ProcessBillsRequest request, CancellationToken cancellationToken = default);
    Task<bool> DeleteAsync(string billType, int id, CancellationToken cancellationToken = default);
    Task<int> DeleteMultipleAsync(string billType, IReadOnlyList<int> ids, CancellationToken cancellationToken = default);
    Task<byte[]> ExportCsvAsync(string billType, BillQuery query, CancellationToken cancellationToken = default);
}

public sealed record BillQuery(
    Guid CompanyId,
    DateTime FromDate,
    DateTime ToDate,
    Guid? DepartmentId = null,
    string? EmployeeType = null,
    string? SearchTerm = null);
