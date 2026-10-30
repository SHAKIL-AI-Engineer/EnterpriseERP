namespace Erp.BuildingBlocks.Contracts.Pagination;

public sealed class PaginationMetadata
{
    public int Page { get; init; }

    public int PageSize { get; init; }

    public int TotalCount { get; init; }

    public int TotalPages { get; init; }

    public bool HasNextPage { get; init; }

    public bool HasPreviousPage { get; init; }

    public bool GetAll { get; init; }

    public static PaginationMetadata Create(int page, int pageSize, int totalCount, bool getAll)
    {
        page = page < 1 ? 1 : page;
        pageSize = pageSize < 1 ? PagedRequest.DefaultPageSize : pageSize;
        var totalPages = totalCount == 0 ? 0 : (int)Math.Ceiling(totalCount / (double)pageSize);

        return new PaginationMetadata
        {
            Page = page,
            PageSize = pageSize,
            TotalCount = totalCount,
            TotalPages = totalPages,
            GetAll = getAll,
            HasNextPage = !getAll && page < totalPages,
            HasPreviousPage = !getAll && page > 1,
        };
    }
}
