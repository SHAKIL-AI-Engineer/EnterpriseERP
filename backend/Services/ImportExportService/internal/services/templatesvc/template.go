package templatesvc

import (
	excelsvc "github.com/enterprise-erp/importexport/internal/services/excel"
	"github.com/xuri/excelize/v2"
)

// BuildEmployeeImportTemplate produces full-profile multi-sheet workbook.
func BuildEmployeeImportTemplate() (*excelize.File, error) {
	return excelsvc.BuildEmployeeFullDemoTemplate()
}

// BuildPayrollImportTemplate creates payroll import template.
func BuildPayrollImportTemplate() (*excelize.File, error) {
	f := excelize.NewFile()
	f.SetSheetName("Sheet1", "Template")
	h := []string{
		"EmployeeCode", "PayrollMonth", "GrossSalary", "BasicSalary", "HouseRent",
		"MedicalAllowance", "AttendanceDays", "OvertimeHours", "OvertimeAmount", "Deduction",
	}
	for i, col := range h {
		cell, _ := excelize.CoordinatesToCellName(i+1, 1)
		_ = f.SetCellValue("Template", cell, col)
	}
	idx, _ := f.GetSheetIndex("Template")
	f.SetActiveSheet(idx)
	return f, nil
}

// BuildAttendanceImportTemplate creates attendance template sheets.
func BuildAttendanceImportTemplate() (*excelize.File, error) {
	f := excelize.NewFile()
	f.SetSheetName("Sheet1", "Template")
	h := []string{"EmployeeID", "AttendanceDate", "ShiftCode", "InTime", "OutTime", "Status", "Remarks"}
	for i, col := range h {
		cell, _ := excelize.CoordinatesToCellName(i+1, 1)
		_ = f.SetCellValue("Template", cell, col)
	}
	idx, _ := f.GetSheetIndex("Template")
	f.SetActiveSheet(idx)
	return f, nil
}
