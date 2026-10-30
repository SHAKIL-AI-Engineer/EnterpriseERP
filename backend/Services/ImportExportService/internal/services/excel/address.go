package excelsvc

import (
	"fmt"
	"strings"
	"unicode"

	"github.com/enterprise-erp/importexport/internal/dto"
	"github.com/xuri/excelize/v2"
)

type AddressRow struct {
	RowIndex         int    `json:"rowIndex"`
	CountryNameEn    string `json:"countryNameEn"`
	CountryNameBn    string `json:"countryNameBn"`
	DivisionNameEn   string `json:"divisionNameEn"`
	DivisionNameBn   string `json:"divisionNameBn"`
	DistrictNameEn   string `json:"districtNameEn"`
	DistrictNameBn   string `json:"districtNameBn"`
	ThanaNameEn      string `json:"thanaNameEn"`
	ThanaNameBn      string `json:"thanaNameBn"`
	PostOfficeNameEn string `json:"postOfficeNameEn"`
	PostOfficeNameBn string `json:"postOfficeNameBn"`
	PostCode         string `json:"postCode"`
	IsActive         bool   `json:"isActive"`
}

var addressHeaders = []string{
	"Country Name (EN)", "Country Name (BN)",
	"Division Name (EN)", "Division Name (BN)",
	"District Name (EN)", "District Name (BN)",
	"Thana Name (EN)", "Thana Name (BN)",
	"Post Office Name (EN)", "Post Office Name (BN)",
	"Post Code",
}

var addressCanonicalHeaders = []string{
	"CountryNameEn", "CountryNameBn",
	"DivisionNameEn", "DivisionNameBn",
	"DistrictNameEn", "DistrictNameBn",
	"ThanaNameEn", "ThanaNameBn",
	"PostOfficeNameEn", "PostOfficeNameBn",
	"PostCode",
}

var addressHeaderAliases = map[string]string{
	"CountryName":       "CountryNameEn",
	"DivisionName":      "DivisionNameEn",
	"DistrictName":      "DistrictNameEn",
	"ThanaName":         "ThanaNameEn",
	"UpazilaName":       "ThanaNameEn",
	"UpazilaNameEn":     "ThanaNameEn",
	"UpazilaNameBn":     "ThanaNameBn",
	"PostOfficeName":    "PostOfficeNameEn",
	"PostCode":          "PostCode",
	"PostalCode":        "PostCode",
	"PostalCodeEn":      "PostCode",
	"PostOfficeCode":    "PostCode",
	"PostOfficeNameEng": "PostOfficeNameEn",
}

func mapAddressHeaders(headerRow []string) (map[string]int, []string) {
	m := map[string]int{}
	canonicalByKey := map[string]string{}
	for _, canonical := range addressCanonicalHeaders {
		canonicalByKey[normalizeExcelHeader(canonical)] = canonical
	}
	for i, display := range addressHeaders {
		canonicalByKey[normalizeExcelHeader(display)] = addressCanonicalHeaders[i]
	}
	for alias, canonical := range addressHeaderAliases {
		canonicalByKey[normalizeExcelHeader(alias)] = canonical
	}

	for i, h := range headerRow {
		if canonical, ok := canonicalByKey[normalizeExcelHeader(h)]; ok {
			m[canonical] = i
		}
	}

	var missing []string
	for _, req := range []string{"CountryNameEn", "DivisionNameEn", "DistrictNameEn", "ThanaNameEn", "PostOfficeNameEn", "PostCode"} {
		if _, ok := m[req]; !ok {
			missing = append(missing, "missing column: "+req)
		}
	}
	return m, missing
}

func ParseAddressImport(path string) ([]AddressRow, []dto.RowError, error) {
	f, err := excelize.OpenFile(path)
	if err != nil {
		return nil, nil, err
	}
	defer f.Close()

	sheet := f.GetSheetName(0)
	if name := findSheet(f, "Address", "Addresses", "Data"); name != "" {
		sheet = name
	}
	rows, err := f.GetRows(sheet)
	if err != nil {
		return nil, nil, err
	}
	if len(rows) == 0 {
		return nil, []dto.RowError{{Row: 0, Message: "empty sheet"}}, nil
	}

	headerMap, headerErrs := mapAddressHeaders(rows[0])
	if len(headerErrs) > 0 {
		errs := make([]dto.RowError, 0, len(headerErrs))
		for _, msg := range headerErrs {
			errs = append(errs, dto.RowError{Row: 1, Message: msg})
		}
		return nil, errs, nil
	}

	var out []AddressRow
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

		item := AddressRow{
			RowIndex:         excelRow,
			CountryNameEn:    get("CountryNameEn"),
			CountryNameBn:    get("CountryNameBn"),
			DivisionNameEn:   get("DivisionNameEn"),
			DivisionNameBn:   get("DivisionNameBn"),
			DistrictNameEn:   get("DistrictNameEn"),
			DistrictNameBn:   get("DistrictNameBn"),
			ThanaNameEn:      get("ThanaNameEn"),
			ThanaNameBn:      get("ThanaNameBn"),
			PostOfficeNameEn: get("PostOfficeNameEn"),
			PostOfficeNameBn: get("PostOfficeNameBn"),
			PostCode:         get("PostCode"),
			IsActive:         true,
		}

		required := map[string]string{
			"CountryNameEn":    item.CountryNameEn,
			"DivisionNameEn":   item.DivisionNameEn,
			"DistrictNameEn":   item.DistrictNameEn,
			"ThanaNameEn":      item.ThanaNameEn,
			"PostOfficeNameEn": item.PostOfficeNameEn,
			"PostCode":         item.PostCode,
		}
		for column, value := range required {
			if value == "" {
				errs = append(errs, dto.RowError{Row: excelRow, Column: column, Message: "required"})
			}
		}

		if item.CountryNameBn == "" {
			item.CountryNameBn = item.CountryNameEn
		}
		if item.DivisionNameBn == "" {
			item.DivisionNameBn = item.DivisionNameEn
		}
		if item.DistrictNameBn == "" {
			item.DistrictNameBn = item.DistrictNameEn
		}
		if item.ThanaNameBn == "" {
			item.ThanaNameBn = item.ThanaNameEn
		}
		if item.PostOfficeNameBn == "" {
			item.PostOfficeNameBn = item.PostOfficeNameEn
		}

		key := strings.ToUpper(strings.Join([]string{
			item.CountryNameEn,
			item.DivisionNameEn,
			item.DistrictNameEn,
			item.ThanaNameEn,
			item.PostOfficeNameEn,
			item.PostCode,
		}, "|"))
		if _, ok := seen[key]; ok {
			errs = append(errs, dto.RowError{Row: excelRow, Message: "duplicate address row in file"})
		}
		seen[key] = struct{}{}

		if hasRowError(errs, excelRow) {
			continue
		}
		out = append(out, item)
	}
	return out, errs, nil
}

