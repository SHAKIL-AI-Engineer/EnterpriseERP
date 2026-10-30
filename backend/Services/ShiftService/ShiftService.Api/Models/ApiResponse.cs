namespace ShiftService.Api.Models;

public class ApiResponse<T>
{
    public bool Success { get; set; }
    public T? Data { get; set; }
    public List<string>? Errors { get; set; }
    public string? TraceId { get; set; }

    public static ApiResponse<T> Ok(T data, string? traceId = null) => new() { Success = true, Data = data, TraceId = traceId };
    public static ApiResponse<T> Fail(List<string> errors, string? traceId = null) => new() { Success = false, Errors = errors, TraceId = traceId };
}
