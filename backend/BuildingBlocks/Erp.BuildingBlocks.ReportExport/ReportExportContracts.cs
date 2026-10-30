namespace Erp.BuildingBlocks.ReportExport;

public sealed record ReportExportRequestDto(
    string Title,
    string Format,
    IReadOnlyList<string>? Columns = null,
    IReadOnlyList<IReadOnlyList<string>>? Rows = null,
    IReadOnlyDictionary<string, string>? Meta = null,
    IReadOnlyList<ReportExportSheetDto>? Sheets = null);

public sealed record ReportExportFile(byte[] Content, string ContentType, string FileName);

public sealed record ReportColumn<T>(string Header, Func<T, string> Value);
