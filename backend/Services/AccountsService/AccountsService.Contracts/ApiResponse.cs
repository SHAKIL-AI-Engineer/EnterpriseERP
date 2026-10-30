namespace AccountsService.Contracts;

public sealed record ApiResponse<T>(bool Success, string Message, T? Data = default, IReadOnlyList<string>? Errors = null)
{
    public static ApiResponse<T> Ok(T data, string message = "Success.") => new(true, message, data);
    public static ApiResponse<T> Fail(string message, IReadOnlyList<string>? errors = null) => new(false, message, default, errors);
}
