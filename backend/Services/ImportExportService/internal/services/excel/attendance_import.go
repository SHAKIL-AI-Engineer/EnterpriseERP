package excelsvc

import (
	"fmt"
	"strings"
	"time"

	"github.com/enterprise-erp/importexport/internal/dto"
	"github.com/xuri/excelize/v2"
)

type AttendanceImportRow struct {
	RowIndex        int
	EmployeeID      string
	AttendanceDate  time.Time
	ShiftCode       string
	InTime          string
	OutTime         string
	Status          string
	Remarks         string
	RawDate         string
}

var attendanceHeaders = []string{
	"EmployeeID", "AttendanceDate", "ShiftCode", "InTime", "OutTime", "Status", "Remarks",
}

func ParseAttendanceImport(path string) ([]AttendanceImportRow, []dto.RowError, error) {
	f, err := excelize.OpenFile(path)
	if err != nil {
		return nil, nil, err
	}
	defer f.Close()
	sheet := f.GetSheetName(0)
	if name := findSheet(f, "Attendance", "Data"); name != "" {
		sheet = name
	}
	rows, err := f.GetRows(sheet)
	if err != nil {
		return nil, nil, err
	}
	if len(rows) == 0 {
		return nil, []dto.RowError{{Row: 0, Message: "empty sheet"}}, nil
	}
	headerMap, herr := mapHeaders(rows[0], attendanceHeaders)
	if len(herr) > 0 {
		var re []dto.RowError
		for _, m := range herr {
			re = append(re, dto.RowError{Row: 1, Message: m})
		}
		return nil, re, nil
	}
	seen := map[string]struct{}{}
	var out []AttendanceImportRow
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
		ar := AttendanceImportRow{RowIndex: excelRow}
		if ar.EmployeeID = get("EmployeeID"); ar.EmployeeID == "" {
			errs = append(errs, dto.RowError{Row: excelRow, Column: "EmployeeID", Message: "required"})
		}
		raw := get("AttendanceDate")
		ar.RawDate = raw
		if raw == "" {
			errs = append(errs, dto.RowError{Row: excelRow, Column: "AttendanceDate", Message: "required"})
		} else {
			t, e := parseExcelDate(raw, f, sheet, excelRow, headerMap["AttendanceDate"]+1)
			if e != nil {
				errs = append(errs, dto.RowError{Row: excelRow, Column: "AttendanceDate", Message: e.Error()})
			} else {
				ar.AttendanceDate = t
			}
		}
		ar.ShiftCode = get("ShiftCode")
		ar.InTime = get("InTime")
		ar.OutTime = get("OutTime")
		ar.Status = get("Status")
		if ar.Status == "" {
			errs = append(errs, dto.RowError{Row: excelRow, Column: "Status", Message: "required"})
		}
		ar.Remarks = get("Remarks")
		// Business rule: do not infer present from empty punches — if status suggests present but no times, warn
		if strings.EqualFold(ar.Status, "Present") && ar.InTime == "" && ar.OutTime == "" {
			errs = append(errs, dto.RowError{Row: excelRow, Message: "present punches must not be auto-inferred: provide InTime/OutTime or adjust Status"})
		}
		key := fmt.Sprintf("%s|%s", ar.EmployeeID, ar.RawDate)
		if ar.EmployeeID != "" && raw != "" {
			if _, ok := seen[key]; ok {
				errs = append(errs, dto.RowError{Row: excelRow, Message: "duplicate employee+date"})
			} else {
				seen[key] = struct{}{}
			}
		}
		if hasRowErrorForRow(errs, excelRow) {
			continue
		}
		out = append(out, ar)
	}
	return out, errs, nil
}

func hasRowErrorForRow(errs []dto.RowError, row int) bool {
	return hasRowError(errs, row)
}

func ParseNumericSheet(path string, headers []string) ([]map[string]string, []dto.RowError, error) {
	f, err := excelize.OpenFile(path)
	if err != nil {
		return nil, nil, err
	}
	defer f.Close()
	sheet := f.GetSheetName(0)
	rows, err := f.GetRows(sheet)
	if err != nil {
		return nil, nil, err
	}
	if len(rows) == 0 {
		return nil, []dto.RowError{{Message: "empty"}}, nil
	}
	hm, miss := mapHeaders(rows[0], headers)
	if len(miss) > 0 {
		var e []dto.RowError
		for _, m := range miss {
			e = append(e, dto.RowError{Row: 1, Message: m})
		}
		return nil, e, nil
	}
	var out []map[string]string
	var errs []dto.RowError
	for i := 1; i < len(rows); i++ {
		if rowEmpty(rows[i]) {
			continue
		}
		m := map[string]string{}
		for _, h := range headers {
			idx := hm[h]
			if idx < len(rows[i]) {
				m[h] = strings.TrimSpace(rows[i][idx])
			}
		}
		if len(m) == 0 {
			continue
		}
		out = append(out, m)
	}
	return out, errs, nil
}
