using System.Globalization;
using ClosedXML.Excel;
using HRService.Application.Employees;

namespace HRService.Infrastructure.Services;

internal static class EmployeeExcelImportParser
{
    private static readonly string[] RequiredHeaders =
    [
        "PunchNumber", "EmployeeID", "FullName", "DepartmentName", "DesignationName", "JoinDate", "Status",
    ];

    private static readonly string[] CanonicalHeaders =
    [
        "PunchNumber", "EmployeeID", "FullName", "BanglaName", "Gender", "Religion", "BloodGroup",
        "DateOfBirth", "NationalId", "BirthCertificateNo", "Phone", "Email", "JoinDate", "EmploymentType", "Status", "IsOtEnabled",
        "DepartmentName", "SectionName", "DesignationName", "GradeName", "GroupName", "LineName", "SupervisorEmployeeID",
        "BasicSalary", "HouseRent", "MedicalAllowance", "ConveyanceAllowance", "FoodAllowance",
        "FatherNameEn", "FatherNameBn", "MotherNameEn", "MotherNameBn", "MaritalStatus",
        "SpouseNameEn", "SpouseNameBn", "SpouseOccupation", "SpouseContact",
        "EducationLevel", "Institution", "FieldOfStudy", "Skills",
        "Reference1Name", "Reference1Relation", "Reference1Phone", "Reference1Address",
        "Reference2Name", "Reference2Relation", "Reference2Phone", "Reference2Address",
        "PresentDivision", "PresentDistrict", "PresentUpazila", "PresentPostOffice", "PresentPostalCode", "PresentAddress",
        "PermanentDivision", "PermanentDistrict", "PermanentUpazila", "PermanentPostOffice", "PermanentPostalCode", "PermanentAddress",
        "BankName", "BranchName", "AccountNo", "RoutingNo", "BankAccountType", "MobileBankingNo",
        "EmergencyContactName", "EmergencyContactRelation", "EmergencyContactPhone", "EmergencyContactAddress",
        "ProfileImageUrl", "SignatureImageUrl",
    ];

