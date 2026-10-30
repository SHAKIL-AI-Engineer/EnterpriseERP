package reportexport

import (
	"bytes"
	"fmt"
	"math"
	"regexp"
	"sort"
	"strings"
	"time"

	"github.com/jung-kurt/gofpdf"
	"github.com/xuri/excelize/v2"
)

const (
	DefaultMaxRows = 5000
	MinColWidth    = 12.0
	MaxColWidth    = 40.0
)

var ErrTooManyRows = fmt.Errorf("row count exceeds export limit; narrow filters or use async export")

type ExportOptions struct {
	MaxRows int
}

// ReportLetterhead is the centered 3-line header block for Excel/PDF exports.
type ReportLetterhead struct {
	CompanyName    string
	CompanyAddress string
	ReportTitle    string
}

func DefaultOptions() ExportOptions {
	return ExportOptions{MaxRows: DefaultMaxRows}
}

func BuildXLSX(letterhead ReportLetterhead, columns []string, rows [][]string, meta map[string]string) ([]byte, error) {
	return BuildXLSXWithOptions(letterhead, columns, rows, meta, DefaultOptions())
}

func BuildXLSXWithOptions(letterhead ReportLetterhead, columns []string, rows [][]string, meta map[string]string, opts ExportOptions) ([]byte, error) {
	if len(columns) == 0 {
		return nil, fmt.Errorf("at least one column is required")
	}
	maxRows := opts.MaxRows
	if maxRows <= 0 {
		maxRows = DefaultMaxRows
	}
	if len(rows) > maxRows {
		return nil, fmt.Errorf("%w (max %d, got %d)", ErrTooManyRows, maxRows, len(rows))
	}

	displayMeta := filterMetaForDisplay(meta)
	sheet := sheetName(meta)
	f := excelize.NewFile()
	f.SetSheetName("Sheet1", sheet)

	metaKeyStyle, _ := f.NewStyle(&excelize.Style{
		Font: &excelize.Font{Bold: true, Color: "374151"},
	})
	headerStyle, _ := f.NewStyle(&excelize.Style{
		Font:      &excelize.Font{Bold: true, Color: "111827"},
		Fill:      excelize.Fill{Type: "pattern", Color: []string{"D9EAF7"}, Pattern: 1},
		Alignment: &excelize.Alignment{Horizontal: "center", Vertical: "center", WrapText: true},
		Border: []excelize.Border{
			{Type: "bottom", Color: "9CA3AF", Style: 1},
		},
	})
	zebraStyle, _ := f.NewStyle(&excelize.Style{
		Fill: excelize.Fill{Type: "pattern", Color: []string{"F3F4F6"}, Pattern: 1},
	})

	lastCol, _ := excelize.ColumnNumberToName(len(columns))
	colWidths := autoColumnWidths(columns, rows)
	for i, width := range colWidths {
		col, _ := excelize.ColumnNumberToName(i + 1)
		_ = f.SetColWidth(sheet, col, col, width)
	}

	rowIndex := writeExcelLetterhead(f, sheet, lastCol, letterhead)
	rowIndex = writeExcelMetaRows(f, sheet, lastCol, rowIndex, displayMeta, metaKeyStyle)

	headerRow := rowIndex
	for i, header := range columns {
		cell, _ := excelize.CoordinatesToCellName(i+1, rowIndex)
		_ = f.SetCellValue(sheet, cell, header)
	}
	_ = f.SetCellStyle(sheet, fmt.Sprintf("A%d", rowIndex), fmt.Sprintf("%s%d", lastCol, rowIndex), headerStyle)
	_ = f.SetRowHeight(sheet, rowIndex, 20)
	_ = f.AutoFilter(sheet, fmt.Sprintf("A%d:%s%d", rowIndex, lastCol, rowIndex), nil)
	rowIndex++

	for ri, row := range rows {
		for ci, value := range row {
			if ci >= len(columns) {
				break
			}
			cell, _ := excelize.CoordinatesToCellName(ci+1, rowIndex)
			_ = f.SetCellValue(sheet, cell, value)
		}
		if ri%2 == 1 {
			_ = f.SetCellStyle(sheet, fmt.Sprintf("A%d", rowIndex), fmt.Sprintf("%s%d", lastCol, rowIndex), zebraStyle)
		}
		rowIndex++
	}

	_ = f.SetPanes(sheet, &excelize.Panes{
		Freeze:      true,
		Split:       false,
		XSplit:      0,
		YSplit:      headerRow,
		TopLeftCell: fmt.Sprintf("A%d", headerRow+1),
		ActivePane:  "bottomLeft",
	})
	orientation := "landscape"
	if len(columns) <= 6 {
		orientation = "portrait"
	}
	_ = f.SetPageLayout(sheet, &excelize.PageLayoutOptions{
		Orientation: &orientation,
	})
	leftM, rightM, topM, bottomM, headerM, footerM := 0.3, 0.3, 0.5, 0.5, 0.2, 0.2
	_ = f.SetPageMargins(sheet, &excelize.PageLayoutMarginsOptions{
		Left: &leftM, Right: &rightM, Top: &topM, Bottom: &bottomM, Header: &headerM, Footer: &footerM,
	})

	var buf bytes.Buffer
	if err := f.Write(&buf); err != nil {
		return nil, err
	}
	return buf.Bytes(), nil
}

