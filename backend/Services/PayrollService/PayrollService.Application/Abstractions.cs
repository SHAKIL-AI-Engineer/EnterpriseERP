using PayrollService.Contracts;
using PayrollService.Domain.Entities;

namespace PayrollService.Application;

public interface IPayrollDbContext
{
    IQueryable<SalaryStructure> SalaryStructures { get; }
    IQueryable<SalaryStructureComponent> SalaryStructureComponents { get; }
    IQueryable<EmployeeSalary> EmployeeSalaries { get; }
    IQueryable<SalaryIncrementRequestEntity> SalaryIncrementRequests { get; }
    IQueryable<PayrollRun> PayrollRuns { get; }
    IQueryable<EmployeePayroll> EmployeePayrolls { get; }
    IQueryable<PayrollEarning> PayrollEarnings { get; }
    IQueryable<PayrollDeduction> PayrollDeductions { get; }
    IQueryable<SalaryAdvance> SalaryAdvances { get; }
    IQueryable<SalaryAdvanceInstallment> SalaryAdvanceInstallments { get; }
    IQueryable<AllowanceBill> AllowanceBills { get; }
    IQueryable<FinalSettlement> FinalSettlements { get; }
    IQueryable<PayrollDeductionEntry> PayrollDeductionEntries { get; }
    IQueryable<PayrollPolicyTemplate> PayrollPolicyTemplates { get; }
    IQueryable<CompanyPayrollPolicyAssignment> CompanyPayrollPolicyAssignments { get; }
    IQueryable<PayrollAuditLog> PayrollAuditLogs { get; }

    void Add<TEntity>(TEntity entity) where TEntity : class;
    void Remove<TEntity>(TEntity entity) where TEntity : class;
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}

public interface IRedisCacheService
{
    Task<T?> GetAsync<T>(string key, CancellationToken cancellationToken = default);
    Task SetAsync<T>(string key, T value, TimeSpan expiration, CancellationToken cancellationToken = default);
    Task RemoveAsync(string key, CancellationToken cancellationToken = default);
}

public interface IIntegrationEventPublisher
{
    Task PublishAsync<TEvent>(TEvent integrationEvent, CancellationToken cancellationToken = default) where TEvent : IntegrationEvent;
}

