using MediatR;
using PayrollService.Contracts;
using PayrollService.Domain.Entities;

namespace PayrollService.Application.Handlers;

public sealed class PayrollQueryHandlers(IPayrollDbContext db, IEmployeeServiceClient employeeServiceClient) :
    IRequestHandler<GetEmployeePayrollQuery, ApiResponse<IReadOnlyList<EmployeePayrollDto>>>,
    IRequestHandler<GetSalarySheetQuery, ApiResponse<IReadOnlyList<SalarySheetRowDto>>>,
    IRequestHandler<GetPayslipQuery, ApiResponse<PayslipDto>>,
    IRequestHandler<GetBankSheetQuery, ApiResponse<IReadOnlyList<BankSheetRowDto>>>,
    IRequestHandler<GetPayrollSummaryQuery, ApiResponse<PayrollSummaryDto>>,
    IRequestHandler<GetPayrollSummaryBreakdownQuery, ApiResponse<PayrollSummaryBreakdownDto>>,
    IRequestHandler<GeneratePayslipCommand, ApiResponse<PayslipDto>>
{
    public async Task<ApiResponse<IReadOnlyList<EmployeePayrollDto>>> Handle(
        GetEmployeePayrollQuery query,
        CancellationToken cancellationToken)
    {
        var employees = await employeeServiceClient.GetActiveEmployeesAsync(query.CompanyId, cancellationToken);
        var employeeMap = employees.ToDictionary(x => x.EmployeeId);

        var rows = db.EmployeePayrolls
            .Where(x => x.CompanyId == query.CompanyId && x.YearNo == query.YearNo && x.MonthNo == query.MonthNo &&
                        (!query.EmployeeId.HasValue || x.EmployeeId == query.EmployeeId))
            .ToList()
            .Where(x =>
            {
                employeeMap.TryGetValue(x.EmployeeId, out var employee);
                if (!string.IsNullOrWhiteSpace(query.Status) &&
                    !string.Equals(x.Status, query.Status, StringComparison.OrdinalIgnoreCase))
                {
                    return false;
                }

                return PayrollEnrichmentHelper.MatchesEmployeeFilter(
                    employee,
                    query.DepartmentId,
                    query.SectionId,
                    query.DesignationId,
                    query.LineId,
                    query.SearchTerm);
            })
            .Select(ToPayrollDto)
            .ToList();

        return ApiResponse<IReadOnlyList<EmployeePayrollDto>>.Ok(rows);
    }

    public async Task<ApiResponse<IReadOnlyList<SalarySheetRowDto>>> Handle(
        GetSalarySheetQuery query,
        CancellationToken cancellationToken)
    {
        var employees = await employeeServiceClient.GetActiveEmployeesAsync(query.CompanyId, cancellationToken);
        var employeeMap = employees.ToDictionary(x => x.EmployeeId);

        var result = db.EmployeePayrolls
            .Where(x => x.CompanyId == query.CompanyId && x.YearNo == query.YearNo && x.MonthNo == query.MonthNo)
            .OrderBy(x => x.EmployeeId)
            .ToList()
            .Where(x =>
            {
                employeeMap.TryGetValue(x.EmployeeId, out var employee);
                if (!string.IsNullOrWhiteSpace(query.Status) &&
                    !string.Equals(x.Status, query.Status, StringComparison.OrdinalIgnoreCase))
                {
                    return false;
                }

                return PayrollEnrichmentHelper.MatchesEmployeeFilter(
                    employee,
                    query.DepartmentId,
                    query.SectionId,
                    query.DesignationId,
                    query.LineId,
                    query.SearchTerm);
            })
            .Select(x =>
            {
                employeeMap.TryGetValue(x.EmployeeId, out var employee);
                return PayrollEnrichmentHelper.ToSalarySheetRow(x, employee);
            })
            .ToList();

        return ApiResponse<IReadOnlyList<SalarySheetRowDto>>.Ok(result);
    }

    public Task<ApiResponse<PayslipDto>> Handle(GetPayslipQuery query, CancellationToken cancellationToken) =>
        GetPayslipAsync(query.CompanyId, query.YearNo, query.MonthNo, query.EmployeeId, cancellationToken);

    public Task<ApiResponse<PayslipDto>> Handle(GeneratePayslipCommand command, CancellationToken cancellationToken) =>
        GetPayslipAsync(command.CompanyId, command.YearNo, command.MonthNo, command.EmployeeId, cancellationToken);

    public async Task<ApiResponse<IReadOnlyList<BankSheetRowDto>>> Handle(
        GetBankSheetQuery query,
        CancellationToken cancellationToken)
    {
        var employees = await employeeServiceClient.GetActiveEmployeesAsync(query.CompanyId, cancellationToken);
        var result = db.EmployeePayrolls
            .Where(x => x.CompanyId == query.CompanyId && x.YearNo == query.YearNo && x.MonthNo == query.MonthNo)
            .ToList()
            .Select(x =>
            {
                var employee = employees.FirstOrDefault(e => e.EmployeeId == x.EmployeeId);
                return new BankSheetRowDto(
                    x.EmployeeId,
                    employee?.BankAccountNo ?? string.Empty,
                    employee?.BankName ?? string.Empty,
                    x.NetSalary);
            })
            .ToList();
        return ApiResponse<IReadOnlyList<BankSheetRowDto>>.Ok(result);
    }

    public Task<ApiResponse<PayrollSummaryDto>> Handle(GetPayrollSummaryQuery query, CancellationToken cancellationToken)
    {
        var rows = db.EmployeePayrolls
            .Where(x => x.CompanyId == query.CompanyId && x.YearNo == query.YearNo && x.MonthNo == query.MonthNo)
            .ToList();
        var summary = new PayrollSummaryDto(
            query.CompanyId,
            query.YearNo,
            query.MonthNo,
            rows.Count,
            rows.Sum(x => x.GrossSalary),
            rows.Sum(x => x.TotalEarnings),
            rows.Sum(x => x.TotalDeduction),
            rows.Sum(x => x.NetSalary),
            rows.Count > 0 ? "Processed" : "Open");
        return Task.FromResult(ApiResponse<PayrollSummaryDto>.Ok(summary));
    }

    public async Task<ApiResponse<PayrollSummaryBreakdownDto>> Handle(
        GetPayrollSummaryBreakdownQuery query,
        CancellationToken cancellationToken)
    {
        var employees = await employeeServiceClient.GetActiveEmployeesAsync(query.CompanyId, cancellationToken);
        var employeeMap = employees.ToDictionary(x => x.EmployeeId);
        var payrollRows = db.EmployeePayrolls
            .Where(x => x.CompanyId == query.CompanyId && x.YearNo == query.YearNo && x.MonthNo == query.MonthNo)
            .ToList();
        var joined = payrollRows
            .Select(p =>
            {
                employeeMap.TryGetValue(p.EmployeeId, out var employee);
                return (Payroll: p, Employee: employee);
            })
            .ToList();

        var summary = new PayrollSummaryDto(
            query.CompanyId,
            query.YearNo,
            query.MonthNo,
            payrollRows.Count,
            payrollRows.Sum(x => x.GrossSalary),
            payrollRows.Sum(x => x.TotalEarnings),
            payrollRows.Sum(x => x.TotalDeduction),
            payrollRows.Sum(x => x.NetSalary),
            payrollRows.Count > 0 ? "Processed" : "Open");

        var breakdown = new PayrollSummaryBreakdownDto(
            summary,
            PayrollEnrichmentHelper.GroupBy(joined, e => e?.DepartmentName),
            PayrollEnrichmentHelper.GroupBy(joined, e => e?.SectionName),
            PayrollEnrichmentHelper.GroupBy(joined, e => e?.LineName),
            PayrollEnrichmentHelper.GroupBy(joined, e => e?.DesignationName));

        return ApiResponse<PayrollSummaryBreakdownDto>.Ok(breakdown);
    }

    private Task<ApiResponse<PayslipDto>> GetPayslipAsync(
        Guid companyId,
        int yearNo,
        int monthNo,
        Guid employeeId,
        CancellationToken cancellationToken)
    {
        var payroll = db.EmployeePayrolls.FirstOrDefault(x =>
            x.CompanyId == companyId && x.YearNo == yearNo && x.MonthNo == monthNo && x.EmployeeId == employeeId);
        if (payroll is null)
        {
            return Task.FromResult(ApiResponse<PayslipDto>.Fail("Payslip not found."));
        }

        var rows = db.EmployeePayrolls
            .Where(x => x.CompanyId == companyId && x.YearNo == yearNo && x.MonthNo == monthNo)
            .ToList();
        var summary = new PayrollSummaryDto(
            companyId,
            yearNo,
            monthNo,
            rows.Count,
            rows.Sum(x => x.GrossSalary),
            rows.Sum(x => x.TotalEarnings),
            rows.Sum(x => x.TotalDeduction),
            rows.Sum(x => x.NetSalary),
            "Processed");
        return Task.FromResult(ApiResponse<PayslipDto>.Ok(new PayslipDto(ToPayrollDto(payroll), summary)));
    }

    private EmployeePayrollDto ToPayrollDto(EmployeePayroll payroll)
    {
        var earnings = db.PayrollEarnings.Where(x => x.EmployeePayrollId == payroll.Id).ToList();
        var deductions = db.PayrollDeductions.Where(x => x.EmployeePayrollId == payroll.Id).ToList();
        return payroll.ToDto(earnings, deductions);
    }
}