func letterheadSpanCol(lastCol string) string {
	endColNum, err := excelize.ColumnNameToNumber(lastCol)
	if err != nil || endColNum < 6 {
		span, _ := excelize.ColumnNumberToName(6)
		return span
	}
	return lastCol
}

func excelCenteredStyle(f *excelize.File, bold bool, size float64, italic bool, color string) int {
	font := &excelize.Font{Size: size, Color: color}
	if bold {
		font.Bold = true
	}
	if italic {
		font.Italic = true
	}
	style, _ := f.NewStyle(&excelize.Style{
		Font: font,
		Alignment: &excelize.Alignment{
			Horizontal: "center",
			Vertical:   "center",
			WrapText:   true,
		},
	})
	return style
}

// writeExcelCenteredMergedRow merges A:spanCol on one row with horizontal and vertical center.
// Excel requires the centered style on each cell in the range before and after merge.
func writeExcelCenteredMergedRow(f *excelize.File, sheet string, row int, spanCol, text string, styleID int, height float64) {
	endColNum, err := excelize.ColumnNameToNumber(spanCol)
	if err != nil || endColNum < 1 {
		endColNum = 6
	}
	topLeft, _ := excelize.CoordinatesToCellName(1, row)
	endCell, _ := excelize.CoordinatesToCellName(endColNum, row)

	for col := 1; col <= endColNum; col++ {
		cell, _ := excelize.CoordinatesToCellName(col, row)
		_ = f.SetCellStyle(sheet, cell, cell, styleID)
	}
	_ = f.SetCellValue(sheet, topLeft, text)
	_ = f.MergeCell(sheet, topLeft, endCell)
	_ = f.SetCellStyle(sheet, topLeft, endCell, styleID)
	_ = f.SetRowHeight(sheet, row, height)
}

func writeExcelLetterhead(f *excelize.File, sheet, lastCol string, letterhead ReportLetterhead) int {
	spanCol := letterheadSpanCol(lastCol)

	lines := []struct {
		text   string
		style  int
		height float64
	}{
		{letterhead.CompanyName, excelCenteredStyle(f, true, 20, false, "1F2937"), 32},
		{letterhead.CompanyAddress, excelCenteredStyle(f, false, 11, false, "374151"), 20},
		{letterhead.ReportTitle, excelCenteredStyle(f, true, 12, false, "1F2937"), 22},
	}

	row := 1
	for _, line := range lines {
		if strings.TrimSpace(line.text) == "" {
			continue
		}
		writeExcelCenteredMergedRow(f, sheet, row, spanCol, line.text, line.style, line.height)
		row++
	}
	return row
}

