namespace Erp.BuildingBlocks.Contracts.Pagination;

public class PagedRequest
{
    public const int DefaultPageSize = 50;

    private static readonly HashSet<int> AllowedPageSizes = [10, 20, 50, 100];

    private int _page = 1;
    private int _pageSize = DefaultPageSize;

    public int Page
    {
        get => _page;
        set => _page = value < 1 ? 1 : value;
    }

    public int PageSize
    {
        get => _pageSize;
        set
        {
            if (GetAll)
            {
                _pageSize = value < 1 ? DefaultPageSize : value;
                return;
            }

            _pageSize = value switch
            {
                <= 0 => DefaultPageSize,
                _ when AllowedPageSizes.Contains(value) => value,
                > 100 => 100,
                _ => DefaultPageSize,
            };
        }
    }

    public bool GetAll { get; set; }

    public string? SortBy { get; set; }

    /// <summary>Query: sortOrder = asc | desc</summary>
    public string? SortOrder
    {
        get => SortDescending ? "desc" : "asc";
        set
        {
            if (string.IsNullOrWhiteSpace(value))
                return;

            SortDescending = string.Equals(value.Trim(), "desc", StringComparison.OrdinalIgnoreCase);
        }
    }

    public bool SortDescending { get; set; } = true;

    public string? Search { get; set; }

    public void Normalize()
    {
        if (Page < 1)
            Page = 1;

        if (GetAll)
        {
            if (PageSize < 1)
                PageSize = DefaultPageSize;
            return;
        }

        if (PageSize < 1 || !AllowedPageSizes.Contains(PageSize))
            PageSize = DefaultPageSize;
    }
}
