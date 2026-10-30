namespace HRService.Application.Employees;

public interface IEmployeeExcelImportService
{
    Task<EmployeeExcelImportPreviewResult> PreviewAsync(
        Guid companyId,
        Stream excelStream,
        CancellationToken cancellationToken = default);

    Task<EmployeeExcelImportConfirmResult> ConfirmAsync(
        Guid companyId,
        string sessionId,
        CancellationToken cancellationToken = default);
}
