namespace PayrollService.Contracts;

public sealed record ApiResponse<T>(bool Success, string Message, T? Data, IReadOnlyList<string> Errors)
{
    public static ApiResponse<T> Ok(T? data, string message = "Success") => new(true, message, data, Array.Empty<string>());

    public static ApiResponse<T> Fail(string message, params string[] errors) => new(false, message, default, errors);
}

public sealed record PagedResponse<T>(IReadOnlyList<T> Items, int Page, int PageSize, int TotalCount);
