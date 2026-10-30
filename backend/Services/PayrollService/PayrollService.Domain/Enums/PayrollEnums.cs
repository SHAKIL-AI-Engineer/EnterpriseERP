namespace PayrollService.Domain.Enums;

public static class PayrollRoles
{
    public const string SuperAdmin = "SuperAdmin";
    public const string GroupAdmin = "GroupAdmin";
    public const string CompanyAdmin = "CompanyAdmin";
    public const string HRManager = "HRManager";
    public const string PayrollOfficer = "PayrollOfficer";
    public const string AccountsOfficer = "AccountsOfficer";
    public const string Auditor = "Auditor";
    public const string Employee = "Employee";
    public const string Viewer = "Viewer";
}

public static class PayrollPermissions
{
    public const string PayrollPolicyManage = "PAYROLL_POLICY_MANAGE";
    public const string SalaryStructureManage = "SALARY_STRUCTURE_MANAGE";
    public const string EmployeeSalaryManage = "EMPLOYEE_SALARY_MANAGE";
    public const string SalaryIncrementRequest = "SALARY_INCREMENT_REQUEST";
    public const string SalaryIncrementApprove = "SALARY_INCREMENT_APPROVE";
    public const string SalaryAdvanceRequest = "SALARY_ADVANCE_REQUEST";
    public const string SalaryAdvanceApprove = "SALARY_ADVANCE_APPROVE";
    public const string PayrollProcess = "PAYROLL_PROCESS";
    public const string PayrollReprocess = "PAYROLL_REPROCESS";
    public const string PayrollApprove = "PAYROLL_APPROVE";
    public const string PayrollLock = "PAYROLL_LOCK";
    public const string PayrollUnlock = "PAYROLL_UNLOCK";
    public const string PayslipView = "PAYSLIP_VIEW";
    public const string SalarySheetView = "SALARY_SHEET_VIEW";
    public const string BankSheetExport = "BANK_SHEET_EXPORT";
    public const string FinalSettlementProcess = "FINAL_SETTLEMENT_PROCESS";
    public const string FinalSettlementApprove = "FINAL_SETTLEMENT_APPROVE";
}

public enum SalaryProcessingMode { FullCompliance, NonCompliance, MultiSalaryOt }

public enum SalaryCalculationType { Monthly, Daily, Hourly, PieceRate, Contract }
public enum MonthDayCalculationType { CalendarDays, FixedDays, WorkingDays }
public enum OvertimeCalculationType { BasicSalaryBased, GrossSalaryBased, FixedRate, None }
public enum ComponentType { Earning, Deduction, Benefit, EmployerContribution }
public enum ComponentCalculationType { Fixed, Percentage, Formula, AttendanceBased, Manual }
public enum RequestStatus { Pending, Approved, Rejected, Cancelled }
public enum PayrollPeriodStatus { Open, Processed, Submitted, Approved, Rejected, Locked }
public enum PayrollRunStatus { Started, Processing, Success, Failed, Partial }
public enum EmployeePayrollStatus { Draft, Processed, Submitted, Approved, Rejected, Locked }
public enum AdvanceStatus { Pending, Approved, Running, Closed, Rejected }
public enum AdvanceInstallmentStatus { Pending, Deducted, Skipped }
public enum AllowanceType { TiffinBill, NightBill, TransportBill, MobileBill, HolidayBill, SpecialBill }
