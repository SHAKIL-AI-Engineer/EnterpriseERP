package excelsvc

import (
	"fmt"
	"time"

	"github.com/xuri/excelize/v2"
)

// ExportEmployeesExcel builds employee list export with styles.
func ExportEmployeesExcel(rows []EmployeeExportRow) (*excelize.File, error) {
	f := excelize.NewFile()
	sheet := "Employees"
	f.SetSheetName("Sheet1", sheet)
	f.SetActiveSheet(0)
	headers := []string{"PunchNumber", "EmployeeID", "EmployeeName", "Department", "Designation", "JoinDate", "Status", "GrossSalary"}
	for i, h := range headers {
		cell, _ := excelize.CoordinatesToCellName(i+1, 1)
		_ = f.SetCellValue(sheet, cell, h)
	}
	style, _ := f.NewStyle(&excelize.Style{Font: &excelize.Font{Bold: true}})
	_ = f.SetRowStyle(sheet, 1, 1, style)
	_ = freezeTopRow(f, sheet)
	for ri, row := range rows {
		r := ri + 2
		_ = f.SetCellValue(sheet, fmt.Sprintf("A%d", r), row.PunchNumber)
		_ = f.SetCellValue(sheet, fmt.Sprintf("B%d", r), row.EmployeeID)
		_ = f.SetCellValue(sheet, fmt.Sprintf("C%d", r), row.EmployeeName)
		_ = f.SetCellValue(sheet, fmt.Sprintf("D%d", r), row.Department)
		_ = f.SetCellValue(sheet, fmt.Sprintf("E%d", r), row.Designation)
		_ = f.SetCellValue(sheet, fmt.Sprintf("F%d", r), row.JoinDate)
		_ = f.SetCellValue(sheet, fmt.Sprintf("G%d", r), row.Status)
		_ = f.SetCellValue(sheet, fmt.Sprintf("H%d", r), row.GrossSalary)
	}
	for i := range headers {
		col, _ := excelize.ColumnNumberToName(i + 1)
		_ = f.SetColWidth(sheet, col, col, 16)
	}
	return f, nil
}

type EmployeeExportRow struct {
	PunchNumber  int
	EmployeeID   string
	EmployeeName string
	Department   string
	Designation  string
	JoinDate     time.Time
	Status       string
	GrossSalary  float64
}

// ExportPayrollExcel with NetPayable formula column.
func ExportPayrollExcel(rows []PayrollExportRow) (*excelize.File, error) {
	f := excelize.NewFile()
	sheet := "Payroll"
	f.SetSheetName("Sheet1", sheet)
	f.SetActiveSheet(0)
	headers := []string{
		"EmployeeID", "EmployeeName", "Department", "Designation", "GrossSalary", "BasicSalary",
		"HouseRent", "MedicalAllowance", "AttendanceDays", "OvertimeHours", "OvertimeAmount",
		"Deduction", "NetPayable",
	}
	for i, h := range headers {
		cell, _ := excelize.CoordinatesToCellName(i+1, 1)
		_ = f.SetCellValue(sheet, cell, h)
	}
	curStyle, _ := f.NewStyle(&excelize.Style{NumFmt: 188}) // currency-ish
	for ri, row := range rows {
		r := ri + 2
		_ = f.SetCellValue(sheet, fmt.Sprintf("A%d", r), row.EmployeeID)
		_ = f.SetCellValue(sheet, fmt.Sprintf("B%d", r), row.EmployeeName)
		_ = f.SetCellValue(sheet, fmt.Sprintf("C%d", r), row.Department)
		_ = f.SetCellValue(sheet, fmt.Sprintf("D%d", r), row.Designation)
		_ = f.SetCellStyle(sheet, fmt.Sprintf("E%d", r), fmt.Sprintf("E%d", r), curStyle)
		_ = f.SetCellValue(sheet, fmt.Sprintf("E%d", r), row.GrossSalary)
		_ = f.SetCellValue(sheet, fmt.Sprintf("F%d", r), row.BasicSalary)
		_ = f.SetCellValue(sheet, fmt.Sprintf("G%d", r), row.HouseRent)
		_ = f.SetCellValue(sheet, fmt.Sprintf("H%d", r), row.MedicalAllowance)
		_ = f.SetCellValue(sheet, fmt.Sprintf("I%d", r), row.AttendanceDays)
		_ = f.SetCellValue(sheet, fmt.Sprintf("J%d", r), row.OvertimeHours)
		_ = f.SetCellValue(sheet, fmt.Sprintf("K%d", r), row.OvertimeAmount)
		_ = f.SetCellValue(sheet, fmt.Sprintf("L%d", r), row.Deduction)
		// NetPayable = Gross + OT - Deduction (simplified)
		formula := fmt.Sprintf("E%d+K%d-L%d", r, r, r)
		_ = f.SetCellFormula(sheet, fmt.Sprintf("M%d", r), formula)
	}
	_ = freezeTopRow(f, sheet)
	return f, nil
}

type PayrollExportRow struct {
	EmployeeID       string
	EmployeeName     string
	Department       string
	Designation      string
	GrossSalary      float64
	BasicSalary      float64
	HouseRent        float64
	MedicalAllowance float64
	AttendanceDays   float64
	OvertimeHours    float64
	OvertimeAmount   float64
	Deduction        float64
}
