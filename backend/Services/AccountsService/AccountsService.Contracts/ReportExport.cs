namespace AccountsService.Contracts;

public sealed record ReportExportRequestDto(string Title, string Format, IReadOnlyList<string> Columns, IReadOnlyList<IReadOnlyList<string>> Rows, IReadOnlyDictionary<string, string>? Meta = null);
public sealed record ReportExportFile(byte[] Content, string ContentType, string FileName);
