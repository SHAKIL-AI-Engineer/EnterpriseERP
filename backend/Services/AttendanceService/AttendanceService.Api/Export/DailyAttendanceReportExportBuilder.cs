using AttendanceService.Application.DTOs;
using Erp.BuildingBlocks.ReportExport;

namespace AttendanceService.Api.Export;

internal static class DailyAttendanceReportExportBuilder
{
    private static readonly string[] DetailColumns =
    [
        "SL", "Employee ID", "Name", "Designation", "Shift", "In", "Out", "Status", "OT Hours"
    ];

    public static ReportExportRequestDto BuildExcelWorkbook(
        string baseTitle,
        IReadOnlyList<DailyReportRowDto> rows,
        IReadOnlyDictionary<string, string>? meta)
    {
        var ordered = rows.OrderBy(r => r.EmployeeName).ThenBy(r => r.EmployeeId).ToList();

        return ReportExportMapper.BuildWorkbook(
            baseTitle,
            "Excel",
            [
                BuildSheet("Department", $"{baseTitle} — By Department", "D9EAF7", ordered, GroupByDepartment),
                BuildSheet("Section", $"{baseTitle} — By Section", "D1FAE5", ordered, GroupBySection),
                BuildSheet("Designation", $"{baseTitle} — By Designation", "FDE68A", ordered, GroupByDesignation),
                BuildSheet("Line", $"{baseTitle} — By Line", "E9D5FF", ordered, GroupByLine),
            ],
            meta);
    }

    public static ReportExportRequestDto BuildPdf(
        string title,
        IReadOnlyList<DailyReportRowDto> rows,
        IReadOnlyDictionary<string, string>? meta)
    {
        var ordered = rows.OrderBy(r => r.EmployeeName).ThenBy(r => r.EmployeeId).ToList();
        var exportRows = ordered.Select((r, i) => ToDetailRow(r, i + 1)).ToList();
        return new ReportExportRequestDto(title, "PDF", DetailColumns, exportRows, meta, null);
    }

    private static ReportExportSheetDto BuildSheet(
        string sheetName,
        string sheetTitle,
        string headerColor,
        IReadOnlyList<DailyReportRowDto> rows,
        Func<DailyReportRowDto, string> groupKey)
    {
        var groups = rows
            .GroupBy(groupKey)
            .OrderBy(g => g.Key, StringComparer.OrdinalIgnoreCase)
            .Select(g =>
            {
                var sl = 1;
                var groupRows = g.Select(r => ToDetailRow(r, sl++)).ToList();
                return new ReportExportGroupDto(FormatGroupLabel(sheetName, g.Key), groupRows);
            })
            .ToList();

        return new ReportExportSheetDto(sheetName, sheetTitle, DetailColumns, groups, headerColor);
    }

    private static string GroupByDepartment(DailyReportRowDto r) =>
        string.IsNullOrWhiteSpace(r.Department) ? "Unassigned" : r.Department.Trim();

    private static string GroupBySection(DailyReportRowDto r) =>
        string.IsNullOrWhiteSpace(r.Section) ? "Unassigned" : r.Section.Trim();

    private static string GroupByDesignation(DailyReportRowDto r) =>
        string.IsNullOrWhiteSpace(r.Designation) ? "Unassigned" : r.Designation.Trim();

    private static string GroupByLine(DailyReportRowDto r) =>
        string.IsNullOrWhiteSpace(r.Line) ? "Unassigned" : r.Line.Trim();

    private static string FormatGroupLabel(string sheetName, string name) => sheetName switch
    {
        "Department" => $"Department: {name}",
        "Section" => $"Section: {name}",
        "Designation" => $"Designation: {name}",
        "Line" => $"Line: {name}",
        _ => name,
    };

    private static IReadOnlyList<string> ToDetailRow(DailyReportRowDto r, int index) =>
    [
        (index + 1).ToString(),
        r.EmployeeId,
        r.EmployeeName,
        r.Designation,
        r.Shift,
        r.InTime ?? "",
        r.OutTime ?? "",
        r.Status,
        r.OtHours.ToString("0.##"),
    ];

}
