using System.Text.Json.Serialization;
using Erp.BuildingBlocks.Contracts.Pagination;

namespace Erp.BuildingBlocks.CommonResponses;

public sealed class PaginatedApiResponse<T>
{
    public bool Success { get; init; }

    public string Message { get; init; } = string.Empty;

    public string TraceId { get; init; } = string.Empty;

    public IReadOnlyList<T> Data { get; init; } = Array.Empty<T>();

    public PaginationMetadata Pagination { get; init; } = PaginationMetadata.Create(1, PagedRequest.DefaultPageSize, 0, false);

    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public IReadOnlyList<ApiError>? Errors { get; init; }

    public static PaginatedApiResponse<T> Ok(
        IReadOnlyList<T> data,
        PaginationMetadata pagination,
        string message,
        string traceId) =>
        new()
        {
            Success = true,
            Message = message,
            TraceId = traceId,
            Data = data,
            Pagination = pagination,
        };

    public static PaginatedApiResponse<T> Fail(string traceId, IReadOnlyList<ApiError> errors, string message = "Request failed") =>
        new()
        {
            Success = false,
            Message = message,
            TraceId = traceId,
            Errors = errors,
            Data = Array.Empty<T>(),
            Pagination = PaginationMetadata.Create(1, PagedRequest.DefaultPageSize, 0, false),
        };
}
