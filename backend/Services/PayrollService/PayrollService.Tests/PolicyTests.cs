using PayrollService.Application;
using PayrollService.Domain.Entities;
using PayrollService.Infrastructure.Persistence;
using Xunit;

namespace PayrollService.Tests;

public sealed class SalaryStructureCalculatorTests
{
    private static PayrollPolicyTemplate ComplianceTemplate() =>
        PayrollPolicyTemplateSeed.CreateTemplates().First(x => x.PolicyCode == "BDT_COMPLIANCE_V1");

    [Fact]
    public void Calculate_Gross22000_MatchesComplianceStructure()
    {
        var calculator = new SalaryStructureCalculator();
        var result = calculator.Calculate(22000, ComplianceTemplate());

        Assert.Equal(13033.33m, result.BasicSalary);
        Assert.Equal(6516.67m, result.HouseRent);
        Assert.Equal(750m, result.MedicalAllowance);
        Assert.Equal(1250m, result.FoodAllowance);
        Assert.Equal(450m, result.ConveyanceAllowance);
        Assert.Equal(22000m, result.GrossSalary);
    }
}

public sealed class PolicyTemplateCalculationTests
{
    private static PayrollCalculationSettings ComplianceSettings() =>
        PolicyResolver.ToSettings(
            PayrollPolicyTemplateSeed.CreateTemplates().First(x => x.PolicyCode == "BDT_COMPLIANCE_V1"),
            new CompanyPayrollPolicyAssignment { CompanyId = Guid.NewGuid(), PolicyTemplateId = PayrollPolicyTemplateSeed.ComplianceId, EffectiveFrom = new DateOnly(2026, 1, 1), IsActive = true });

    private static PayrollCalculationSettings NonComplianceGrossOtSettings() =>
        PolicyResolver.ToSettings(
            PayrollPolicyTemplateSeed.CreateTemplates().First(x => x.PolicyCode == "BDT_NONCOMPLIANCE_GROSS_OT_V1"),
            new CompanyPayrollPolicyAssignment { CompanyId = Guid.NewGuid(), PolicyTemplateId = PayrollPolicyTemplateSeed.NonComplianceGrossOtId, EffectiveFrom = new DateOnly(2026, 1, 1), IsActive = true });

    [Fact]
    public void CompliancePolicy_OtAndAbsent_MatchGoldenValues()
    {
        var calculator = new SalaryStructureCalculator();
        var payrollCalculator = new PayrollCalculationService(new OvertimeCalculationService(), new BonusCalculationService());
        var template = PayrollPolicyTemplateSeed.CreateTemplates().First(x => x.PolicyCode == "BDT_COMPLIANCE_V1");
        var structure = calculator.Calculate(22000, template);
        var salary = new EmployeeSalary
        {
            GrossSalary = structure.GrossSalary,
            BasicSalary = structure.BasicSalary,
            HouseRent = structure.HouseRent,
            MedicalAllowance = structure.MedicalAllowance,
            FoodAllowance = structure.FoodAllowance,
            ConveyanceAllowance = structure.ConveyanceAllowance,
            SalaryCalculationType = "Monthly",
        };
        var attendance = new AttendanceSummary(
            Guid.NewGuid(), Guid.NewGuid(), 2026, 5, true, 31, 26, 25, 2, 0, 0, 0, 0, 0, 1800, 30, 0, 0, 0);

        var result = payrollCalculator.Calculate(ComplianceSettings(), salary, attendance, new PayrollCalculationInputs(), "Monthly");

        Assert.Equal(125.32m, result.OvertimeRate);
        Assert.Equal(3759.60m, result.OvertimeAmount);
        Assert.Equal(868.86m, result.AbsentDeduction);
    }