func writeExcelMetaRows(f *excelize.File, sheet, lastCol string, startRow int, meta map[string]string, _ int) int {
	if len(meta) == 0 {
		return startRow
	}
	spanCol := letterheadSpanCol(lastCol)
	metaStyle := excelCenteredStyle(f, false, 10, true, "6B7280")
	row := startRow
	for _, key := range orderedMetaKeys(meta) {
		label := metaDisplayLabel(key)
		text := fmt.Sprintf("%s: %s", label, meta[key])
		writeExcelCenteredMergedRow(f, sheet, row, spanCol, text, metaStyle, 16)
		row++
	}
	return row
}

func metaDisplayLabel(key string) string {
	switch strings.ToLower(strings.TrimSpace(key)) {
	case "generatedat":
		return "Generated at"
	default:
		return key
	}
}

func BuildPDF(letterhead ReportLetterhead, columns []string, rows [][]string, meta map[string]string) ([]byte, error) {
	return BuildPDFWithOptions(letterhead, columns, rows, meta, DefaultOptions())
}

func BuildPDFWithOptions(letterhead ReportLetterhead, columns []string, rows [][]string, meta map[string]string, opts ExportOptions) ([]byte, error) {
	if len(columns) == 0 {
		return nil, fmt.Errorf("at least one column is required")
	}
	maxRows := opts.MaxRows
	if maxRows <= 0 {
		maxRows = DefaultMaxRows
	}
	truncated := len(rows) > maxRows
	exportRows := rows
	if truncated {
		exportRows = rows[:maxRows]
	}

	displayMeta := filterMetaForDisplay(meta)

	orientation := "L"
	if len(columns) <= 6 {
		orientation = "P"
	}
	pdf := gofpdf.New(orientation, "mm", "A4", "")
	pdf.SetMargins(10, 12, 10)
	pdf.SetAutoPageBreak(true, 14)
	pdf.AddPage()

	writePDFLetterhead(pdf, letterhead)

	pdf.SetFont("Helvetica", "", 9)
	pageW, _ := pdf.GetPageSize()
	left, _, right, _ := pdf.GetMargins()
	usableW := pageW - left - right
	labelW := usableW * 0.22
	valueW := usableW - labelW
	for _, key := range orderedMetaKeys(displayMeta) {
		pdf.SetFont("Helvetica", "B", 9)
		pdf.CellFormat(labelW, 5, key, "", 0, "L", false, 0, "")
		pdf.SetFont("Helvetica", "", 9)
		pdf.CellFormat(valueW, 5, displayMeta[key], "", 1, "L", false, 0, "")
	}
	if len(displayMeta) > 0 {
		pdf.Ln(2)
	}

	colCount := len(columns)
	pageW, _ = pdf.GetPageSize()
	left, _, right, _ = pdf.GetMargins()
	usableW = pageW - left - right
	colW := usableW / float64(colCount)
	if colW < 18 {
		colW = 18
	}

	drawColumnHeader := func() {
		pdf.SetFont("Helvetica", "B", 8)
		pdf.SetFillColor(217, 234, 247)
		for _, col := range columns {
			pdf.CellFormat(colW, 7, trimCell(col, 28), "1", 0, "C", true, 0, "")
		}
		pdf.Ln(-1)
	}

	drawColumnHeader()
	pdf.SetFont("Helvetica", "", 7)
	for _, row := range exportRows {
		if pdf.GetY() > 190 {
			pdf.AddPage()
			drawColumnHeader()
			pdf.SetFont("Helvetica", "", 7)
		}
		for ci := 0; ci < colCount; ci++ {
			val := ""
			if ci < len(row) {
				val = row[ci]
			}
			pdf.CellFormat(colW, 6, trimCell(val, 32), "1", 0, "L", false, 0, "")
		}
		pdf.Ln(-1)
	}

	if truncated {
		pdf.Ln(3)
		pdf.SetFont("Helvetica", "I", 8)
		pdf.CellFormat(0, 5, fmt.Sprintf("Showing first %d of %d rows. Export to Excel for full data or narrow filters.", maxRows, len(rows)), "", 1, "L", false, 0, "")
	}

	pdf.SetY(-10)
	pdf.SetFont("Helvetica", "I", 8)
	pdf.CellFormat(0, 8, fmt.Sprintf("Generated %s  |  Page %d", time.Now().Format("2006-01-02 15:04"), pdf.PageNo()), "", 0, "C", false, 0, "")

	var buf bytes.Buffer
	if err := pdf.Output(&buf); err != nil {
		return nil, err
	}
	return buf.Bytes(), nil
}

