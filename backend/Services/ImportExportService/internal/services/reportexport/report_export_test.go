package reportexport

import (
	"bytes"
	"fmt"
	"strings"
	"testing"

	"github.com/xuri/excelize/v2"
)

func TestBuildXLSX_basic(t *testing.T) {
	columns := []string{"Employee ID", "Name", "Department"}
	rows := [][]string{
		{"EMP-001", "Alice", "HR"},
		{"EMP-002", "Bob", "Production"},
	}
	meta := map[string]string{
		"CompanyId":   "00000000-0000-0000-0000-000000000001",
		"Period":      "May 2026",
		"GeneratedAt": "2026-05-29",
	}
	letterhead := ReportLetterhead{
		CompanyName:    "Acme Garments Ltd",
		CompanyAddress: "123 Industrial Area, Dhaka",
		ReportTitle:    "Employee Report",
	}
	data, err := BuildXLSX(letterhead, columns, rows, meta)
	if err != nil {
		t.Fatalf("BuildXLSX: %v", err)
	}
	if len(data) < 100 {
		t.Fatalf("expected non-trivial xlsx bytes, got %d", len(data))
	}
	if !strings.HasPrefix(string(data[:2]), "PK") {
		t.Fatal("expected zip/xlsx signature")
	}

	f, err := excelize.OpenReader(bytes.NewReader(data))
	if err != nil {
		t.Fatalf("open xlsx: %v", err)
	}
	defer f.Close()

	sheet := "Report"
	name, _ := f.GetCellValue(sheet, "A1")
	if name != "Acme Garments Ltd" {
		t.Fatalf("A1 company name = %q", name)
	}
	addr, _ := f.GetCellValue(sheet, "A2")
	if addr != "123 Industrial Area, Dhaka" {
		t.Fatalf("A2 address = %q", addr)
	}
	title, _ := f.GetCellValue(sheet, "A3")
	if title != "Employee Report" {
		t.Fatalf("A3 report title = %q", title)
	}
	merged, err := f.GetMergeCells(sheet)
	if err != nil || len(merged) < 3 {
		t.Fatalf("expected merged letterhead cells, got %v err=%v", merged, err)
	}
	foundPeriod := false
	for row := 4; row <= 6; row++ {
		line, _ := f.GetCellValue(sheet, fmt.Sprintf("A%d", row))
		if line == "Period: May 2026" {
			foundPeriod = true
		}
		if strings.Contains(line, "CompanyId") {
			t.Fatal("CompanyId should not appear in meta block")
		}
	}
	if !foundPeriod {
		t.Fatal("expected centered Period meta row after letterhead")
	}
}

func Test_orderedMetaKeys(t *testing.T) {
	meta := map[string]string{
		"ToDate":       "2026-05-11",
		"FromDate":     "2026-05-11",
		"GeneratedAt":  "2026-05-31 11:11:08 UTC",
		"DepartmentId": "",
	}
	out := orderedMetaKeys(filterMetaForDisplay(meta))
	if len(out) != 0 {
		t.Fatalf("keys = %v, want empty (GeneratedAt and dates excluded)", out)
	}
}

func TestBuildXLSX_letterheadMergedAndCentered(t *testing.T) {
	letterhead := ReportLetterhead{
		CompanyName:    "EKUSHE FASHIONS LTD",
		CompanyAddress: "Masterbari, Gazipur City, Gazipur.",
		ReportTitle:    "Daily Attendance Report — 2026-05-11",
	}
	columns := []string{"Employee ID", "Name", "Department", "Section", "Designation", "Shift", "In", "Out", "Status", "OT Hours"}
	data, err := BuildXLSX(letterhead, columns, [][]string{{"1", "Test", "Admin", "Admin", "Mgr", "General", "08:00", "17:00", "Present", "0"}}, nil)
	if err != nil {
		t.Fatal(err)
	}
	f, err := excelize.OpenReader(bytes.NewReader(data))
	if err != nil {
		t.Fatal(err)
	}
	defer f.Close()
	sheet := "Report"
	merged, err := f.GetMergeCells(sheet)
	if err != nil || len(merged) < 3 {
		t.Fatalf("merge cells: %v err=%v", merged, err)
	}
	foundA1Merge := false
	for _, m := range merged {
		if len(m) > 0 && strings.HasPrefix(m[0], "A1:") {
			foundA1Merge = true
			break
		}
	}
	if !foundA1Merge {
		t.Fatalf("expected A1: merged range, got %v", merged)
	}
	header, _ := f.GetCellValue(sheet, "A4")
	if header != "Employee ID" {
		t.Fatalf("row 4 should be column headers, got %q", header)
	}
	for row := 4; row <= 10; row++ {
		line, _ := f.GetCellValue(sheet, fmt.Sprintf("A%d", row))
		if strings.Contains(line, "Generated at") || line == "FromDate" || line == "ToDate" {
			t.Fatalf("row %d should not contain meta %q", row, line)
		}
	}
}

func Test_filterMetaForDisplay(t *testing.T) {
	meta := map[string]string{
		"CompanyId":   "guid",
		"company":     "ignored",
		"Period":      "May 2026",
		"sheetName":   "Hidden",
		"GeneratedAt": "2026-05-29",
		"DepartmentId": "",
	}
	out := filterMetaForDisplay(meta)
	if _, ok := out["CompanyId"]; ok {
		t.Fatal("CompanyId should be filtered")
	}
	if _, ok := out["company"]; ok {
		t.Fatal("company should be filtered")
	}
	if _, ok := out["sheetName"]; ok {
		t.Fatal("sheetName should be filtered")
	}
	if out["Period"] != "May 2026" {
		t.Fatalf("Period = %q", out["Period"])
	}
	if _, ok := out["GeneratedAt"]; ok {
		t.Fatal("GeneratedAt should not appear in export meta block")
	}
	if _, ok := out["DepartmentId"]; ok {
		t.Fatal("empty DepartmentId should be filtered")
	}
}

func TestBuildPDF_basic(t *testing.T) {
	columns := make([]string, 50)
	for i := range columns {
		columns[i] = "Col"
	}
	rows := make([][]string, 100)
	for i := range rows {
		row := make([]string, 50)
		for j := range row {
			row[j] = "x"
		}
		rows[i] = row
	}
	letterhead := ReportLetterhead{
		CompanyName: "Acme",
		ReportTitle: "Wide Report",
	}
	data, err := BuildPDF(letterhead, columns, rows, map[string]string{"Company": "ignored"})
	if err != nil {
		t.Fatalf("BuildPDF: %v", err)
	}
	if !strings.HasPrefix(string(data), "%PDF") {
		t.Fatal("expected PDF header")
	}
}

func TestBuildXLSX_rowLimit(t *testing.T) {
	rows := make([][]string, 10)
	for i := range rows {
		rows[i] = []string{"a"}
	}
	_, err := BuildXLSXWithOptions(ReportLetterhead{ReportTitle: "T"}, []string{"A"}, rows, nil, ExportOptions{MaxRows: 5})
	if err == nil {
		t.Fatal("expected row limit error")
	}
}

func TestSafeFileName(t *testing.T) {
	if SafeFileName("Trial Balance 2026!") != "trial-balance-2026" {
		t.Fatal("unexpected safe file name")
	}
}
