using MediatR;
using PayrollService.Contracts;
using PayrollService.Domain.Enums;

namespace PayrollService.Application;

public sealed record CreateSalaryStructureCommand(CreateSalaryStructureRequest Request) : IRequest<ApiResponse<SalaryStructureDto>>;
public sealed record AddSalaryStructureComponentCommand(Guid SalaryStructureId, CreateSalaryStructureComponentRequest Request) : IRequest<ApiResponse<SalaryStructureComponentDto>>;

public sealed record AssignEmployeeSalaryCommand(EmployeeSalaryRequest Request) : IRequest<ApiResponse<EmployeeSalaryDto>>;
public sealed record CreateSalaryIncrementCommand(SalaryIncrementRequest Request) : IRequest<ApiResponse<SalaryIncrementDto>>;
public sealed record ApproveSalaryIncrementCommand(Guid Id, Guid ApprovedBy) : IRequest<ApiResponse<SalaryIncrementDto>>;
public sealed record RejectSalaryIncrementCommand(Guid Id, Guid RejectedBy, string? Remarks) : IRequest<ApiResponse<SalaryIncrementDto>>;

public sealed record ProcessPayrollCommand(ProcessPayrollRequest Request) : IRequest<ApiResponse<PayrollSummaryDto>>;
public sealed record ReprocessPayrollCommand(ProcessPayrollRequest Request) : IRequest<ApiResponse<PayrollSummaryDto>>;

public sealed record CreateSalaryAdvanceCommand(SalaryAdvanceRequest Request) : IRequest<ApiResponse<SalaryAdvanceDto>>;
public sealed record ApproveSalaryAdvanceCommand(Guid Id, Guid ApprovedBy) : IRequest<ApiResponse<SalaryAdvanceDto>>;
public sealed record RejectSalaryAdvanceCommand(Guid Id, Guid RejectedBy, string? Remarks) : IRequest<ApiResponse<SalaryAdvanceDto>>;

public sealed record CreateAllowanceBillCommand(AllowanceBillRequest Request) : IRequest<ApiResponse<AllowanceBillDto>>;
public sealed record ApproveAllowanceBillCommand(Guid Id, Guid ApprovedBy) : IRequest<ApiResponse<AllowanceBillDto>>;
public sealed record RejectAllowanceBillCommand(Guid Id, Guid RejectedBy, string? Remarks) : IRequest<ApiResponse<AllowanceBillDto>>;

public sealed record CreateDeductionCommand(CreateDeductionRequest Request) : IRequest<ApiResponse<DeductionDto>>;
public sealed record GeneratePayslipCommand(Guid CompanyId, int YearNo, int MonthNo, Guid EmployeeId) : IRequest<ApiResponse<PayslipDto>>;
public sealed record GenerateFinalSettlementCommand(FinalSettlementRequest Request) : IRequest<ApiResponse<FinalSettlementDto>>;
public sealed record ApproveFinalSettlementCommand(Guid Id, Guid ApprovedBy) : IRequest<ApiResponse<FinalSettlementDto>>;

public sealed record GetEmployeePayrollQuery(
    Guid CompanyId,
    int YearNo,
    int MonthNo,
    Guid? EmployeeId,
    int? DepartmentId = null,
    int? SectionId = null,
    int? DesignationId = null,
    int? LineId = null,
    string? Status = null,
    string? SearchTerm = null) : IRequest<ApiResponse<IReadOnlyList<EmployeePayrollDto>>>;

public sealed record GetSalarySheetQuery(
    Guid CompanyId,
    int YearNo,
    int MonthNo,
    int? DepartmentId = null,
    int? SectionId = null,
    int? DesignationId = null,
    int? LineId = null,
    string? Status = null,
    string? SearchTerm = null) : IRequest<ApiResponse<IReadOnlyList<SalarySheetRowDto>>>;

