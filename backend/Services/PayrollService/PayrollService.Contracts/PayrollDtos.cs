using PayrollService.Domain.Enums;

namespace PayrollService.Contracts;

public sealed record SalaryStructureDto(Guid Id, Guid CompanyId, string StructureCode, string StructureName, Guid? GradeId, bool IsActive, IReadOnlyList<SalaryStructureComponentDto> Components);

public sealed record SalaryStructureComponentDto(
    Guid Id,
    Guid CompanyId,
    Guid SalaryStructureId,
    string ComponentCode,
    string ComponentName,
    string ComponentType,
    string CalculationType,
    decimal Amount,
    decimal Percentage,
    string? BasedOnComponentCode,
    bool IsTaxable,
    bool IsActive);

public sealed record CreateSalaryStructureRequest(Guid CompanyId, string StructureCode, string StructureName, Guid? GradeId, IReadOnlyList<CreateSalaryStructureComponentRequest> Components);

public sealed record CreateSalaryStructureComponentRequest(
    Guid CompanyId,
    string ComponentCode,
    string ComponentName,
    string ComponentType,
    string CalculationType,
    decimal Amount,
    decimal Percentage,
    string? BasedOnComponentCode,
    bool IsTaxable);

public sealed record EmployeeSalaryDto(
    Guid Id,
    Guid CompanyId,
    Guid EmployeeId,
    Guid? SalaryStructureId,
    string SalaryCalculationType,
    decimal GrossSalary,
    decimal BasicSalary,
    decimal HouseRent,
    decimal MedicalAllowance,
    decimal ConveyanceAllowance,
    decimal FoodAllowance,
    DateOnly EffectiveFrom,
    DateOnly? EffectiveTo,
    bool IsCurrent);

public sealed record EmployeeSalaryRequest(
    Guid CompanyId,
    Guid EmployeeId,
    Guid? SalaryStructureId,
    decimal GrossSalary,
    decimal BasicSalary,
    decimal HouseRent,
    decimal MedicalAllowance,
    decimal ConveyanceAllowance,
    decimal FoodAllowance,
    DateOnly EffectiveFrom,
    Guid? CreatedBy,
    string SalaryCalculationType = "Monthly");

public sealed record SalaryIncrementDto(Guid Id, Guid CompanyId, Guid EmployeeId, decimal OldGrossSalary, decimal NewGrossSalary, decimal IncrementAmount, decimal IncrementPercentage, DateOnly EffectiveFrom, string Status);

public sealed record SalaryIncrementRequest(
    Guid CompanyId,
    Guid EmployeeId,
    decimal OldGrossSalary,
    decimal NewGrossSalary,
    decimal OldBasicSalary,
    decimal NewBasicSalary,
    DateOnly EffectiveFrom,
    string Reason,
    Guid RequestedBy);

public sealed record ProcessPayrollRequest(
    Guid CompanyId,
    int YearNo,
    int MonthNo,
    Guid? ProcessedBy,
    bool ForceReprocess = false);

public sealed record PayrollPolicyTemplateDto(
    Guid Id,
    string PolicyCode,
    string PolicyName,
    int Version,
    string ComplianceMode,
    string OtBase,
    decimal OtDivisor,
    decimal OtMultiplier,
    string AbsentBase,
    string AbsentDayDivisor,
    string MonthDayCalculationType,
    bool RequireAttendanceApproval,
    string Summary);

public sealed record CompanyPayrollPolicyAssignmentDto(
    Guid Id,
    Guid CompanyId,
    Guid PolicyTemplateId,
    string PolicyCode,
    string PolicyName,
    int PolicyVersion,
    decimal? FixedOvertimeRate,
    DateOnly EffectiveFrom,
    bool IsActive,
    DateTime AssignedAt);

public sealed record AssignCompanyPayrollPolicyRequest(
    Guid CompanyId,
    string PolicyCode,
    DateOnly EffectiveFrom,
    Guid? AssignedBy,
    decimal? FixedOvertimeRate = null);

public sealed record CompanyPayrollPolicySummaryDto(
    Guid CompanyId,
    string PolicyCode,
    string PolicyName,
    int Version,
    decimal? FixedOvertimeRate,
    DateOnly? EffectiveFrom);