public interface IEmployeeServiceClient
{
    Task<IReadOnlyList<EmployeeSnapshot>> GetActiveEmployeesAsync(Guid companyId, CancellationToken cancellationToken = default);
    Task<EmployeeSnapshot?> GetEmployeeByIdAsync(Guid companyId, Guid employeeId, CancellationToken cancellationToken = default);
    Task<DateOnly?> GetEmployeeJoinDateAsync(Guid companyId, Guid employeeId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<EmployeeSnapshot>> GetResignedEmployeesAsync(Guid companyId, int year, int month, CancellationToken cancellationToken = default);
    Task<EmployeeSalary?> TryResolveHrSalaryAsync(
        Guid companyId,
        Guid employeeId,
        DateOnly periodStart,
        DateOnly periodEnd,
        CancellationToken cancellationToken = default);
}

public interface IAttendanceServiceClient
{
    Task<AttendanceSummary?> GetApprovedMonthlySummaryAsync(Guid companyId, Guid employeeId, int year, int month, CancellationToken cancellationToken = default);
    Task<bool> IsMonthlyAttendanceApprovedAsync(Guid companyId, int year, int month, CancellationToken cancellationToken = default);
}

public interface ILeaveServiceClient
{
    Task<decimal> GetApprovedLeaveEncashmentAsync(Guid companyId, Guid employeeId, int year, int month, CancellationToken cancellationToken = default);
}

public interface ICompanyServiceClient
{
    Task<CompanySnapshot?> GetCompanyAsync(Guid companyId, CancellationToken cancellationToken = default);
}

public interface INotificationServiceClient
{
    Task SendPayrollApprovalNotificationAsync(Guid companyId, Guid payrollPeriodId, CancellationToken cancellationToken = default);
    Task SendPayslipNotificationAsync(Guid companyId, Guid employeeId, Guid payrollPeriodId, CancellationToken cancellationToken = default);
}

public sealed record EmployeeSnapshot(
    Guid EmployeeId,
    Guid CompanyId,
    DateOnly JoinDate,
    bool IsActive,
    string? BankAccountNo = null,
    string? BankName = null,
    string? EmployeeCode = null,
    string? EmployeeName = null,
    int? DepartmentId = null,
    string? DepartmentName = null,
    int? SectionId = null,
    string? SectionName = null,
    int? DesignationId = null,
    string? DesignationName = null,
    int? LineId = null,
    string? LineName = null,
    bool IsOtEnabled = true);

public sealed record AttendanceSummary(
    Guid CompanyId,
    Guid EmployeeId,
    int YearNo,
    int MonthNo,
    bool IsApproved,
    decimal TotalDays,
    decimal WorkingDays,
    decimal PresentDays,
    decimal AbsentDays,
    decimal LeaveDays,
    decimal LeaveWithoutPayDays,
    decimal LateDays,
    decimal HolidayPresentDays,
    decimal WeeklyOffPresentDays,
    int OvertimeMinutes,
    int OvertimeHours,
    decimal ApprovedTiffinDays,
    decimal ApprovedNightDutyDays,
    decimal MissingPunchDays);

public sealed record CompanySnapshot(Guid CompanyId, string CompanyCode, string CompanyName);

public interface IPolicyResolver
{
    Task<ResolvedPayrollPolicy?> TryResolveAsync(Guid companyId, DateOnly processDate, CancellationToken cancellationToken = default);
    Task<ResolvedPayrollPolicy> ResolveRequiredAsync(Guid companyId, DateOnly processDate, CancellationToken cancellationToken = default);
}

public interface ISalaryStructureCalculator
{
    SalaryStructureResult Calculate(decimal grossSalary, PayrollPolicyTemplate template);
}

public interface IOvertimeCalculationService
{
    (decimal RatePerHour, decimal Amount) Calculate(PayrollCalculationSettings settings, EmployeeSalary salary, decimal overtimeHours, decimal fixedRate = 0);
}

public interface IBonusCalculationService
{
    decimal CalculateAttendanceBonus(PayrollCalculationSettings settings, AttendanceSummary attendance, decimal configuredAmount, decimal allowedLateLimit);
    decimal CalculateFestivalBonus(decimal grossSalary, DateOnly joinDate, DateOnly bonusDate);
}

public interface IPayrollCalculationService
{
    PayrollCalculationResult Calculate(
        PayrollCalculationSettings settings,
        EmployeeSalary salary,
        AttendanceSummary attendance,
        PayrollCalculationInputs inputs,
        string? salaryCalculationTypeOverride = null);
}

public interface ISalaryAdvanceService
{
    Task<decimal> GetDeductibleInstallmentAsync(Guid companyId, Guid employeeId, int year, int month, CancellationToken cancellationToken = default);
    Task MarkInstallmentDeductedAsync(Guid companyId, Guid employeeId, int year, int month, Guid employeePayrollId, CancellationToken cancellationToken = default);
}

public interface ISalaryIncrementService
{
    Task ApproveAsync(Guid id, Guid approvedBy, CancellationToken cancellationToken = default);
}

public interface IFinalSettlementService
{
    decimal CalculateNetPayable(FinalSettlement settlement);
}

public sealed record PayrollCalculationInputs(decimal AttendanceBonusAmount = 500, decimal AllowedLateLimit = 0, decimal TiffinRate = 50, decimal NightBillRate = 100, decimal EarnLeaveEncashmentAmount = 0, decimal AdvanceDeduction = 0, decimal LoanDeduction = 0, decimal TaxDeduction = 0, decimal ProvidentFundDeduction = 0, decimal OtherDeduction = 0);

public sealed record PayrollCalculationResult(
    decimal TotalDays,
    decimal PerDaySalary,
    decimal PayableSalary,
    decimal AbsentDeduction,
    decimal LateDeduction,
    decimal OvertimeHours,
    decimal OvertimeRate,
    decimal OvertimeAmount,
    decimal TiffinBillAmount,
    decimal NightBillAmount,
    decimal AttendanceBonusAmount,
    decimal EarnLeaveEncashmentAmount,
    decimal TotalEarnings,
    decimal TotalDeduction,
    decimal NetSalary);
