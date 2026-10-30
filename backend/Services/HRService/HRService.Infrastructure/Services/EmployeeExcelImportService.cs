using HRService.Application.Employees;

namespace HRService.Infrastructure.Services;

public sealed class EmployeeExcelImportService(
    IEmployeeImportService employeeImport,
    EmployeeExcelImportSessionStore sessions) : IEmployeeExcelImportService
{
    private const int MaxPreviewErrors = 200;

    public Task<EmployeeExcelImportPreviewResult> PreviewAsync(
        Guid companyId,
        Stream excelStream,
        CancellationToken cancellationToken = default)
    {
        _ = companyId;
        _ = cancellationToken;

        var (validRows, errors, totalRows) = EmployeeExcelImportParser.Parse(excelStream);
        var truncated = false;
        if (errors.Count > MaxPreviewErrors)
        {
            errors = errors.Take(MaxPreviewErrors).ToList();
            truncated = true;
        }

        var sessionId = sessions.Store(companyId, validRows);
        return Task.FromResult(new EmployeeExcelImportPreviewResult
        {
            SessionId = sessionId,
            TotalRows = totalRows,
            ValidRows = validRows.Count,
            InvalidRows = Math.Max(0, totalRows - validRows.Count),
            Errors = errors,
            ErrorsTruncated = truncated,
        });
    }

    public async Task<EmployeeExcelImportConfirmResult> ConfirmAsync(
        Guid companyId,
        string sessionId,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(sessionId))
        {
            throw new InvalidOperationException("sessionId is required.");
        }

        var rows = sessions.Take(companyId, sessionId.Trim())
            ?? throw new InvalidOperationException("Preview session not found or expired.");

        if (rows.Count == 0)
        {
            return new EmployeeExcelImportConfirmResult();
        }

        var result = await employeeImport.UpsertAsync(
            companyId,
            new EmployeeImportUpsertRequest(rows),
            cancellationToken);

        return new EmployeeExcelImportConfirmResult
        {
            TotalRows = rows.Count,
            Created = result.Created,
            Updated = result.Updated,
            Failed = result.Failed,
            Errors = result.Errors
                .Select(e => new EmployeeExcelImportRowError(e.RowIndex, e.Field, e.Message))
                .ToList(),
        };
    }
}
