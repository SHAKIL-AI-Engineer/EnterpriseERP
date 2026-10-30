package excelsvc

import (
	"fmt"
	"strings"

	"github.com/enterprise-erp/importexport/internal/dto"
	"github.com/xuri/excelize/v2"
)

type CompanyOrganogramRow struct {
	RowIndex          int    `json:"rowIndex"`
	CompanyNameEn     string `json:"companyNameEn"`
	CompanyNameBn     string `json:"companyNameBn,omitempty"`
	DepartmentNameEn  string `json:"departmentNameEn"`
	DepartmentNameBn  string `json:"departmentNameBn"`
	SectionNameEn     string `json:"sectionNameEn"`
	SectionNameBn     string `json:"sectionNameBn"`
	DesignationNameEn string `json:"designationNameEn,omitempty"`
	DesignationNameBn string `json:"designationNameBn,omitempty"`
	LineNameEn        string `json:"lineNameEn,omitempty"`
	LineNameBn        string `json:"lineNameBn,omitempty"`
	IsActive          bool   `json:"isActive"`
}

var companyOrganogramHeaders = []string{
	"CompanyNameEn", "CompanyNameBn",
	"DepartmentNameEn", "DepartmentNameBn",
	"SectionNameEn", "SectionNameBn",
	"DesignationNameEn", "DesignationNameBn",
	"LineNameEn", "LineNameBn", "IsActive",
}

var companyOrganogramHeaderAliases = map[string]string{
	"CompanyName":     "CompanyNameEn",
	"DepartmentName":  "DepartmentNameEn",
	"SectionName":     "SectionNameEn",
	"DesignationName": "DesignationNameEn",
	"LineName":        "LineNameEn",
}

func mapOrganogramHeaders(headerRow []string) (map[string]int, []string) {
	m := map[string]int{}
	for i, h := range headerRow {
		key := strings.TrimSpace(h)
		key = strings.ReplaceAll(key, " ", "")
		for _, canonical := range companyOrganogramHeaders {
			if strings.EqualFold(key, canonical) || strings.EqualFold(key, strings.ReplaceAll(canonical, " ", "")) {
				m[canonical] = i
			}
		}
		for alias, canonical := range companyOrganogramHeaderAliases {
			if strings.EqualFold(key, alias) || strings.EqualFold(key, strings.ReplaceAll(alias, " ", "")) {
				m[canonical] = i
			}
		}
	}
	var missing []string
	for _, req := range []string{"CompanyNameEn", "DepartmentNameEn", "SectionNameEn"} {
		if _, ok := m[req]; !ok {
			missing = append(missing, "missing column: "+req)
		}
	}
	return m, missing
}

func ParseCompanyOrganogramImport(path string) ([]CompanyOrganogramRow, []dto.RowError, error) {
	f, err := excelize.OpenFile(path)
	if err != nil {
		return nil, nil, err
	}
	defer f.Close()

	sheet := f.GetSheetName(0)
	if name := findSheet(f, "CompanyOrganogram", "Organogram", "Data"); name != "" {
		sheet = name
	}
	rows, err := f.GetRows(sheet)
	if err != nil {
		return nil, nil, err
	}
	if len(rows) == 0 {
		return nil, []dto.RowError{{Row: 0, Message: "empty sheet"}}, nil
	}

	headerMap, headerErrs := mapOrganogramHeaders(rows[0])
	if len(headerErrs) > 0 {
		errs := make([]dto.RowError, 0, len(headerErrs))
		for _, msg := range headerErrs {
			errs = append(errs, dto.RowError{Row: 1, Message: msg})
		}
		return nil, errs, nil
	}

	var out []CompanyOrganogramRow
	var errs []dto.RowError
	seen := map[string]struct{}{}
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

		item := CompanyOrganogramRow{
			RowIndex:          excelRow,
			CompanyNameEn:     get("CompanyNameEn"),
			CompanyNameBn:     get("CompanyNameBn"),
			DepartmentNameEn:  get("DepartmentNameEn"),
			DepartmentNameBn:  get("DepartmentNameBn"),
			SectionNameEn:     get("SectionNameEn"),
			SectionNameBn:     get("SectionNameBn"),
			DesignationNameEn: get("DesignationNameEn"),
			DesignationNameBn: get("DesignationNameBn"),
			LineNameEn:        get("LineNameEn"),
			LineNameBn:        get("LineNameBn"),
			IsActive:          parseActive(get("IsActive")),
		}

		if item.CompanyNameEn == "" {
			errs = append(errs, dto.RowError{Row: excelRow, Column: "CompanyNameEn", Message: "required"})
		}
		if item.DepartmentNameEn == "" {
			errs = append(errs, dto.RowError{Row: excelRow, Column: "DepartmentNameEn", Message: "required"})
		}
		if item.SectionNameEn == "" {
			errs = append(errs, dto.RowError{Row: excelRow, Column: "SectionNameEn", Message: "required"})
		}
		if item.DepartmentNameBn == "" {
			item.DepartmentNameBn = item.DepartmentNameEn
		}
		if item.SectionNameBn == "" {
			item.SectionNameBn = item.SectionNameEn
		}
		if item.DesignationNameBn == "" {
			item.DesignationNameBn = item.DesignationNameEn
		}
		if item.LineNameBn == "" {
			item.LineNameBn = item.LineNameEn
		}

		key := strings.ToUpper(strings.Join([]string{
			item.CompanyNameEn,
			item.DepartmentNameEn,
			item.SectionNameEn,
			item.DesignationNameEn,
			item.LineNameEn,
		}, "|"))
		if _, ok := seen[key]; ok {
			errs = append(errs, dto.RowError{Row: excelRow, Message: "duplicate organogram row in file"})
		}
		seen[key] = struct{}{}

		if hasRowError(errs, excelRow) {
			continue
		}
		out = append(out, item)
	}
	return out, errs, nil
}

