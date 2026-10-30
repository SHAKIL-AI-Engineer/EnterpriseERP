namespace HRService.Application.Employees;

public sealed class EmployeeExcelImportPreviewResult
{
    public required string SessionId { get; init; }
    public int TotalRows { get; init; }
    public int ValidRows { get; init; }
    public int InvalidRows { get; init; }
    public IReadOnlyList<EmployeeExcelImportRowError> Errors { get; init; } = [];
    public bool ErrorsTruncated { get; init; }
}

public sealed class EmployeeExcelImportConfirmResult
{
    public int TotalRows { get; init; }
    public int Created { get; init; }
    public int Updated { get; init; }
    public int Failed { get; init; }
    public int SuccessCount => Created + Updated;
    public IReadOnlyList<EmployeeExcelImportRowError> Errors { get; init; } = [];
}

public sealed record EmployeeExcelImportRowError(int RowNumber, string Field, string Message);

public sealed record EmployeeExcelImportConfirmRequest(string SessionId);