public sealed record GetPayrollSummaryBreakdownQuery(Guid CompanyId, int YearNo, int MonthNo) : IRequest<ApiResponse<PayrollSummaryBreakdownDto>>;
public sealed record GetPayslipQuery(Guid CompanyId, int YearNo, int MonthNo, Guid EmployeeId) : IRequest<ApiResponse<PayslipDto>>;
public sealed record GetBankSheetQuery(Guid CompanyId, int YearNo, int MonthNo) : IRequest<ApiResponse<IReadOnlyList<BankSheetRowDto>>>;
public sealed record GetPayrollSummaryQuery(Guid CompanyId, int YearNo, int MonthNo) : IRequest<ApiResponse<PayrollSummaryDto>>;
public sealed record GetSalaryAdvanceBalanceQuery(Guid CompanyId, Guid EmployeeId) : IRequest<ApiResponse<SalaryAdvanceBalanceDto>>;
public sealed record GetSalaryIncrementHistoryQuery(Guid CompanyId, Guid? EmployeeId) : IRequest<ApiResponse<IReadOnlyList<SalaryIncrementDto>>>;
public sealed record GetAllowanceBillsQuery(Guid CompanyId, Guid? EmployeeId, DateOnly? FromDate, DateOnly? ToDate) : IRequest<ApiResponse<IReadOnlyList<AllowanceBillDto>>>;
public sealed record GetDeductionHistoryQuery(Guid CompanyId, Guid? EmployeeId) : IRequest<ApiResponse<IReadOnlyList<DeductionDto>>>;
public sealed record GetFinalSettlementQuery(Guid CompanyId, Guid? EmployeeId) : IRequest<ApiResponse<IReadOnlyList<FinalSettlementDto>>>;
public sealed record GetSalaryStructuresQuery(Guid CompanyId) : IRequest<ApiResponse<IReadOnlyList<SalaryStructureDto>>>;
public sealed record GetSalaryStructureComponentsQuery(Guid SalaryStructureId) : IRequest<ApiResponse<IReadOnlyList<SalaryStructureComponentDto>>>;
public sealed record GetCurrentEmployeeSalaryQuery(Guid CompanyId, Guid EmployeeId) : IRequest<ApiResponse<EmployeeSalaryDto>>;
public sealed record GetEmployeeSalaryHistoryQuery(Guid CompanyId, Guid EmployeeId) : IRequest<ApiResponse<IReadOnlyList<EmployeeSalaryDto>>>;

public sealed record ListSalaryAdvancesQuery(Guid CompanyId, string? Status, int? Year, int? Month) : IRequest<ApiResponse<IReadOnlyList<SalaryAdvanceDto>>>;
public sealed record GetSalaryAdvanceSummaryQuery(Guid CompanyId, int? Year, int? Month) : IRequest<ApiResponse<SalaryAdvanceSummaryDto>>;
public sealed record BatchCreateSalaryAdvanceCommand(BatchSalaryAdvanceRequest Request) : IRequest<ApiResponse<IReadOnlyList<SalaryAdvanceDto>>>;
public sealed record BatchDeleteSalaryAdvanceCommand(BatchDeleteSalaryAdvanceRequest Request) : IRequest<ApiResponse<int>>;

public sealed record GetDailySalarySheetQuery(Guid CompanyId, DateOnly Date, int? DepartmentId, string? SearchTerm) : IRequest<ApiResponse<IReadOnlyList<DailySalarySheetRowDto>>>;
public sealed record ProcessDailyPayrollCommand(ProcessDailyPayrollRequest Request) : IRequest<ApiResponse<ProcessDailyPayrollResultDto>>;

public sealed record GetPayrollBonusesQuery(Guid CompanyId, int YearNo, int? MonthNo, string? BonusType) : IRequest<ApiResponse<IReadOnlyList<PayrollBonusRowDto>>>;
public sealed record CreatePayrollBonusCommand(CreatePayrollBonusRequest Request) : IRequest<ApiResponse<PayrollBonusRowDto>>;
public sealed record ProcessFestivalBonusCommand(ProcessFestivalBonusRequest Request) : IRequest<ApiResponse<FestivalBonusProcessResultDto>>;
public sealed record DeletePayrollBonusCommand(Guid EmployeePayrollId) : IRequest<ApiResponse<bool>>;
public sealed record GetFestivalBonusBankSheetQuery(Guid CompanyId, int YearNo, int MonthNo) : IRequest<ApiResponse<IReadOnlyList<FestivalBonusBankSheetRowDto>>>;

public sealed record GetPayrollPolicyTemplatesQuery() : IRequest<ApiResponse<IReadOnlyList<PayrollPolicyTemplateDto>>>;
public sealed record GetAdminCompanyPayrollPolicyQuery(Guid CompanyId) : IRequest<ApiResponse<CompanyPayrollPolicyAssignmentDto?>>;
public sealed record GetCompanyPayrollPolicySummaryQuery(Guid CompanyId) : IRequest<ApiResponse<CompanyPayrollPolicySummaryDto?>>;
public sealed record AssignCompanyPayrollPolicyCommand(AssignCompanyPayrollPolicyRequest Request) : IRequest<ApiResponse<CompanyPayrollPolicyAssignmentDto>>;
public sealed record TestPayrollPolicyCalculationQuery(string PolicyCode, PolicyTestCalculateRequest Request) : IRequest<ApiResponse<PolicyTestCalculateResultDto>>;
