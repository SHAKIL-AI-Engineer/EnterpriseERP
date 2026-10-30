using ClosedXML.Excel;

namespace EnterpriseERP.Platform.Host.ImportExport;

public static class AddressExcelParser
{
    private static readonly string[] DisplayHeaders =
    [
        "Country Name (EN)", "Country Name (BN)",
        "Division Name (EN)", "Division Name (BN)",
        "District Name (EN)", "District Name (BN)",
        "Thana Name (EN)", "Thana Name (BN)",
        "Post Office Name (EN)", "Post Office Name (BN)",
        "Post Code",
    ];

    private static readonly string[] CanonicalHeaders =
    [
        "CountryNameEn", "CountryNameBn",
        "DivisionNameEn", "DivisionNameBn",
        "DistrictNameEn", "DistrictNameBn",
        "ThanaNameEn", "ThanaNameBn",
        "PostOfficeNameEn", "PostOfficeNameBn",
        "PostCode",
    ];

    private static readonly Dictionary<string, string> HeaderAliases = new(StringComparer.OrdinalIgnoreCase)
    {
        ["CountryName"] = "CountryNameEn",
        ["DivisionName"] = "DivisionNameEn",
        ["DistrictName"] = "DistrictNameEn",
        ["ThanaName"] = "ThanaNameEn",
        ["UpazilaName"] = "ThanaNameEn",
        ["UpazilaNameEn"] = "ThanaNameEn",
        ["UpazilaNameBn"] = "ThanaNameBn",
        ["PostOfficeName"] = "PostOfficeNameEn",
        ["PostalCode"] = "PostCode",
        ["PostOfficeCode"] = "PostCode",
    };

    public static byte[] BuildDemoWorkbook()
    {
        using var workbook = new XLWorkbook();
        var sheet = workbook.Worksheets.Add("Address");
        for (var i = 0; i < DisplayHeaders.Length; i++)
        {
            sheet.Cell(1, i + 1).Value = DisplayHeaders[i];
        }

        var rows = new[]
        {
            new[] { "Bangladesh", "বাংলাদেশ", "Dhaka", "ঢাকা", "Dhaka", "ঢাকা", "Motijheel", "মতিঝিল", "Dhaka GPO", "ঢাকা জিপিও", "1000" },
            new[] { "Bangladesh", "বাংলাদেশ", "Dhaka", "ঢাকা", "Dhaka", "ঢাকা", "Dhaka Sadar", "ঢাকা সদর", "Dhaka Sadar HO", "ঢাকা সদর হেড অফিস", "1100" },
        };
        for (var r = 0; r < rows.Length; r++)
        {
            for (var c = 0; c < rows[r].Length; c++)
            {
                sheet.Cell(r + 2, c + 1).Value = rows[r][c];
            }
        }

        sheet.Row(1).Style.Font.Bold = true;
        sheet.SheetView.FreezeRows(1);
        using var stream = new MemoryStream();
        workbook.SaveAs(stream);
        return stream.ToArray();
    }

