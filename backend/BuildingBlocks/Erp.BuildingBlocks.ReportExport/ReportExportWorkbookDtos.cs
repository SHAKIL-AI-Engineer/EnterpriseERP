namespace Erp.BuildingBlocks.ReportExport;



public sealed record ReportExportGroupDto(

    string Label,

    IReadOnlyList<IReadOnlyList<string>> Rows);



public sealed record ReportExportSheetDto(

    string SheetName,

    string SheetTitle,

    IReadOnlyList<string> Columns,

    IReadOnlyList<ReportExportGroupDto> Groups,

    string? HeaderColor = null);


