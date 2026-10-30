using ClosedXML.Excel;

namespace EnterpriseERP.Platform.Host.ImportExport;

public static class CompanyOrganogramExcelParser
{
    private static readonly string[] RequiredHeaders = ["CompanyNameEn", "DepartmentNameEn", "SectionNameEn"];

    private static readonly string[] CanonicalHeaders =
    [
        "CompanyNameEn", "CompanyNameBn",
        "DepartmentNameEn", "DepartmentNameBn",
        "SectionNameEn", "SectionNameBn",
        "DesignationNameEn", "DesignationNameBn",
        "LineNameEn", "LineNameBn", "IsActive",
    ];

    private static readonly Dictionary<string, string> HeaderAliases = new(StringComparer.OrdinalIgnoreCase)
    {
        ["CompanyName"] = "CompanyNameEn",
        ["DepartmentName"] = "DepartmentNameEn",
        ["SectionName"] = "SectionNameEn",
        ["DesignationName"] = "DesignationNameEn",
        ["LineName"] = "LineNameEn",
    };

    public static (List<CompanyOrganogramImportRow> Rows, List<OrganogramRowError> Errors) Parse(Stream stream)
    {
        using var workbook = new XLWorkbook(stream);
        var sheet = workbook.Worksheets.FirstOrDefault(w =>
            w.Name.Equals("CompanyOrganogram", StringComparison.OrdinalIgnoreCase)
            || w.Name.Equals("Organogram", StringComparison.OrdinalIgnoreCase)
            || w.Name.Equals("Data", StringComparison.OrdinalIgnoreCase))
            ?? workbook.Worksheets.Worksheet(1);

        var usedRange = sheet.RangeUsed();
        if (usedRange is null)
        {
            return ([], [new OrganogramRowError { Row = 0, Message = "empty sheet" }]);
        }

        var headerMap = MapHeaders(usedRange.FirstRow());
        var headerErrors = RequiredHeaders
            .Where(h => !headerMap.ContainsKey(h))
            .Select(h => new OrganogramRowError { Row = 1, Message = "missing column: " + h })
            .ToList();
        if (headerErrors.Count > 0)
        {
            return ([], headerErrors);
        }

        var rows = new List<CompanyOrganogramImportRow>();
        var errors = new List<OrganogramRowError>();
        var seen = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        foreach (var row in usedRange.RowsUsed().Skip(1))
        {
            var excelRow = row.RowNumber();
            if (RowEmpty(row, headerMap))
            {
                continue;
            }

            var item = new CompanyOrganogramImportRow
            {
                RowIndex = excelRow,
                CompanyNameEn = GetCell(row, headerMap, "CompanyNameEn"),
                CompanyNameBn = GetCell(row, headerMap, "CompanyNameBn"),
                DepartmentNameEn = GetCell(row, headerMap, "DepartmentNameEn"),
                DepartmentNameBn = GetCell(row, headerMap, "DepartmentNameBn"),
                SectionNameEn = GetCell(row, headerMap, "SectionNameEn"),
                SectionNameBn = GetCell(row, headerMap, "SectionNameBn"),
                DesignationNameEn = GetCell(row, headerMap, "DesignationNameEn"),
                DesignationNameBn = GetCell(row, headerMap, "DesignationNameBn"),
                LineNameEn = GetCell(row, headerMap, "LineNameEn"),
                LineNameBn = GetCell(row, headerMap, "LineNameBn"),
                IsActive = ParseActive(GetCell(row, headerMap, "IsActive")),
            };

            if (string.IsNullOrWhiteSpace(item.CompanyNameEn))
            {
                errors.Add(new OrganogramRowError { Row = excelRow, Column = "CompanyNameEn", Message = "required" });
            }

            if (string.IsNullOrWhiteSpace(item.DepartmentNameEn))
            {
                errors.Add(new OrganogramRowError { Row = excelRow, Column = "DepartmentNameEn", Message = "required" });
            }

            if (string.IsNullOrWhiteSpace(item.SectionNameEn))
            {
                errors.Add(new OrganogramRowError { Row = excelRow, Column = "SectionNameEn", Message = "required" });
            }

            if (string.IsNullOrWhiteSpace(item.DepartmentNameBn))
            {
                item = item with { DepartmentNameBn = item.DepartmentNameEn };
            }

            if (string.IsNullOrWhiteSpace(item.SectionNameBn))
            {
                item = item with { SectionNameBn = item.SectionNameEn };
            }

            if (string.IsNullOrWhiteSpace(item.DesignationNameBn))
            {
                item = item with { DesignationNameBn = item.DesignationNameEn };
            }

            if (string.IsNullOrWhiteSpace(item.LineNameBn))
            {
                item = item with { LineNameBn = item.LineNameEn };
            }

            var key = string.Join('|', item.CompanyNameEn, item.DepartmentNameEn, item.SectionNameEn,
                item.DesignationNameEn, item.LineNameEn).ToUpperInvariant();
            if (!seen.Add(key))
            {
                errors.Add(new OrganogramRowError { Row = excelRow, Message = "duplicate organogram row in file" });
            }

            if (errors.Any(e => e.Row == excelRow))
            {
                continue;
            }

            rows.Add(item);
        }

        return (rows, errors);
    }

    private static Dictionary<string, int> MapHeaders(IXLRangeRow headerRow)
    {
        var map = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);
        foreach (var cell in headerRow.CellsUsed())
        {
            var key = NormalizeHeaderKey(cell.GetString());
            foreach (var canonical in CanonicalHeaders)
            {
                if (string.Equals(key, canonical, StringComparison.OrdinalIgnoreCase)
                    || string.Equals(key, canonical.Replace(" ", "", StringComparison.Ordinal), StringComparison.OrdinalIgnoreCase))
                {
                    map[canonical] = cell.Address.ColumnNumber;
                }
            }

            if (HeaderAliases.TryGetValue(key, out var alias))
            {
                map[alias] = cell.Address.ColumnNumber;
            }
        }

        return map;
    }

    private static string NormalizeHeaderKey(string value) =>
        string.Concat(value.Trim().Where(c => !char.IsWhiteSpace(c)));

    private static bool RowEmpty(IXLRangeRow row, IReadOnlyDictionary<string, int> headerMap)
    {
        foreach (var col in headerMap.Values)
        {
            if (!string.IsNullOrWhiteSpace(row.Cell(col).GetString()))
            {
                return false;
            }
        }

        return true;
    }

    private static string GetCell(IXLRangeRow row, IReadOnlyDictionary<string, int> headerMap, string name)
    {
        if (!headerMap.TryGetValue(name, out var col))
        {
            return "";
        }

        return row.Cell(col).GetString().Trim();
    }

    private static bool ParseActive(string raw)
    {
        raw = raw.Trim().ToLowerInvariant();
        if (raw.Length == 0)
        {
            return true;
        }

        return raw switch
        {
            "inactive" or "false" or "no" or "n" or "0" => false,
            _ => true,
        };
    }
}