public sealed record PolicyTestCalculateRequest(
    decimal GrossSalary,
    decimal OvertimeHours,
    decimal AbsentDays,
    int YearNo,
    int MonthNo,
    decimal? FixedOvertimeRate = null);

public sealed record PolicyTestCalculateResultDto(
    decimal BasicSalary,
    decimal HouseRent,
    decimal MedicalAllowance,
    decimal FoodAllowance,
    decimal ConveyanceAllowance,
    decimal OvertimeRate,
    decimal OvertimeAmount,
    decimal AbsentDeduction,
    decimal NetSalary);

public sealed record EmployeePayrollDto(
    Guid Id,
    Guid CompanyId,
    int YearNo,
    int MonthNo,
    Guid PayrollRunId,
    Guid EmployeeId,
    string ProcessingMode,
    string SalaryCalculationType,
    string? OvertimeCalculationType,
    decimal GrossSalary,
    decimal BasicSalary,
    decimal TotalDays,
    decimal WorkingDays,
    decimal PresentDays,
    decimal AbsentDays,
    decimal LeaveDays,
    decimal LeaveWithoutPayDays,
    decimal LateDays,
    decimal OvertimeHours,
    decimal OvertimeRate,
    decimal OvertimeAmount,
    decimal TiffinBillAmount,
    decimal NightBillAmount,
    decimal AttendanceBonusAmount,
    decimal FestivalBonusAmount,
    decimal EarnLeaveEncashmentAmount,
    decimal TotalEarnings,
    decimal TotalDeduction,
    decimal NetSalary,
    string Status,
    IReadOnlyList<PayrollEarningDto> Earnings,
    IReadOnlyList<PayrollDeductionDto> Deductions);

public sealed record PayrollEarningDto(string EarningCode, string EarningName, decimal Amount, bool IsManual, string? Remarks);

public sealed record PayrollDeductionDto(string DeductionCode, string DeductionName, decimal Amount, bool IsManual, string? Remarks);

public sealed record SalarySheetRowDto(
    Guid EmployeeId,
    string? EmployeeCode,
    string? EmployeeName,
    string? DepartmentName,
    string? DesignationName,
    decimal GrossSalary,
    decimal BasicSalary,
    decimal TotalDays,
    decimal PresentDays,
    decimal AbsentDays,
    decimal OvertimeHours,
    decimal OvertimeAmount,
    decimal TotalEarnings,
    decimal TotalDeduction,
    decimal NetSalary,
    string Status);

public sealed record PayrollSummaryDto(
    Guid CompanyId,
    int YearNo,
    int MonthNo,
    int TotalEmployees,
    decimal GrossSalary,
    decimal TotalEarnings,
    decimal TotalDeduction,
    decimal NetSalary,
    string Status);

public sealed record SummaryGroupDto(
    string Name,
    decimal TotalGrossSalary,
    decimal TotalOTAmount,
    decimal TotalDeductions,
    decimal TotalNetPayable,
    int EmployeeCount);

public sealed record PayrollSummaryBreakdownDto(
    PayrollSummaryDto Summary,
    IReadOnlyList<SummaryGroupDto> DepartmentSummaries,
    IReadOnlyList<SummaryGroupDto> SectionSummaries,
    IReadOnlyList<SummaryGroupDto> LineSummaries,
    IReadOnlyList<SummaryGroupDto> GroupSummaries);

public sealed record BankSheetRowDto(Guid EmployeeId, string BankAccountNo, string BankName, decimal NetSalary);

public sealed record PayslipDto(EmployeePayrollDto Payroll, PayrollSummaryDto PeriodSummary);

public sealed record SalaryAdvanceDto(Guid Id, Guid CompanyId, Guid EmployeeId, string AdvanceNo, decimal AdvanceAmount, decimal PaidAmount, decimal BalanceAmount, DateOnly AdvanceDate, decimal InstallmentAmount, string Status);

