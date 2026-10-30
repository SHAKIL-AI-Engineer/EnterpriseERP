namespace AttendanceService.Application.Common.Interfaces;

public sealed record EmployeeDirectoryEntry(Guid Id, int PunchNumber, string EmployeeID, bool IsOtEnabled = true);

public interface IEmployeeDirectory
{
    Task<IReadOnlyDictionary<int, Guid>> GetEmployeeIdsByPunchNumberAsync(Guid companyId, CancellationToken cancellationToken = default);

    Task<IReadOnlyDictionary<Guid, EmployeeDirectoryEntry>> GetEmployeesByIdAsync(Guid companyId, CancellationToken cancellationToken = default);

    Task<EmployeeDirectoryEntry?> ResolveByPunchNumberAsync(Guid companyId, int punchNumber, CancellationToken cancellationToken = default);

    Task<Guid?> ResolveEmployeeIdByEmployeeIDAsync(Guid companyId, string employeeID, CancellationToken cancellationToken = default);

    Task<IReadOnlyList<EmployeeDirectoryEntry>> ListByCompanyAsync(Guid companyId, CancellationToken cancellationToken = default);
}
