namespace Erp.BuildingBlocks.ReportExport;

public static class ReportExportMapper
{
    public static ReportExportRequestDto Build<T>(
        string title,
        string format,
        IReadOnlyList<T> items,
        IReadOnlyList<ReportColumn<T>> columns,
        IReadOnlyDictionary<string, string>? meta = null)
    {
        var headers = columns.Select(c => c.Header).ToList();
        var rows = items
            .Select(item => (IReadOnlyList<string>)columns.Select(c => c.Value(item)).ToList())
            .ToList();
        return new ReportExportRequestDto(title, format, headers, rows, meta, null);
    }

    public static ReportExportRequestDto BuildWorkbook(
        string title,
        string format,
        IReadOnlyList<ReportExportSheetDto> sheets,
        IReadOnlyDictionary<string, string>? meta = null) =>
        new(title, format, null, null, meta, sheets);

    public static Dictionary<string, string> MetaWithFilters(IReadOnlyDictionary<string, string>? filters)
    {
        var meta = new Dictionary<string, string>
        {
            ["GeneratedAt"] = DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm:ss UTC"),
        };
        if (filters is null)
        {
            return meta;
        }

        foreach (var (key, value) in filters)
        {
            if (!string.IsNullOrWhiteSpace(value))
            {
                meta[key] = value;
            }
        }

        return meta;
    }
}