    [Fact]
    public void NonComplianceGrossOtPolicy_MatchesGoldenValues()
    {
        var calculator = new SalaryStructureCalculator();
        var payrollCalculator = new PayrollCalculationService(new OvertimeCalculationService(), new BonusCalculationService());
        var template = PayrollPolicyTemplateSeed.CreateTemplates().First(x => x.PolicyCode == "BDT_NONCOMPLIANCE_GROSS_OT_V1");
        var structure = calculator.Calculate(22000, template);
        var salary = new EmployeeSalary
        {
            GrossSalary = structure.GrossSalary,
            BasicSalary = structure.BasicSalary,
            HouseRent = structure.HouseRent,
            MedicalAllowance = structure.MedicalAllowance,
            FoodAllowance = structure.FoodAllowance,
            ConveyanceAllowance = structure.ConveyanceAllowance,
            SalaryCalculationType = "Monthly",
        };
        var attendance = new AttendanceSummary(
            Guid.NewGuid(), Guid.NewGuid(), 2026, 5, true, 31, 26, 25, 2, 0, 0, 0, 0, 0, 1800, 30, 0, 0, 0);

        var result = payrollCalculator.Calculate(NonComplianceGrossOtSettings(), salary, attendance, new PayrollCalculationInputs(), "Monthly");

        Assert.Equal(211.54m, result.OvertimeRate);
        Assert.Equal(6346.20m, result.OvertimeAmount);
        Assert.Equal(1419.36m, result.AbsentDeduction);
    }
}

public sealed class PolicyResolverTests
{
    [Fact]
    public async Task ResolveRequired_WithoutAssignment_Throws()
    {
        var db = new FakePayrollDbContext();
        var resolver = new PolicyResolver(db);

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            resolver.ResolveRequiredAsync(Guid.NewGuid(), new DateOnly(2026, 5, 1)));
    }
}

internal sealed class FakePayrollDbContext : IPayrollDbContext
{
    public IQueryable<SalaryStructure> SalaryStructures => Array.Empty<SalaryStructure>().AsQueryable();
    public IQueryable<SalaryStructureComponent> SalaryStructureComponents => Array.Empty<SalaryStructureComponent>().AsQueryable();
    public IQueryable<EmployeeSalary> EmployeeSalaries => Array.Empty<EmployeeSalary>().AsQueryable();
    public IQueryable<SalaryIncrementRequestEntity> SalaryIncrementRequests => Array.Empty<SalaryIncrementRequestEntity>().AsQueryable();
    public IQueryable<PayrollRun> PayrollRuns => Array.Empty<PayrollRun>().AsQueryable();
    public IQueryable<EmployeePayroll> EmployeePayrolls => Array.Empty<EmployeePayroll>().AsQueryable();
    public IQueryable<PayrollEarning> PayrollEarnings => Array.Empty<PayrollEarning>().AsQueryable();
    public IQueryable<PayrollDeduction> PayrollDeductions => Array.Empty<PayrollDeduction>().AsQueryable();
    public IQueryable<SalaryAdvance> SalaryAdvances => Array.Empty<SalaryAdvance>().AsQueryable();
    public IQueryable<SalaryAdvanceInstallment> SalaryAdvanceInstallments => Array.Empty<SalaryAdvanceInstallment>().AsQueryable();
    public IQueryable<AllowanceBill> AllowanceBills => Array.Empty<AllowanceBill>().AsQueryable();
    public IQueryable<FinalSettlement> FinalSettlements => Array.Empty<FinalSettlement>().AsQueryable();
    public IQueryable<PayrollDeductionEntry> PayrollDeductionEntries => Array.Empty<PayrollDeductionEntry>().AsQueryable();
    public IQueryable<PayrollPolicyTemplate> PayrollPolicyTemplates => Array.Empty<PayrollPolicyTemplate>().AsQueryable();
    public IQueryable<CompanyPayrollPolicyAssignment> CompanyPayrollPolicyAssignments => Array.Empty<CompanyPayrollPolicyAssignment>().AsQueryable();
    public IQueryable<PayrollAuditLog> PayrollAuditLogs => Array.Empty<PayrollAuditLog>().AsQueryable();

    public void Add<TEntity>(TEntity entity) where TEntity : class { }
    public void Remove<TEntity>(TEntity entity) where TEntity : class { }
    public Task<int> SaveChangesAsync(CancellationToken cancellationToken = default) => Task.FromResult(0);
}
