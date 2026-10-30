namespace Erp.BuildingBlocks.Contracts.Pagination;

public sealed class PaginatedList<T>
{
    public IReadOnlyList<T> Data { get; init; } = Array.Empty<T>();

    public PaginationMetadata Pagination { get; init; } = PaginationMetadata.Create(1, PagedRequest.DefaultPageSize, 0, false);

    public static PaginatedList<T> From(IReadOnlyList<T> data, PaginationMetadata pagination) =>
        new() { Data = data, Pagination = pagination };
}
