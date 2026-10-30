package enums

type ImportJobStatus string

const (
	ImportPending             ImportJobStatus = "Pending"
	ImportProcessing          ImportJobStatus = "Processing"
	ImportCompleted           ImportJobStatus = "Completed"
	ImportCompletedWithErrors ImportJobStatus = "CompletedWithErrors"
	ImportFailed              ImportJobStatus = "Failed"
	ImportCancelled           ImportJobStatus = "Cancelled"
)

type ExportJobStatus string

const (
	ExportPending    ExportJobStatus = "Pending"
	ExportProcessing ExportJobStatus = "Processing"
	ExportCompleted  ExportJobStatus = "Completed"
	ExportFailed     ExportJobStatus = "Failed"
)

type ExportFormat string

const (
	FormatExcel ExportFormat = "Excel"
	FormatPDF   ExportFormat = "PDF"
	FormatCSV   ExportFormat = "CSV"
)

type ModuleName string

const (
	ModuleEmployee    ModuleName = "Employee"
	ModuleAttendance  ModuleName = "Attendance"
	ModulePayroll     ModuleName = "Payroll"
	ModuleShift       ModuleName = "Shift"
	ModuleLeave       ModuleName = "Leave"
	ModuleCompany     ModuleName = "Company"
	ModuleDepartment  ModuleName = "Department"
	ModuleDesignation ModuleName = "Designation"
	ModuleBonus       ModuleName = "Bonus"
	ModuleSalarySheet ModuleName = "SalarySheet"
)
