package excelsvc

import (
	"fmt"
	"strconv"
	"strings"
	"time"

	"github.com/enterprise-erp/importexport/internal/dto"
	"github.com/xuri/excelize/v2"
)

const maxErrorsInPreview = 200

// EmployeeImportRow matches ERP template.
type EmployeeImportRow struct {
	RowIndex        int
	PunchNumber     int
	EmployeeID      string
	EmployeeName    string
	CompanyCode     string
	DepartmentName  string
	DesignationName string
	JoiningDate     time.Time
	GrossSalary     float64
	Phone           string
	Email           string
	Status          string
	RawJoiningDate  string
}

var employeeHeaders = []string{
	"PunchNumber", "EmployeeID", "EmployeeName", "CompanyCode", "DepartmentName", "DesignationName",
	"JoiningDate", "GrossSalary", "Phone", "Email", "Status",
}

func ParseEmployeeImport(path string) ([]EmployeeImportRow, []dto.RowError, error) {
	f, err := excelize.OpenFile(path)
	if err != nil {
		return nil, nil, err
	}
	defer f.Close()
	sheet := f.GetSheetName(0)
	if name := findSheet(f, "Template", "Employee", "Employees", "Data"); name != "" {
		sheet = name
	}
	rows, err := f.GetRows(sheet)
	if err != nil {
		return nil, nil, err
	}
	if len(rows) == 0 {
		return nil, []dto.RowError{{Row: 0, Message: "empty sheet"}}, nil
	}
	headerMap, herr := mapHeaders(rows[0], employeeHeaders)
	if len(herr) > 0 {
		var re []dto.RowError
		for _, m := range herr {
			re = append(re, dto.RowError{Row: 1, Message: m})
		}
		return nil, re, nil
	}
	seenEmployeeIDs := map[string]struct{}{}
	seenPunchNumbers := map[int]struct{}{}
	var out []EmployeeImportRow
	var errs []dto.RowError
	for i := 1; i < len(rows); i++ {
		r := rows[i]
		if rowEmpty(r) {
			continue
		}
		excelRow := i + 1
		get := func(name string) string {
			idx, ok := headerMap[name]
			if !ok || idx >= len(r) {
				return ""
			}
			return strings.TrimSpace(r[idx])
		}
		er := EmployeeImportRow{RowIndex: excelRow}
		missing := []string{}
		rawPunch := get("PunchNumber")
		if rawPunch == "" {
			missing = append(missing, "PunchNumber")
		} else {
			v, e := strconv.Atoi(strings.TrimSpace(rawPunch))
			if e != nil || v <= 0 {
				errs = append(errs, dto.RowError{Row: excelRow, Column: "PunchNumber", Message: "must be a positive integer"})
			} else {
				er.PunchNumber = v
			}
		}
		er.EmployeeID = get("EmployeeID")
		if er.EmployeeID == "" {
			missing = append(missing, "EmployeeID")
		}
		er.EmployeeName = get("EmployeeName")
		if er.EmployeeName == "" {
			missing = append(missing, "EmployeeName")
		}
		er.CompanyCode = get("CompanyCode")
		if er.CompanyCode == "" {
			missing = append(missing, "CompanyCode")
		}
		er.DepartmentName = get("DepartmentName")
		er.DesignationName = get("DesignationName")
		rawDate := get("JoiningDate")
		er.RawJoiningDate = rawDate
		if rawDate == "" {
			missing = append(missing, "JoiningDate")
		} else {
			t, perr := parseExcelDate(rawDate, f, sheet, excelRow, headerMap["JoiningDate"]+1)
			if perr != nil {
				errs = append(errs, dto.RowError{Row: excelRow, Column: "JoiningDate", Message: perr.Error()})
			} else {
				er.JoiningDate = t
			}
		}
		rawSal := get("GrossSalary")
		if rawSal == "" {
			missing = append(missing, "GrossSalary")
		} else {
			v, e := strconv.ParseFloat(strings.ReplaceAll(rawSal, ",", ""), 64)
			if e != nil {
				errs = append(errs, dto.RowError{Row: excelRow, Column: "GrossSalary", Message: "invalid number"})
			} else {
				er.GrossSalary = v
			}
		}
		er.Phone = get("Phone")
		er.Email = get("Email")
		er.Status = get("Status")
		if er.Status == "" {
			missing = append(missing, "Status")
		}
		for _, m := range missing {
			errs = append(errs, dto.RowError{Row: excelRow, Column: m, Message: "required"})
		}
		if strings.EqualFold(strings.TrimSpace(er.Status), "Inactive") {
			errs = append(errs, dto.RowError{Row: excelRow, Message: "inactive employee rows are not processed"})
		}
		key := strings.ToUpper(er.CompanyCode + "|" + er.EmployeeID)
		if er.EmployeeID != "" && er.CompanyCode != "" {
			if _, dup := seenEmployeeIDs[key]; dup {
				errs = append(errs, dto.RowError{Row: excelRow, Column: "EmployeeID", Message: "duplicate within file for company"})
			} else {
				seenEmployeeIDs[key] = struct{}{}
			}
		}
		if er.PunchNumber > 0 {
			if _, dup := seenPunchNumbers[er.PunchNumber]; dup {
				errs = append(errs, dto.RowError{Row: excelRow, Column: "PunchNumber", Message: "duplicate within file"})
			} else {
				seenPunchNumbers[er.PunchNumber] = struct{}{}
			}
		}
		if hasRowError(errs, excelRow) {
			continue
		}
		out = append(out, er)
	}
	return out, errs, nil
}