    public static (List<EmployeeImportRowDto> ValidRows, List<EmployeeExcelImportRowError> Errors, int TotalRows) Parse(Stream stream)
    {
        using var workbook = new XLWorkbook(stream);
        var sheet = workbook.Worksheets.FirstOrDefault(w =>
            w.Name.Equals("Template", StringComparison.OrdinalIgnoreCase)
            || w.Name.Equals("Employee", StringComparison.OrdinalIgnoreCase)
            || w.Name.Equals("Employees", StringComparison.OrdinalIgnoreCase)
            || w.Name.Equals("Data", StringComparison.OrdinalIgnoreCase))
            ?? workbook.Worksheets.Worksheet(1);

        var usedRange = sheet.RangeUsed();
        if (usedRange is null)
        {
            return ([], [new EmployeeExcelImportRowError(0, "", "empty sheet")], 0);
        }

        var headerMap = MapHeaders(usedRange.FirstRow());
        var headerErrors = RequiredHeaders
            .Where(h => !headerMap.ContainsKey(h))
            .Select(h => new EmployeeExcelImportRowError(1, h, "missing column"))
            .ToList();
        if (headerErrors.Count > 0)
        {
            return ([], headerErrors, 0);
        }

        var valid = new List<EmployeeImportRowDto>();
        var errors = new List<EmployeeExcelImportRowError>();
        var seenEmployeeIds = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        var totalRows = 0;

        foreach (var row in usedRange.RowsUsed().Skip(1))
        {
            if (RowEmpty(row, headerMap))
            {
                continue;
            }

            totalRows++;
            var excelRow = row.RowNumber();
            string Get(string name)
            {
                if (!headerMap.TryGetValue(name, out var col))
                {
                    return "";
                }

                return row.Cell(col).GetFormattedString().Trim();
            }

            IXLCell Cell(string name) =>
                headerMap.TryGetValue(name, out var col) ? row.Cell(col) : row.Cell(1);

            var rowErrors = new List<EmployeeExcelImportRowError>();

            if (!int.TryParse(Get("PunchNumber"), NumberStyles.Integer, CultureInfo.InvariantCulture, out var punch) || punch <= 0)
            {
                rowErrors.Add(new EmployeeExcelImportRowError(excelRow, "PunchNumber", "must be a positive integer"));
            }

            var employeeId = Get("EmployeeID");
            if (employeeId.Length == 0)
            {
                rowErrors.Add(new EmployeeExcelImportRowError(excelRow, "EmployeeID", "required"));
            }

            var fullName = Get("FullName");
            if (fullName.Length == 0)
            {
                rowErrors.Add(new EmployeeExcelImportRowError(excelRow, "FullName", "required"));
            }

            var department = Get("DepartmentName");
            if (department.Length == 0)
            {
                rowErrors.Add(new EmployeeExcelImportRowError(excelRow, "DepartmentName", "required"));
            }

            var designation = Get("DesignationName");
            if (designation.Length == 0)
            {
                rowErrors.Add(new EmployeeExcelImportRowError(excelRow, "DesignationName", "required"));
            }

            var joinDate = ParseDate(Cell("JoinDate"), Get("JoinDate"));
            if (joinDate is null)
            {
                rowErrors.Add(new EmployeeExcelImportRowError(excelRow, "JoinDate", "required or invalid date"));
            }

            var status = Get("Status");
            if (status.Length == 0)
            {
                rowErrors.Add(new EmployeeExcelImportRowError(excelRow, "Status", "required"));
            }
            else if (status.Equals("Inactive", StringComparison.OrdinalIgnoreCase))
            {
                rowErrors.Add(new EmployeeExcelImportRowError(excelRow, "Status", "inactive employee rows are not processed"));
            }

            if (employeeId.Length > 0 && !seenEmployeeIds.Add(employeeId))
            {
                rowErrors.Add(new EmployeeExcelImportRowError(excelRow, "EmployeeID", "duplicate within file"));
            }

            if (rowErrors.Count > 0)
            {
                errors.AddRange(rowErrors);
                continue;
            }

            var employmentType = Get("EmploymentType");
            if (employmentType.Length == 0)
            {
                employmentType = "Permanent";
            }

            valid.Add(new EmployeeImportRowDto
            {
                RowIndex = excelRow,
                PunchNumber = punch,
                EmployeeID = employeeId,
                FullName = fullName,
                BanglaName = NullIfEmpty(Get("BanglaName")),
                Gender = NullIfEmpty(Get("Gender")),
                Religion = NullIfEmpty(Get("Religion")),
                BloodGroup = NullIfEmpty(Get("BloodGroup")),
                DateOfBirth = ParseDate(Cell("DateOfBirth"), Get("DateOfBirth")),
                NationalId = NullIfEmpty(Get("NationalId")),
                BirthCertificateNo = NullIfEmpty(Get("BirthCertificateNo")),
                Phone = NullIfEmpty(Get("Phone")),
                Email = NullIfEmpty(Get("Email")),
                JoinDate = joinDate!.Value,
                EmploymentType = employmentType,
                Status = status,
                IsOtEnabled = ParseBool(Get("IsOtEnabled"), defaultValue: true),
                DepartmentName = department,
                SectionName = NullIfEmpty(Get("SectionName")),
                DesignationName = designation,
                GradeName = NullIfEmpty(Get("GradeName")),
                GroupName = NullIfEmpty(Get("GroupName")),
                LineName = NullIfEmpty(Get("LineName")),
                SupervisorEmployeeID = NullIfEmpty(Get("SupervisorEmployeeID")),
                BasicSalary = ParseDecimal(Get("BasicSalary")),
                HouseRent = ParseDecimal(Get("HouseRent")),
                MedicalAllowance = ParseDecimal(Get("MedicalAllowance")),
                ConveyanceAllowance = ParseDecimal(Get("ConveyanceAllowance")),
                FoodAllowance = ParseDecimal(Get("FoodAllowance")),
                FatherNameEn = NullIfEmpty(Get("FatherNameEn")),
                FatherNameBn = NullIfEmpty(Get("FatherNameBn")),
                MotherNameEn = NullIfEmpty(Get("MotherNameEn")),
                MotherNameBn = NullIfEmpty(Get("MotherNameBn")),
                MaritalStatus = NullIfEmpty(Get("MaritalStatus")),
                SpouseNameEn = NullIfEmpty(Get("SpouseNameEn")),
                SpouseNameBn = NullIfEmpty(Get("SpouseNameBn")),
                SpouseOccupation = NullIfEmpty(Get("SpouseOccupation")),
                SpouseContact = NullIfEmpty(Get("SpouseContact")),
                EducationLevel = NullIfEmpty(Get("EducationLevel")),
                Institution = NullIfEmpty(Get("Institution")),
                FieldOfStudy = NullIfEmpty(Get("FieldOfStudy")),
                Skills = NullIfEmpty(Get("Skills")),
                Reference1Name = NullIfEmpty(Get("Reference1Name")),
                Reference1Relation = NullIfEmpty(Get("Reference1Relation")),
                Reference1Phone = NullIfEmpty(Get("Reference1Phone")),
                Reference1Address = NullIfEmpty(Get("Reference1Address")),
                Reference2Name = NullIfEmpty(Get("Reference2Name")),
                Reference2Relation = NullIfEmpty(Get("Reference2Relation")),
                Reference2Phone = NullIfEmpty(Get("Reference2Phone")),
                Reference2Address = NullIfEmpty(Get("Reference2Address")),
                PresentDivision = NullIfEmpty(Get("PresentDivision")),
                PresentDistrict = NullIfEmpty(Get("PresentDistrict")),
                PresentUpazila = NullIfEmpty(Get("PresentUpazila")),
                PresentPostOffice = NullIfEmpty(Get("PresentPostOffice")),
                PresentPostalCode = NullIfEmpty(Get("PresentPostalCode")),
                PresentAddress = NullIfEmpty(Get("PresentAddress")),
                PermanentDivision = NullIfEmpty(Get("PermanentDivision")),
                PermanentDistrict = NullIfEmpty(Get("PermanentDistrict")),
                PermanentUpazila = NullIfEmpty(Get("PermanentUpazila")),
                PermanentPostOffice = NullIfEmpty(Get("PermanentPostOffice")),
                PermanentPostalCode = NullIfEmpty(Get("PermanentPostalCode")),
                PermanentAddress = NullIfEmpty(Get("PermanentAddress")),
                BankName = NullIfEmpty(Get("BankName")),
                BranchName = NullIfEmpty(Get("BranchName")),
                AccountNo = NullIfEmpty(Get("AccountNo")),
                RoutingNo = NullIfEmpty(Get("RoutingNo")),
                BankAccountType = NullIfEmpty(Get("BankAccountType")),
                MobileBankingNo = NullIfEmpty(Get("MobileBankingNo")),
                EmergencyContactName = NullIfEmpty(Get("EmergencyContactName")),
                EmergencyContactRelation = NullIfEmpty(Get("EmergencyContactRelation")),
                EmergencyContactPhone = NullIfEmpty(Get("EmergencyContactPhone")),
                EmergencyContactAddress = NullIfEmpty(Get("EmergencyContactAddress")),
                ProfileImageUrl = NullIfEmpty(Get("ProfileImageUrl")),
                SignatureImageUrl = NullIfEmpty(Get("SignatureImageUrl")),
            });
        }

        return (valid, errors, totalRows);
    }

