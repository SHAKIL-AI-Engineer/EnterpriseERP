package reportexport

import (
	"bytes"
	"fmt"
	"strings"

	"github.com/xuri/excelize/v2"
)

// WorkbookGroup is a labeled block of rows on one worksheet tab.
type WorkbookGroup struct {
	Label string
	Rows  [][]string
}

// WorkbookSheet is one tab in a multi-sheet attendance export.
type WorkbookSheet struct {
	Name        string
	Title       string
	HeaderColor string
	Columns     []string
	Groups      []WorkbookGroup
}

func BuildXLSXWorkbook(baseLetterhead ReportLetterhead, sheets []WorkbookSheet, meta map[string]string) ([]byte, error) {
	return BuildXLSXWorkbookWithOptions(baseLetterhead, sheets, meta, DefaultOptions())
}

func BuildXLSXWorkbookWithOptions(baseLetterhead ReportLetterhead, sheets []WorkbookSheet, meta map[string]string, opts ExportOptions) ([]byte, error) {
	if len(sheets) == 0 {
		return nil, fmt.Errorf("at least one sheet is required")
	}
	maxRows := opts.MaxRows
	if maxRows <= 0 {
		maxRows = DefaultMaxRows
	}

	totalRows := 0
	for _, sheet := range sheets {
		for _, group := range sheet.Groups {
			totalRows += len(group.Rows)
		}
	}
	if totalRows > maxRows {
		return nil, fmt.Errorf("%w (max %d, got %d)", ErrTooManyRows, maxRows, totalRows)
	}

	f := excelize.NewFile()
	defaultName := f.GetSheetName(0)

	for i, spec := range sheets {
		if len(spec.Columns) == 0 {
			return nil, fmt.Errorf("sheet %q requires columns", spec.Name)
		}
		tab := safeSheetTabName(spec.Name)
		if i == 0 {
			_ = f.SetSheetName(defaultName, tab)
		} else {
			_, _ = f.NewSheet(tab)
		}

		letterhead := baseLetterhead
		if strings.TrimSpace(spec.Title) != "" {
			letterhead.ReportTitle = strings.TrimSpace(spec.Title)
		}
		headerColor := strings.TrimSpace(spec.HeaderColor)
		if headerColor == "" {
			headerColor = "D9EAF7"
		}
		if err := writeWorkbookSheet(f, tab, letterhead, spec, headerColor); err != nil {
			return nil, err
		}
	}

	var buf bytes.Buffer
	if err := f.Write(&buf); err != nil {
		return nil, err
	}
	return buf.Bytes(), nil
}

func writeWorkbookSheet(f *excelize.File, sheet string, letterhead ReportLetterhead, spec WorkbookSheet, headerColor string) error {
	columns := spec.Columns
	lastCol, _ := excelize.ColumnNumberToName(len(columns))

	allRows := flattenGroupRows(spec.Groups)
	colWidths := autoColumnWidths(columns, allRows)
	for i, width := range colWidths {
		col, _ := excelize.ColumnNumberToName(i + 1)
		_ = f.SetColWidth(sheet, col, col, width)
	}

	headerStyle, _ := f.NewStyle(&excelize.Style{
		Font:      &excelize.Font{Bold: true, Color: "111827"},
		Fill:      excelize.Fill{Type: "pattern", Color: []string{headerColor}, Pattern: 1},
		Alignment: &excelize.Alignment{Horizontal: "center", Vertical: "center", WrapText: true},
		Border: []excelize.Border{
			{Type: "bottom", Color: "9CA3AF", Style: 1},
		},
	})
	groupStyle, _ := f.NewStyle(&excelize.Style{
		Font:      &excelize.Font{Bold: true, Color: "1F2937", Size: 11},
		Fill:      excelize.Fill{Type: "pattern", Color: []string{"E5E7EB"}, Pattern: 1},
		Alignment: &excelize.Alignment{Horizontal: "left", Vertical: "center"},
	})
	zebraStyle, _ := f.NewStyle(&excelize.Style{
		Fill: excelize.Fill{Type: "pattern", Color: []string{"F9FAFB"}, Pattern: 1},
	})

	rowIndex := writeExcelLetterhead(f, sheet, lastCol, letterhead)

	for i, header := range columns {
		cell, _ := excelize.CoordinatesToCellName(i+1, rowIndex)
		_ = f.SetCellValue(sheet, cell, header)
	}
	_ = f.SetCellStyle(sheet, fmt.Sprintf("A%d", rowIndex), fmt.Sprintf("%s%d", lastCol, rowIndex), headerStyle)
	_ = f.SetRowHeight(sheet, rowIndex, 20)
	headerRow := rowIndex
	_ = f.AutoFilter(sheet, fmt.Sprintf("A%d:%s%d", rowIndex, lastCol, rowIndex), nil)
	rowIndex++

	dataRowIndex := 0
	for _, group := range spec.Groups {
		if strings.TrimSpace(group.Label) != "" {
			topLeft := fmt.Sprintf("A%d", rowIndex)
			endCell := fmt.Sprintf("%s%d", lastCol, rowIndex)
			_ = f.SetCellValue(sheet, topLeft, group.Label)
			_ = f.MergeCell(sheet, topLeft, endCell)
			_ = f.SetCellStyle(sheet, topLeft, endCell, groupStyle)
			_ = f.SetRowHeight(sheet, rowIndex, 18)
			rowIndex++
		}
		for _, row := range group.Rows {
			for ci, value := range row {
				if ci >= len(columns) {
					break
				}
				cell, _ := excelize.CoordinatesToCellName(ci+1, rowIndex)
				_ = f.SetCellValue(sheet, cell, value)
			}
			if dataRowIndex%2 == 1 {
				_ = f.SetCellStyle(sheet, fmt.Sprintf("A%d", rowIndex), fmt.Sprintf("%s%d", lastCol, rowIndex), zebraStyle)
			}
			dataRowIndex++
			rowIndex++
		}
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
	_ = f.SetPageLayout(sheet, &excelize.PageLayoutOptions{Orientation: &orientation})
	leftM, rightM, topM, bottomM, headerM, footerM := 0.3, 0.3, 0.5, 0.5, 0.2, 0.2
	_ = f.SetPageMargins(sheet, &excelize.PageLayoutMarginsOptions{
		Left: &leftM, Right: &rightM, Top: &topM, Bottom: &bottomM, Header: &headerM, Footer: &footerM,
	})
	return nil
}

func flattenGroupRows(groups []WorkbookGroup) [][]string {
	var out [][]string
	for _, g := range groups {
		out = append(out, g.Rows...)
	}
	return out
}

func safeSheetTabName(name string) string {
	name = strings.TrimSpace(name)
	if name == "" {
		return "Report"
	}
	replacer := strings.NewReplacer("/", "-", "\\", "-", "*", "-", "?", "-", ":", "-", "[", "(", "]", ")")
	name = replacer.Replace(name)
	if len(name) > 31 {
		name = name[:31]
	}
	return name
}
