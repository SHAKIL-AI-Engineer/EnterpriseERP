using Erp.BuildingBlocks.SharedKernel;

namespace PayrollService.Domain.Entities;

public abstract class Entity
{
    public Guid Id { get; set; } = Guid.NewGuid();
}

public interface ICompanyScoped
{
    Guid CompanyId { get; set; }
}

public sealed class SalaryStructure : Entity, ICompanyScoped
{
    public Guid CompanyId { get; set; }
    public string StructureCode { get; set; } = string.Empty;
    public string StructureName { get; set; } = string.Empty;
    public Guid? GradeId { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = BusinessTime.Now;
    public ICollection<SalaryStructureComponent> Components { get; set; } = new List<SalaryStructureComponent>();
}

public sealed class SalaryStructureComponent : Entity, ICompanyScoped
{
    public Guid CompanyId { get; set; }
    public Guid SalaryStructureId { get; set; }
    public string ComponentCode { get; set; } = string.Empty;
    public string ComponentName { get; set; } = string.Empty;
    public string ComponentType { get; set; } = "Earning";
    public string CalculationType { get; set; } = "Fixed";
    public decimal Amount { get; set; }
    public decimal Percentage { get; set; }
    public string? BasedOnComponentCode { get; set; }
    public bool IsTaxable { get; set; }
    public bool IsActive { get; set; } = true;
}

public sealed class EmployeeSalary : Entity, ICompanyScoped
{
    public Guid CompanyId { get; set; }
    public Guid EmployeeId { get; set; }
    public Guid? SalaryStructureId { get; set; }
    public string SalaryCalculationType { get; set; } = "Monthly";
    public decimal GrossSalary { get; set; }
    public decimal BasicSalary { get; set; }
    public decimal HouseRent { get; set; }
    public decimal MedicalAllowance { get; set; }
    public decimal ConveyanceAllowance { get; set; }
    public decimal FoodAllowance { get; set; }
    public DateOnly EffectiveFrom { get; set; }
    public DateOnly? EffectiveTo { get; set; }
    public bool IsCurrent { get; set; } = true;
    public DateTime CreatedAt { get; set; } = BusinessTime.Now;
    public Guid? CreatedBy { get; set; }
}

public sealed class SalaryIncrementRequestEntity : Entity, ICompanyScoped
{
    public Guid CompanyId { get; set; }
    public Guid EmployeeId { get; set; }
    public decimal OldGrossSalary { get; set; }
    public decimal NewGrossSalary { get; set; }
    public decimal OldBasicSalary { get; set; }
    public decimal NewBasicSalary { get; set; }
    public decimal IncrementAmount { get; set; }
    public decimal IncrementPercentage { get; set; }
    public DateOnly EffectiveFrom { get; set; }
    public string? Reason { get; set; }
    public string Status { get; set; } = "Pending";
    public Guid RequestedBy { get; set; }
    public DateTime RequestedAt { get; set; } = BusinessTime.Now;
    public Guid? ApprovedBy { get; set; }
    public DateTime? ApprovedAt { get; set; }
}

public sealed class PayrollPolicyTemplate : Entity
{
    public string PolicyCode { get; set; } = string.Empty;
    public string PolicyName { get; set; } = string.Empty;
    public int Version { get; set; } = 1;
    public string Status { get; set; } = "Active";
    public string ComplianceMode { get; set; } = "FullCompliance";
    public decimal FixedMedical { get; set; } = 750;
    public decimal FixedFood { get; set; } = 1250;
    public decimal FixedConveyance { get; set; } = 450;
    public decimal BasicDivisor { get; set; } = 1.5m;
    public string OtBase { get; set; } = "Basic";
    public decimal OtDivisor { get; set; } = 208;
    public decimal OtMultiplier { get; set; } = 2;
    public string AbsentBase { get; set; } = "Basic";
    public string AbsentDayDivisor { get; set; } = "FixedDays";
    public int? FixedAbsentDays { get; set; } = 30;
    public string MonthDayCalculationType { get; set; } = "FixedDays";
    public int? FixedMonthDays { get; set; } = 30;
    public bool RequireAttendanceApproval { get; set; } = true;
    public bool AllowAbsentDeduction { get; set; } = true;
    public bool AllowLateDeduction { get; set; }
    public bool AllowOvertime { get; set; } = true;
    public bool AllowTiffinBill { get; set; }
    public bool AllowNightBill { get; set; }
    public bool AllowAttendanceBonus { get; set; }
    public bool AllowEarnLeaveEncashment { get; set; } = true;
    public bool AllowFestivalBonus { get; set; } = true;
    public DateTime CreatedAt { get; set; } = BusinessTime.Now;
}

public sealed class CompanyPayrollPolicyAssignment : Entity, ICompanyScoped
{
    public Guid CompanyId { get; set; }
    public Guid PolicyTemplateId { get; set; }
    public PayrollPolicyTemplate? PolicyTemplate { get; set; }
    public decimal? FixedOvertimeRate { get; set; }
    public DateOnly EffectiveFrom { get; set; }
    public bool IsActive { get; set; } = true;
    public Guid? AssignedBy { get; set; }
    public DateTime AssignedAt { get; set; } = BusinessTime.Now;
}

public sealed class PayrollRun : Entity, ICompanyScoped
{
    public Guid CompanyId { get; set; }
    public int YearNo { get; set; }
    public int MonthNo { get; set; }
    public DateOnly StartDate { get; set; }
    public DateOnly EndDate { get; set; }
    public string ProcessingMode { get; set; } = "FullCompliance";
    public string? AppliedPolicyCode { get; set; }
    public int? AppliedPolicyVersion { get; set; }
    public string? OvertimeCalculationType { get; set; }
    public decimal? FixedOvertimeRate { get; set; }
    public int RunNo { get; set; }
    public string RunStatus { get; set; } = "Started";
    public int TotalEmployees { get; set; }
    public int ProcessedEmployees { get; set; }
    public int FailedEmployees { get; set; }
    public string? ErrorMessage { get; set; }
    public Guid? ProcessedBy { get; set; }
    public DateTime ProcessedAt { get; set; } = BusinessTime.Now;
}

public sealed class EmployeePayroll : Entity, ICompanyScoped
{
    public Guid CompanyId { get; set; }
    public int YearNo { get; set; }
    public int MonthNo { get; set; }
    public Guid PayrollRunId { get; set; }
    public Guid EmployeeId { get; set; }
    public string ProcessingMode { get; set; } = "FullCompliance";
    public string SalaryCalculationType { get; set; } = "Monthly";
    public string? OvertimeCalculationType { get; set; }
    public string? AppliedPolicyCode { get; set; }
    public int? AppliedPolicyVersion { get; set; }
    public string? AppliedPolicySnapshotJson { get; set; }
    public decimal GrossSalary { get; set; }
    public decimal BasicSalary { get; set; }
    public decimal HouseRent { get; set; }
    public decimal MedicalAllowance { get; set; }
    public decimal FoodAllowance { get; set; }
    public decimal ConveyanceAllowance { get; set; }
    public decimal TotalDays { get; set; }
    public decimal WorkingDays { get; set; }
    public decimal PresentDays { get; set; }
    public decimal AbsentDays { get; set; }
    public decimal LeaveDays { get; set; }
    public decimal LeaveWithoutPayDays { get; set; }
    public decimal LateDays { get; set; }
    public decimal HolidayPresentDays { get; set; }
    public decimal WeeklyOffPresentDays { get; set; }
    public int TotalOvertimeMinutes { get; set; }
    public decimal OvertimeHours { get; set; }
    public decimal OvertimeRate { get; set; }
    public decimal OvertimeAmount { get; set; }
    public decimal TiffinBillAmount { get; set; }
    public decimal NightBillAmount { get; set; }
    public decimal AttendanceBonusAmount { get; set; }
    public decimal FestivalBonusAmount { get; set; }
    public decimal EarnLeaveEncashmentAmount { get; set; }
    public decimal TotalEarnings { get; set; }
    public decimal AbsentDeduction { get; set; }
    public decimal LateDeduction { get; set; }
    public decimal AdvanceDeduction { get; set; }
    public decimal LoanDeduction { get; set; }
    public decimal TaxDeduction { get; set; }
    public decimal ProvidentFundDeduction { get; set; }
    public decimal OtherDeduction { get; set; }
    public decimal TotalDeduction { get; set; }
    public decimal NetSalary { get; set; }
    public string Status { get; set; } = "Draft";
    public DateTime CreatedAt { get; set; } = BusinessTime.Now;
    public ICollection<PayrollEarning> Earnings { get; set; } = new List<PayrollEarning>();
    public ICollection<PayrollDeduction> Deductions { get; set; } = new List<PayrollDeduction>();
}

public sealed class PayrollEarning : Entity, ICompanyScoped
{
    public Guid EmployeePayrollId { get; set; }
    public Guid CompanyId { get; set; }
    public string EarningCode { get; set; } = string.Empty;
    public string EarningName { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public bool IsManual { get; set; }
    public string? Remarks { get; set; }
}

public sealed class PayrollDeduction : Entity, ICompanyScoped
{
    public Guid EmployeePayrollId { get; set; }
    public Guid CompanyId { get; set; }
    public string DeductionCode { get; set; } = string.Empty;
    public string DeductionName { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public bool IsManual { get; set; }
    public string? Remarks { get; set; }
}

public sealed class SalaryAdvance : Entity, ICompanyScoped
{
    public Guid CompanyId { get; set; }
    public Guid EmployeeId { get; set; }
    public string AdvanceNo { get; set; } = string.Empty;
    public decimal AdvanceAmount { get; set; }
    public decimal PaidAmount { get; set; }
    public decimal BalanceAmount { get; set; }
    public DateOnly AdvanceDate { get; set; }
    public int DeductionStartMonth { get; set; }
    public int DeductionStartYear { get; set; }
    public decimal InstallmentAmount { get; set; }
    public string Status { get; set; } = "Pending";
    public Guid? RequestedBy { get; set; }
    public Guid? ApprovedBy { get; set; }
    public DateTime? ApprovedAt { get; set; }
    public DateTime CreatedAt { get; set; } = BusinessTime.Now;
    public ICollection<SalaryAdvanceInstallment> Installments { get; set; } = new List<SalaryAdvanceInstallment>();
}

public sealed class SalaryAdvanceInstallment : Entity, ICompanyScoped
{
    public Guid CompanyId { get; set; }
    public Guid SalaryAdvanceId { get; set; }
    public Guid EmployeeId { get; set; }
    public int YearNo { get; set; }
    public int MonthNo { get; set; }
    public decimal InstallmentAmount { get; set; }
    public decimal PaidAmount { get; set; }
    public string Status { get; set; } = "Pending";
    public Guid? EmployeePayrollId { get; set; }
}

public sealed class AllowanceBill : Entity, ICompanyScoped
{
    public Guid CompanyId { get; set; }
    public Guid EmployeeId { get; set; }
    public string AllowanceType { get; set; } = string.Empty;
    public DateOnly BillDate { get; set; }
    public decimal Quantity { get; set; } = 1;
    public decimal Rate { get; set; }
    public decimal Amount { get; set; }
    public string Status { get; set; } = "Pending";
    public Guid? ApprovedBy { get; set; }
    public DateTime? ApprovedAt { get; set; }
    public string? Remarks { get; set; }
}

public sealed class FinalSettlement : Entity, ICompanyScoped
{
    public Guid CompanyId { get; set; }
    public Guid EmployeeId { get; set; }
    public DateOnly SettlementDate { get; set; }
    public DateOnly LastWorkingDate { get; set; }
    public decimal SalaryPayable { get; set; }
    public decimal EarnLeaveAmount { get; set; }
    public decimal ServiceBenefitAmount { get; set; }
    public decimal GratuityAmount { get; set; }
    public decimal AdvanceDeduction { get; set; }
    public decimal OtherDeduction { get; set; }
    public decimal NetPayable { get; set; }
    public string Status { get; set; } = "Pending";
    public Guid? ApprovedBy { get; set; }
    public DateTime? ApprovedAt { get; set; }
}

public sealed class PayrollDeductionEntry : Entity, ICompanyScoped
{
    public Guid CompanyId { get; set; }
    public Guid EmployeeId { get; set; }
    public string DeductionType { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public int YearNo { get; set; }
    public int MonthNo { get; set; }
    public string Status { get; set; } = "Approved";
    public string? Remarks { get; set; }
    public DateTime CreatedAt { get; set; } = BusinessTime.Now;
}

public sealed class PayrollAuditLog : Entity, ICompanyScoped
{
    public Guid CompanyId { get; set; }
    public string EntityName { get; set; } = string.Empty;
    public Guid EntityId { get; set; }
    public string Action { get; set; } = string.Empty;
    public Guid? ActorId { get; set; }
    public string? Remarks { get; set; }
    public DateTime CreatedAt { get; set; } = BusinessTime.Now;
}