    private static Dictionary<string, int> MapHeaders(IXLRangeRow headerRow)
    {
        var map = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);
        foreach (var cell in headerRow.CellsUsed())
        {
            var name = cell.GetString().Trim();
            if (name.Length == 0)
            {
                continue;
            }

            if (!map.ContainsKey(name) && CanonicalHeaders.Contains(name, StringComparer.OrdinalIgnoreCase))
            {
                map[name] = cell.Address.ColumnNumber;
            }
        }

        return map;
    }

    private static bool RowEmpty(IXLRangeRow row, IReadOnlyDictionary<string, int> headerMap)
    {
        foreach (var col in headerMap.Values)
        {
            if (row.Cell(col).GetFormattedString().Trim().Length > 0)
            {
                return false;
            }
        }

        return true;
    }

    private static string? NullIfEmpty(string value) => string.IsNullOrWhiteSpace(value) ? null : value.Trim();

    private static decimal ParseDecimal(string raw)
    {
        raw = raw.Trim().Replace(",", "");
        return decimal.TryParse(raw, NumberStyles.Number, CultureInfo.InvariantCulture, out var v) ? v : 0;
    }

    private static bool ParseBool(string raw, bool defaultValue)
    {
        if (string.IsNullOrWhiteSpace(raw))
        {
            return defaultValue;
        }

        return raw.Trim() switch
        {
            "1" or "true" or "True" or "YES" or "Yes" or "Y" => true,
            "0" or "false" or "False" or "NO" or "No" or "N" => false,
            _ => defaultValue,
        };
    }

    private static DateTime? ParseDate(IXLCell cell, string raw)
    {
        if (cell.TryGetValue(out DateTime dt) && dt != default)
        {
            return dt.Date;
        }

        if (double.TryParse(raw, NumberStyles.Float, CultureInfo.InvariantCulture, out var oa) && oa > 0)
        {
            try
            {
                return DateTime.FromOADate(oa).Date;
            }
            catch
            {
                // ignore
            }
        }

        if (DateTime.TryParse(raw, CultureInfo.InvariantCulture, DateTimeStyles.None, out var parsed))
        {
            return parsed.Date;
        }

        if (DateTime.TryParse(raw, CultureInfo.CurrentCulture, DateTimeStyles.None, out parsed))
        {
            return parsed.Date;
        }

        return string.IsNullOrWhiteSpace(raw) ? null : null;
    }
}
