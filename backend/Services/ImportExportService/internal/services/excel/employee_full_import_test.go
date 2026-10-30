package excelsvc

import (
	"path/filepath"
	"testing"
	"time"
)

func TestParseEmployeeFullImportDetectsDuplicatePunchNumber(t *testing.T) {
	join := time.Date(2026, 1, 2, 0, 0, 0, 0, time.UTC)
	f, err := ExportEmployeesFullExcel([]EmployeeFullImportRow{
		{
			PunchNumber: 11, EmployeeID: "EMP-011", FullName: "First Employee",
			JoinDate: join, EmploymentType: "Permanent", Status: "Active",
			DepartmentName: "HR", DesignationName: "Executive",
		},
		{
			PunchNumber: 11, EmployeeID: "EMP-012", FullName: "Second Employee",
			JoinDate: join, EmploymentType: "Permanent", Status: "Active",
			DepartmentName: "HR", DesignationName: "Executive",
		},
	})
	if err != nil {
		t.Fatalf("ExportEmployeesFullExcel() error = %v", err)
	}
	defer f.Close()

	path := filepath.Join(t.TempDir(), "employees.xlsx")
	if err := f.SaveAs(path); err != nil {
		t.Fatalf("SaveAs() error = %v", err)
	}

	rows, errs, err := ParseEmployeeFullImport(path)
	if err != nil {
		t.Fatalf("ParseEmployeeFullImport() error = %v", err)
	}
	if len(rows) != 1 {
		t.Fatalf("valid rows = %d, want 1", len(rows))
	}
	for _, e := range errs {
		if e.Row == 3 && e.Column == "PunchNumber" && e.Message == "duplicate within file" {
			return
		}
	}
	t.Fatalf("duplicate PunchNumber error not found: %+v", errs)
}
