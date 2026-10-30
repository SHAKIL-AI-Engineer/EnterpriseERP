namespace QualityService.Contracts;

public sealed class ApiResponse<T>
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public T? Data { get; set; }
    public string[] Errors { get; set; } = [];

    public static ApiResponse<T> Ok(T data, string message = "Request processed successfully.") =>
        new() { Success = true, Message = message, Data = data };

    public static ApiResponse<T> Fail(string message, string[]? errors = null) =>
        new() { Success = false, Message = message, Errors = errors ?? [] };
}
