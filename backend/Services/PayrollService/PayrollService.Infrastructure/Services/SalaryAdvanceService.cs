using PayrollService.Application;
using PayrollService.Infrastructure.Persistence;

namespace PayrollService.Infrastructure.Services;

public sealed class SalaryAdvanceService(PayrollDbContext db) : ISalaryAdvanceService
{
    public Task<decimal> GetDeductibleInstallmentAsync(Guid companyId, Guid employeeId, int year, int month, CancellationToken cancellationToken = default)
    {
        var amount = db.SalaryAdvanceInstallments
            .Where(x => x.CompanyId == companyId && x.EmployeeId == employeeId && x.YearNo == year && x.MonthNo == month && x.Status == "Pending")
            .Sum(x => x.InstallmentAmount);
        return Task.FromResult(amount);
    }

    public Task MarkInstallmentDeductedAsync(Guid companyId, Guid employeeId, int year, int month, Guid employeePayrollId, CancellationToken cancellationToken = default)
    {
        foreach (var installment in db.SalaryAdvanceInstallments.Where(x => x.CompanyId == companyId && x.EmployeeId == employeeId && x.YearNo == year && x.MonthNo == month && x.Status == "Pending"))
        {
            installment.Status = "Deducted";
            installment.PaidAmount = installment.InstallmentAmount;
            installment.EmployeePayrollId = employeePayrollId;
        }

        return Task.CompletedTask;
    }
}