    public static (List<AddressImportRow> Rows, List<OrganogramRowError> Errors) Parse(Stream stream)
    {
        using var workbook = new XLWorkbook(stream);
        var sheet = workbook.Worksheets.FirstOrDefault(w =>
            w.Name.Equals("Address", StringComparison.OrdinalIgnoreCase)
            || w.Name.Equals("Addresses", StringComparison.OrdinalIgnoreCase))
            ?? workbook.Worksheets.Worksheet(1);

        var usedRange = sheet.RangeUsed();
        if (usedRange is null)
        {
            return ([], [new OrganogramRowError { Row = 0, Message = "empty sheet" }]);
        }

        var headerMap = MapHeaders(usedRange.FirstRow());
        var headerErrors = new[] { "CountryNameEn", "DivisionNameEn", "DistrictNameEn", "ThanaNameEn", "PostOfficeNameEn", "PostCode" }
            .Where(h => !headerMap.ContainsKey(h))
            .Select(h => new OrganogramRowError { Row = 1, Message = "missing column: " + h })
            .ToList();
        if (headerErrors.Count > 0)
        {
            return ([], headerErrors);
        }

        var rows = new List<AddressImportRow>();
        var errors = new List<OrganogramRowError>();

        foreach (var row in usedRange.RowsUsed().Skip(1))
        {
            var excelRow = row.RowNumber();
            if (RowEmpty(row, headerMap))
            {
                continue;
            }

            var item = new AddressImportRow
            {
                RowIndex = excelRow,
                CountryNameEn = GetCell(row, headerMap, "CountryNameEn"),
                CountryNameBn = GetCell(row, headerMap, "CountryNameBn"),
                DivisionNameEn = GetCell(row, headerMap, "DivisionNameEn"),
                DivisionNameBn = GetCell(row, headerMap, "DivisionNameBn"),
                DistrictNameEn = GetCell(row, headerMap, "DistrictNameEn"),
                DistrictNameBn = GetCell(row, headerMap, "DistrictNameBn"),
                ThanaNameEn = GetCell(row, headerMap, "ThanaNameEn"),
                ThanaNameBn = GetCell(row, headerMap, "ThanaNameBn"),
                PostOfficeNameEn = GetCell(row, headerMap, "PostOfficeNameEn"),
                PostOfficeNameBn = GetCell(row, headerMap, "PostOfficeNameBn"),
                PostCode = GetCell(row, headerMap, "PostCode"),
            };

            foreach (var (col, msg) in RequiredChecks(item))
            {
                errors.Add(new OrganogramRowError { Row = excelRow, Column = col, Message = msg });
            }

            if (errors.Any(e => e.Row == excelRow))
            {
                continue;
            }

            rows.Add(item);
        }

        return (rows, errors);
    }

    private static IEnumerable<(string Col, string Msg)> RequiredChecks(AddressImportRow item)
    {
        if (string.IsNullOrWhiteSpace(item.CountryNameEn))
        {
            yield return ("CountryNameEn", "required");
        }

        if (string.IsNullOrWhiteSpace(item.DivisionNameEn))
        {
            yield return ("DivisionNameEn", "required");
        }

        if (string.IsNullOrWhiteSpace(item.DistrictNameEn))
        {
            yield return ("DistrictNameEn", "required");
        }

        if (string.IsNullOrWhiteSpace(item.ThanaNameEn))
        {
            yield return ("ThanaNameEn", "required");
        }

        if (string.IsNullOrWhiteSpace(item.PostOfficeNameEn))
        {
            yield return ("PostOfficeNameEn", "required");
        }

        if (string.IsNullOrWhiteSpace(item.PostCode))
        {
            yield return ("PostCode", "required");
        }
    }

    private static Dictionary<string, int> MapHeaders(IXLRangeRow headerRow)
    {
        var map = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);
        var canonicalByKey = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
        foreach (var c in CanonicalHeaders)
        {
            canonicalByKey[NormalizeHeaderKey(c)] = c;
        }

        for (var i = 0; i < DisplayHeaders.Length; i++)
        {
            canonicalByKey[NormalizeHeaderKey(DisplayHeaders[i])] = CanonicalHeaders[i];
        }

        foreach (var (alias, canonical) in HeaderAliases)
        {
            canonicalByKey[NormalizeHeaderKey(alias)] = canonical;
        }

        foreach (var cell in headerRow.CellsUsed())
        {
            var key = NormalizeHeaderKey(cell.GetString());
            if (canonicalByKey.TryGetValue(key, out var canonical))
            {
                map[canonical] = cell.Address.ColumnNumber;
            }
        }

        return map;
    }

    private static string NormalizeHeaderKey(string value)
    {
        var chars = value.Where(char.IsLetterOrDigit).Select(char.ToLowerInvariant).ToArray();
        return new string(chars);
    }

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
}
