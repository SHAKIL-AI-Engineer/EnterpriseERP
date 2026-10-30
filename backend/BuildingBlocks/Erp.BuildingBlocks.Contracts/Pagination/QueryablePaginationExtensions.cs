using Microsoft.EntityFrameworkCore;

namespace Erp.BuildingBlocks.Contracts.Pagination;

public static class QueryablePaginationExtensions
{
    public static async Task<PaginatedList<T>> ToPaginatedListAsync<T>(
        this IQueryable<T> query,
        PagedRequest request,
        CancellationToken cancellationToken = default)
    {
        request.Normalize();

        var page = request.Page;
        var pageSize = request.PageSize < 1 ? PagedRequest.DefaultPageSize : request.PageSize;
        var getAll = request.GetAll;

        var totalCount = await query.CountAsync(cancellationToken);

        List<T> data;
        if (getAll)
        {
            data = await query.ToListAsync(cancellationToken);
        }
        else
        {
            data = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync(cancellationToken);
        }

        var pagination = PaginationMetadata.Create(page, pageSize, totalCount, getAll);
        return PaginatedList<T>.From(data, pagination);
    }
}