func BuildCompanyOrganogramDemoWorkbook() (*excelize.File, error) {
	return BuildCompanyOrganogramWorkbook([]CompanyOrganogramRow{
		{CompanyNameEn: "Default Company", CompanyNameBn: "Default Company", DepartmentNameEn: "Human Resources", DepartmentNameBn: "Human Resources", SectionNameEn: "HR Admin", SectionNameBn: "HR Admin", DesignationNameEn: "HR Manager", DesignationNameBn: "HR Manager", LineNameEn: "HR Line 01", LineNameBn: "HR Line 01", IsActive: true},
		{CompanyNameEn: "Default Company", CompanyNameBn: "Default Company", DepartmentNameEn: "Production", DepartmentNameBn: "Production", SectionNameEn: "Sewing", SectionNameBn: "Sewing", DesignationNameEn: "Operator", DesignationNameBn: "Operator", LineNameEn: "Sewing Line 01", LineNameBn: "Sewing Line 01", IsActive: true},
		{CompanyNameEn: "Second Company", CompanyNameBn: "Second Company", DepartmentNameEn: "Production", DepartmentNameBn: "Production", SectionNameEn: "Finishing", SectionNameBn: "Finishing", DesignationNameEn: "Quality Controller", DesignationNameBn: "Quality Controller", LineNameEn: "Finishing Line 01", LineNameBn: "Finishing Line 01", IsActive: true},
	})
}

func BuildCompanyOrganogramWorkbook(rows []CompanyOrganogramRow) (*excelize.File, error) {
	f := excelize.NewFile()
	sheet := "CompanyOrganogram"
	f.SetSheetName("Sheet1", sheet)

	for i, h := range companyOrganogramHeaders {
		cell, _ := excelize.CoordinatesToCellName(i+1, 1)
		_ = f.SetCellValue(sheet, cell, h)
	}

	for ri, row := range rows {
		values := []any{
			row.CompanyNameEn, row.CompanyNameBn,
			row.DepartmentNameEn, row.DepartmentNameBn,
			row.SectionNameEn, row.SectionNameBn,
			row.DesignationNameEn, row.DesignationNameBn,
			row.LineNameEn, row.LineNameBn, activeLabel(row.IsActive),
		}
		for ci, value := range values {
			cell, _ := excelize.CoordinatesToCellName(ci+1, ri+2)
			_ = f.SetCellValue(sheet, cell, value)
		}
	}

	headerStyle, _ := f.NewStyle(&excelize.Style{Font: &excelize.Font{Bold: true}})
	lastCol, _ := excelize.ColumnNumberToName(len(companyOrganogramHeaders))
	_ = f.SetCellStyle(sheet, "A1", lastCol+"1", headerStyle)
	_ = freezeTopRow(f, sheet)
	for i := range companyOrganogramHeaders {
		col, _ := excelize.ColumnNumberToName(i + 1)
		_ = f.SetColWidth(sheet, col, col, 20)
	}

	instructions := "Instructions"
	_, _ = f.NewSheet(instructions)
	_ = f.SetCellValue(instructions, "A1", "Company Organogram Import Format")
	_ = f.SetCellValue(instructions, "A3", "Required columns: CompanyNameEn, DepartmentNameEn, and SectionNameEn.")
	_ = f.SetCellValue(instructions, "A4", "Rows are matched and linked by English names within each parent (company -> department -> section).")
	_ = f.SetCellValue(instructions, "A5", "Missing companies are created automatically using CompanyNameEn (must be unique).")
	_ = f.SetCellValue(instructions, "A6", "Bangla name columns are optional; when blank, English names are copied.")
	_ = f.SetCellValue(instructions, "A7", "Designation and Line columns are optional.")
	_ = f.SetCellValue(instructions, "A8", "IsActive accepts Active, Inactive, true, false, yes, no, 1, or 0.")
	_ = f.SetColWidth(instructions, "A", "A", 120)

	// Set active sheet at the end
	idx, _ := f.GetSheetIndex(sheet)
	f.SetActiveSheet(idx)

	return f, nil
}

func parseActive(raw string) bool {
	raw = strings.ToLower(strings.TrimSpace(raw))
	if raw == "" {
		return true
	}
	switch raw {
	case "active", "true", "yes", "y", "1":
		return true
	case "inactive", "false", "no", "n", "0":
		return false
	default:
		return true
	}
}

func activeLabel(active bool) string {
	if active {
		return "Active"
	}
	return "Inactive"
}

func BuildCompanyOrganogramErrorWorkbook(errors []dto.RowError) (*excelize.File, error) {
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
	idx, _ := f.GetSheetIndex(sheet)
	f.SetActiveSheet(idx)
	return f, nil
}
