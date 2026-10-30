namespace HRService.Application.Employees;

public interface IEmployeeImportService
{
    Task<EmployeeImportUpsertResult> UpsertAsync(Guid companyId, EmployeeImportUpsertRequest request, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<EmployeeImportRowDto>> ExportAsync(Guid companyId, CancellationToken cancellationToken = default);
}