func hasRowError(errs []dto.RowError, row int) bool {
	for _, e := range errs {
		if e.Row == row {
			return true
		}
	}
	return false
}

func mapHeaders(headerRow []string, required []string) (map[string]int, []string) {
	m := map[string]int{}
	for i, h := range headerRow {
		key := strings.TrimSpace(h)
		key = strings.ReplaceAll(key, " ", "")
		for _, req := range required {
			if strings.EqualFold(key, req) || strings.EqualFold(key, strings.ReplaceAll(req, " ", "")) {
				m[req] = i
			}
		}
	}
	var missing []string
	for _, req := range required {
		if _, ok := m[req]; !ok {
			missing = append(missing, "missing column: "+req)
		}
	}
	return m, missing
}

func rowEmpty(r []string) bool {
	for _, c := range r {
		if strings.TrimSpace(c) != "" {
			return false
		}
	}
	return true
}

func findSheet(f *excelize.File, names ...string) string {
	for _, s := range f.GetSheetList() {
		for _, n := range names {
			if strings.EqualFold(s, n) {
				return s
			}
		}
	}
	return ""
}

func parseExcelDate(raw string, f *excelize.File, sheet string, row, col int) (time.Time, error) {
	raw = strings.TrimSpace(raw)
	if raw == "" {
		return time.Time{}, fmt.Errorf("empty date")
	}
	if t, err := time.Parse("2006-01-02", raw); err == nil {
		return t, nil
	}
	if t, err := time.Parse("02/01/2006", raw); err == nil {
		return t, nil
	}
	if t, err := time.Parse("01/02/2006", raw); err == nil {
		return t, nil
	}
	if v, err := strconv.ParseFloat(raw, 64); err == nil && v > 0 && v < 1000000 {
		if t, err := excelize.ExcelDateToTime(v, false); err == nil {
			return t, nil
		}
	}
	if col > 0 {
		cell, _ := excelize.CoordinatesToCellName(col, row)
		if v, err := f.GetCellValue(sheet, cell); err == nil && v != raw {
			return parseExcelDate(v, f, sheet, row, col)
		}
	}
	return time.Time{}, fmt.Errorf("cannot parse date: %s", raw)
}

// BuildEmployeeErrorWorkbook creates an xlsx listing row errors.
func BuildEmployeeErrorWorkbook(errors []dto.RowError) (*excelize.File, error) {
	f := excelize.NewFile()
	sheet := "Errors"
	f.SetSheetName("Sheet1", sheet)
	_ = f.SetCellValue(sheet, "A1", "Row")
	_ = f.SetCellValue(sheet, "B1", "Column")
	_ = f.SetCellValue(sheet, "C1", "Message")
	for i, e := range errors {
		r := i + 2
		_ = f.SetCellValue(sheet, fmt.Sprintf("A%d", r), e.Row)
		_ = f.SetCellValue(sheet, fmt.Sprintf("B%d", r), e.Column)
		_ = f.SetCellValue(sheet, fmt.Sprintf("C%d", r), e.Message)
	}
	return f, nil
}
