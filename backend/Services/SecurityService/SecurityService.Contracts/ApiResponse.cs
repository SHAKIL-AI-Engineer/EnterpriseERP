namespace SecurityService.Contracts;

public sealed record ApiResponse<T>(bool Success, string Message, T? Data, IReadOnlyDictionary<string, string[]>? Errors = null)
{
    public static ApiResponse<T> Ok(T data, string message = "Success") => new(true, message, data);
    public static ApiResponse<T> Fail(string message, IReadOnlyDictionary<string, string[]>? errors = null) => new(false, message, default, errors);
}

public sealed record ApiResponse(bool Success, string Message, IReadOnlyDictionary<string, string[]>? Errors = null)
{
    public static ApiResponse Ok(string message = "Success") => new(true, message);
    public static ApiResponse Fail(string message, IReadOnlyDictionary<string, string[]>? errors = null) => new(false, message, errors);
}

public sealed record ReportExportRequest(Guid CompanyId, string ReportName, string Format, object Parameters, object Data);

public sealed record ExportResultDto(string JobId, string Status, string? DownloadUrl);
