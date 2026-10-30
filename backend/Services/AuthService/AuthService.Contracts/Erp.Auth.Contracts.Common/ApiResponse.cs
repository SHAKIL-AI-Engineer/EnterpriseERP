using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace AuthService.Contracts.Common;

public sealed class ApiResponse<T>
{
	public bool Success { get; init; }

	public string TraceId { get; init; } = string.Empty;

	public T? Data { get; init; }

	[JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
	public IReadOnlyList<ApiError>? Errors { get; init; }

	public static ApiResponse<T> Ok(T data, string traceId)
	{
		return new ApiResponse<T>
		{
			Success = true,
			TraceId = traceId,
			Data = data
		};
	}

	public static ApiResponse<T> Fail(string traceId, IReadOnlyList<ApiError> errors)
	{
		return new ApiResponse<T>
		{
			Success = false,
			TraceId = traceId,
			Errors = errors
		};
	}
}
