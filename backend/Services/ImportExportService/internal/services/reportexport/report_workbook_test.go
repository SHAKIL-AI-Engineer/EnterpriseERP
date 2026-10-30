package reportexport

import (
	"bytes"
	"testing"

	"github.com/xuri/excelize/v2"
)

func TestBuildXLSXWorkbook_fourSheets(t *testing.T) {
	letterhead := ReportLetterhead{
		CompanyName:    "Acme Ltd",
		CompanyAddress: "Dhaka",
		ReportTitle:    "Daily Attendance Report — 2026-05-13",
	}
	columns := []string{"SL", "Employee ID", "Name", "Designation", "Shift", "In", "Out", "Status", "OT Hours"}
	sheets := []WorkbookSheet{
		{
			Name: "Department", Title: "Daily Attendance Report — By Department", HeaderColor: "D9EAF7",
			Columns: columns,
			Groups: []WorkbookGroup{{Label: "Department: Admin", Rows: [][]string{{"1", "E1", "Alice", "Mgr", "G", "08:00", "17:00", "Present", "0"}}}},
		},
		{
			Name: "Section", Title: "Daily Attendance Report — By Section", HeaderColor: "D1FAE5",
			Columns: columns,
			Groups: []WorkbookGroup{{Label: "Section: IT", Rows: [][]string{{"1", "E1", "Alice", "Mgr", "G", "08:00", "17:00", "Present", "0"}}}},
		},
		{
			Name: "Designation", Title: "Daily Attendance Report — By Designation", HeaderColor: "FDE68A",
			Columns: columns,
			Groups: []WorkbookGroup{{Label: "Designation: Manager", Rows: [][]string{{"1", "E1", "Alice", "Mgr", "G", "08:00", "17:00", "Present", "0"}}}},
		},
		{
			Name: "Line", Title: "Daily Attendance Report — By Line", HeaderColor: "E9D5FF",
			Columns: columns,
			Groups: []WorkbookGroup{{Label: "Line: Line 1", Rows: [][]string{{"1", "E1", "Alice", "Mgr", "G", "08:00", "17:00", "Present", "0"}}}},
		},
	}

	data, err := BuildXLSXWorkbook(letterhead, sheets, nil)
	if err != nil {
		t.Fatal(err)
	}
	f, err := excelize.OpenReader(bytes.NewReader(data))
	if err != nil {
		t.Fatal(err)
	}
	defer f.Close()

	names := f.GetSheetList()
	if len(names) != 4 {
		t.Fatalf("sheet count = %d, want 4: %v", len(names), names)
	}
	a4, _ := f.GetCellValue("Department", "A4")
	if a4 != "SL" {
		t.Fatalf("Department A4 = %q, want SL", a4)
	}
	group, _ := f.GetCellValue("Department", "A5")
	if group != "Department: Admin" {
		t.Fatalf("Department A5 = %q", group)
	}
}