func writePDFLetterhead(pdf *gofpdf.Fpdf, letterhead ReportLetterhead) {
	pageW, _ := pdf.GetPageSize()
	left, _, right, _ := pdf.GetMargins()
	usableW := pageW - left - right

	writeCenteredLine := func(text string, fontSize float64, bold bool) {
		style := ""
		if bold {
			style = "B"
		}
		pdf.SetFont("Helvetica", style, fontSize)
		if strings.TrimSpace(text) == "" {
			pdf.Ln(6)
			return
		}
		pdf.MultiCell(usableW, 6, text, "", "C", false)
		pdf.Ln(1)
	}

	writeCenteredLine(letterhead.CompanyName, 14, true)
	writeCenteredLine(letterhead.CompanyAddress, 11, false)
	writeCenteredLine(letterhead.ReportTitle, 12, true)
	pdf.Ln(2)
}

func filterMetaForDisplay(meta map[string]string) map[string]string {
	if len(meta) == 0 {
		return nil
	}
	out := make(map[string]string, len(meta))
	for k, v := range meta {
		if isExcludedMetaKey(k) {
			continue
		}
		if strings.TrimSpace(v) == "" {
			continue
		}
		out[k] = v
	}
	if len(out) == 0 {
		return nil
	}
	return out
}

func isExcludedMetaKey(key string) bool {
	switch strings.ToLower(strings.TrimSpace(key)) {
	case "sheetname", "companyid", "company",
		"fromdate", "todate", "date", "generatedat",
		"departmentid", "sectionid", "designationid", "employeeid", "search":
		return true
	default:
		return false
	}
}

var metaDisplayPriority = []string{
	"Period", "Year", "Month", "YearNo", "MonthNo",
	"Employee", "Department",
}

func orderedMetaKeys(meta map[string]string) []string {
	if len(meta) == 0 {
		return nil
	}
	seen := make(map[string]struct{}, len(meta))
	var keys []string
	for _, k := range metaDisplayPriority {
		if v, ok := meta[k]; ok && strings.TrimSpace(v) != "" {
			keys = append(keys, k)
			seen[k] = struct{}{}
		}
	}
	var rest []string
	for k := range meta {
		if _, ok := seen[k]; ok {
			continue
		}
		if strings.TrimSpace(meta[k]) == "" {
			continue
		}
		rest = append(rest, k)
	}
	sort.Strings(rest)
	return append(keys, rest...)
}

func SafeFileName(value string) string {
	value = strings.ToLower(strings.TrimSpace(value))
	if value == "" {
		return "report"
	}
	re := regexp.MustCompile(`[^a-z0-9]+`)
	return strings.Trim(re.ReplaceAllString(value, "-"), "-")
}

func sheetName(meta map[string]string) string {
	if meta != nil {
		if name := strings.TrimSpace(meta["sheetName"]); name != "" {
			name = regexp.MustCompile(`[\[\]:\\/?*]`).ReplaceAllString(name, "")
			if len(name) > 31 {
				name = name[:31]
			}
			if name != "" {
				return name
			}
		}
	}
	return "Report"
}

func sortedMetaKeys(meta map[string]string) []string {
	return orderedMetaKeys(meta)
}

func autoColumnWidths(columns []string, rows [][]string) []float64 {
	widths := make([]float64, len(columns))
	for i, col := range columns {
		widths[i] = math.Min(MaxColWidth, math.Max(MinColWidth, float64(len(col))+2))
	}
	for _, row := range rows {
		for ci, val := range row {
			if ci >= len(widths) {
				break
			}
			w := float64(len(val)) + 2
			if w > widths[ci] {
				widths[ci] = math.Min(MaxColWidth, w)
			}
		}
	}
	return widths
}

func trimCell(value string, max int) string {
	value = strings.TrimSpace(value)
	if len(value) <= max {
		return value
	}
	if max <= 3 {
		return value[:max]
	}
	return value[:max-3] + "..."
}