func BuildAddressDemoWorkbook() (*excelize.File, error) {
	return BuildAddressWorkbook([]AddressRow{
		{CountryNameEn: "Bangladesh", CountryNameBn: "বাংলাদেশ", DivisionNameEn: "Dhaka", DivisionNameBn: "ঢাকা", DistrictNameEn: "Dhaka", DistrictNameBn: "ঢাকা", ThanaNameEn: "Motijheel", ThanaNameBn: "মতিঝিল", PostOfficeNameEn: "Dhaka GPO", PostOfficeNameBn: "ঢাকা জিপিও", PostCode: "1000", IsActive: true},
		{CountryNameEn: "Bangladesh", CountryNameBn: "বাংলাদেশ", DivisionNameEn: "Dhaka", DivisionNameBn: "ঢাকা", DistrictNameEn: "Dhaka", DistrictNameBn: "ঢাকা", ThanaNameEn: "Dhaka Sadar", ThanaNameBn: "ঢাকা সদর", PostOfficeNameEn: "Dhaka Sadar HO", PostOfficeNameBn: "ঢাকা সদর হেড অফিস", PostCode: "1100", IsActive: true},
	})
}

func BuildAddressWorkbook(rows []AddressRow) (*excelize.File, error) {
	f := excelize.NewFile()
	sheet := "Address"
	f.SetSheetName("Sheet1", sheet)

	for i, h := range addressHeaders {
		cell, _ := excelize.CoordinatesToCellName(i+1, 1)
		_ = f.SetCellValue(sheet, cell, h)
	}

	for ri, row := range rows {
		values := []any{
			row.CountryNameEn, row.CountryNameBn,
			row.DivisionNameEn, row.DivisionNameBn,
			row.DistrictNameEn, row.DistrictNameBn,
			row.ThanaNameEn, row.ThanaNameBn,
			row.PostOfficeNameEn, row.PostOfficeNameBn,
			row.PostCode,
		}
		for ci, value := range values {
			cell, _ := excelize.CoordinatesToCellName(ci+1, ri+2)
			_ = f.SetCellValue(sheet, cell, value)
		}
	}

	headerStyle, _ := f.NewStyle(&excelize.Style{
		Font:      &excelize.Font{Bold: true},
		Alignment: &excelize.Alignment{Horizontal: "center"},
		Fill:      excelize.Fill{Type: "pattern", Color: []string{"D9D9D9"}, Pattern: 1},
	})
	lastCol, _ := excelize.ColumnNumberToName(len(addressHeaders))
	_ = f.SetCellStyle(sheet, "A1", lastCol+"1", headerStyle)
	_ = freezeTopRow(f, sheet)
	for i := range addressHeaders {
		col, _ := excelize.ColumnNumberToName(i + 1)
		width := 22.0
		if i == len(addressHeaders)-1 {
			width = 14
		}
		_ = f.SetColWidth(sheet, col, col, width)
	}

	instructions := "Instructions"
	_, _ = f.NewSheet(instructions)
	_ = f.SetCellValue(instructions, "A1", "Address Import Format")
	_ = f.SetCellValue(instructions, "A3", "Required columns: Country Name (EN), Division Name (EN), District Name (EN), Thana Name (EN), Post Office Name (EN), and Post Code.")
	_ = f.SetCellValue(instructions, "A4", "Rows are matched and linked by English names within each parent: country -> division -> district -> thana -> post office.")
	_ = f.SetCellValue(instructions, "A5", "Bangla name columns are optional; when blank, English names are copied.")
	_ = f.SetCellValue(instructions, "A6", "Thana columns are imported into the Upazilas table.")
	_ = f.SetCellValue(instructions, "A7", "Post Code is stored as PostalCode.")
	_ = f.SetColWidth(instructions, "A", "A", 140)

	idx, _ := f.GetSheetIndex(sheet)
	f.SetActiveSheet(idx)
	return f, nil
}

func BuildAddressErrorWorkbook(errors []dto.RowError) (*excelize.File, error) {
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

func normalizeExcelHeader(value string) string {
	var b strings.Builder
	for _, r := range strings.ToLower(strings.TrimSpace(value)) {
		if unicode.IsLetter(r) || unicode.IsDigit(r) {
			b.WriteRune(r)
		}
	}
	return b.String()
}