public sealed record SalaryAdvanceRequest(
    Guid CompanyId,
    Guid EmployeeId,
    string AdvanceNo,
    decimal AdvanceAmount,
    DateOnly AdvanceDate,
    int DeductionStartMonth,
    int DeductionStartYear,
    decimal InstallmentAmount,
    Guid? RequestedBy);

public sealed record SalaryAdvanceBalanceDto(Guid EmployeeId, decimal ApprovedBalance, decimal RunningBalance, decimal TotalBalance);

public sealed record AllowanceBillDto(Guid Id, Guid CompanyId, Guid EmployeeId, string AllowanceType, DateOnly BillDate, decimal Quantity, decimal Rate, decimal Amount, string Status, string? Remarks);

public sealed record AllowanceBillRequest(Guid CompanyId, Guid EmployeeId, string AllowanceType, DateOnly BillDate, decimal Quantity, decimal Rate, decimal Amount, string? Remarks);

public sealed record DeductionDto(Guid Id, Guid CompanyId, Guid EmployeeId, string DeductionType, decimal Amount, int YearNo, int MonthNo, string Status, string? Remarks);

public sealed record CreateDeductionRequest(Guid CompanyId, Guid EmployeeId, string DeductionType, decimal Amount, int YearNo, int MonthNo, string? Remarks);

public sealed record FinalSettlementDto(Guid Id, Guid CompanyId, Guid EmployeeId, DateOnly SettlementDate, DateOnly LastWorkingDate, decimal NetPayable, string Status);

public sealed record ApprovalRequest(Guid UserId, string? Remarks);

public sealed record FinalSettlementRequest(
    Guid CompanyId,
    Guid EmployeeId,
    DateOnly SettlementDate,
    DateOnly LastWorkingDate,
    decimal SalaryPayable,
    decimal EarnLeaveAmount,
    decimal ServiceBenefitAmount,
    decimal GratuityAmount,
    decimal AdvanceDeduction,
    decimal OtherDeduction);

public sealed record BatchSalaryAdvanceRequest(
    Guid CompanyId,
    IReadOnlyList<Guid> EmployeeIds,
    decimal AdvanceAmount,
    DateOnly AdvanceDate,
    int DeductionStartMonth,
    int DeductionStartYear,
    decimal InstallmentAmount,
    Guid? RequestedBy,
    string? AdvanceNoPrefix = null);

public sealed record BatchDeleteSalaryAdvanceRequest(IReadOnlyList<Guid> Ids);

public sealed record SalaryAdvanceSummaryDto(
    int TotalCount,
    decimal TotalAmount,
    decimal TotalBalance,
    int ApprovedCount,
    int PendingCount);

public sealed record DailySalarySheetRowDto(
    Guid EmployeeId,
    string? EmployeeCode,
    string? EmployeeName,
    string? DepartmentName,
    string? DesignationName,
    DateOnly Date,
    decimal GrossSalary,
    decimal PerDaySalary,
    string AttendanceStatus,
    decimal OtHours,
    decimal OtAmount,
    decimal TotalEarning,
    decimal Deduction,
    decimal NetPayable);

public sealed record ProcessDailyPayrollRequest(Guid CompanyId, DateOnly Date, Guid? ProcessedBy, int? DepartmentId = null);

public sealed record ProcessDailyPayrollResultDto(int ProcessedCount, int SkippedCount, string Message);

public sealed record ProcessFestivalBonusRequest(
    Guid CompanyId,
    int YearNo,
    int MonthNo,
    string BonusType,
    decimal Percentage,
    string BaseOn);

public sealed record FestivalBonusProcessResultDto(int ProcessedCount, int SkippedCount, decimal TotalAmount, string Message);

public sealed record PayrollBonusRowDto(
    Guid Id,
    Guid EmployeeId,
    string? EmployeeName,
    string BonusType,
    decimal Amount,
    int YearNo,
    int MonthNo,
    string Status);

public sealed record CreatePayrollBonusRequest(
    Guid CompanyId,
    Guid EmployeeId,
    int YearNo,
    int MonthNo,
    string BonusType,
    decimal Amount);

public sealed record FestivalBonusBankSheetRowDto(
    Guid EmployeeId,
    string? EmployeeName,
    string? BankAccountNo,
    string? BankName,
    decimal NetPayable);
