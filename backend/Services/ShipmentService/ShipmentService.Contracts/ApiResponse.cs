namespace ShipmentService.Contracts;

public sealed record ApiResponse<T>(bool Success, string Message, T? Data = default)
{
    public static ApiResponse<T> Ok(T data, string message = "Success.") => new(true, message, data);
}
