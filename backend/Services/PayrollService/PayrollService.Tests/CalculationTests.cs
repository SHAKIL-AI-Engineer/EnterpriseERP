using Microsoft.EntityFrameworkCore;
using PayrollService.Application;
using PayrollService.Application.Handlers;
using PayrollService.Contracts;
using PayrollService.Domain.Entities;
using PayrollService.Domain.Enums;
using PayrollService.Infrastructure.Persistence;
using PayrollService.Infrastructure.Services;
using Xunit;

namespace PayrollService.Tests;

public sealed class CalculationTests
{
    private static PayrollCalculationSettings FullComplianceSettings() =>
        SalaryProcessingModeProfiles.ForMode(SalaryProcessingMode.FullCompliance);

    private static PayrollCalculationSettings NonComplianceSettings() =>
        SalaryProcessingModeProfiles.ForMode(SalaryProcessingMode.NonCompliance, "None");

    [Fact]
    public void Overtime_Uses_Garments_BasicSalary_Formula()
    {
        var service = new OvertimeCalculationService();
        var settings = FullComplianceSettings() with { AllowOvertime = true, OvertimeCalculationType = "BasicSalaryBased" };
        var salary = new EmployeeSalary { BasicSalary = 20800, GrossSalary = 30000 };

        var result = service.Calculate(settings, salary, 10);

        Assert.Equal(200, result.RatePerHour);
        Assert.Equal(2000, result.Amount);
    }

    [Fact]
    public void Bonus_Uses_Job_Age_Bands()
    {
        var service = new BonusCalculationService();

        Assert.Equal(15000, service.CalculateFestivalBonus(30000, new DateOnly(2025, 1, 1), new DateOnly(2026, 5, 1)));
        Assert.Equal(7500, service.CalculateFestivalBonus(30000, new DateOnly(2025, 10, 1), new DateOnly(2026, 5, 1)));
        Assert.Equal(0, service.CalculateFestivalBonus(30000, new DateOnly(2026, 1, 1), new DateOnly(2026, 5, 1)));
    }

    [Fact]
    public void FullCompliance_Monthly_FixedDays_Salary_Calculates_Deductions_And_Net()
    {
        var service = new PayrollCalculationService(new OvertimeCalculationService(), new BonusCalculationService());
        var settings = FullComplianceSettings() with
        {
            AllowOvertime = true,
            AllowAbsentDeduction = true,
            AllowTiffinBill = true,
            AllowNightBill = true,
            AllowAttendanceBonus = true,
        };
        var salary = new EmployeeSalary { GrossSalary = 30000, BasicSalary = 15600 };
        var attendance = new AttendanceSummary(Guid.NewGuid(), Guid.NewGuid(), 2026, 5, true, 31, 26, 25, 1, 0, 0, 0, 0, 0, 120, 2, 2, 1, 0);

        var result = service.Calculate(settings, salary, attendance, new PayrollCalculationInputs());

        Assert.Equal(520, result.AbsentDeduction);
        Assert.Equal(300, result.OvertimeAmount);
        Assert.Equal(100, result.TiffinBillAmount);
        Assert.Equal(100, result.NightBillAmount);
        Assert.Equal(29980, result.TotalEarnings);
        Assert.Equal(520, result.TotalDeduction);
        Assert.Equal(29460, result.NetSalary);
    }

    [Fact]
    public void NonCompliance_Pays_Full_Gross_Without_Absent_Deduction()
    {
        var service = new PayrollCalculationService(new OvertimeCalculationService(), new BonusCalculationService());
        var settings = NonComplianceSettings();
        var salary = new EmployeeSalary { GrossSalary = 30000, BasicSalary = 15600 };
        var attendance = SalaryProcessingModeProfiles.SyntheticFullMonthAttendance(Guid.NewGuid(), Guid.NewGuid(), 2026, 5);
        attendance = attendance with { AbsentDays = 5, LateDays = 3 };

        var result = service.Calculate(settings, salary, attendance, new PayrollCalculationInputs());

        Assert.Equal(0, result.AbsentDeduction);
        Assert.Equal(0, result.LateDeduction);
        Assert.Equal(0, result.OvertimeAmount);
        Assert.Equal(30000, result.NetSalary);
    }

    [Fact]
    public void Daily_Salary_Uses_Present_Days()
    {
        var service = new PayrollCalculationService(new OvertimeCalculationService(), new BonusCalculationService());
        var settings = SalaryProcessingModeProfiles.ForMode(SalaryProcessingMode.MultiSalaryOt);
        var salary = new EmployeeSalary { GrossSalary = 30000, BasicSalary = 15600, SalaryCalculationType = "Daily" };
        var attendance = new AttendanceSummary(Guid.NewGuid(), Guid.NewGuid(), 2026, 5, true, 30, 26, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);

        var result = service.Calculate(settings, salary, attendance, new PayrollCalculationInputs(), "Daily");

        Assert.Equal(20000, result.PayableSalary);
        Assert.Equal(20000, result.NetSalary);
    }

    [Fact]
    public void Hourly_Salary_Includes_Overtime_From_Settings()
    {
        var service = new PayrollCalculationService(new OvertimeCalculationService(), new BonusCalculationService());
        var settings = SalaryProcessingModeProfiles.ForMode(SalaryProcessingMode.MultiSalaryOt, "BasicSalaryBased");
        var salary = new EmployeeSalary { GrossSalary = 30000, BasicSalary = 20800, SalaryCalculationType = "Hourly" };
        var attendance = new AttendanceSummary(Guid.NewGuid(), Guid.NewGuid(), 2026, 5, true, 30, 26, 20, 0, 0, 0, 0, 0, 0, 120, 2, 0, 0, 0);

        var result = service.Calculate(settings, salary, attendance, new PayrollCalculationInputs(), "Hourly");

        Assert.True(result.OvertimeAmount > 0);
        Assert.True(result.NetSalary > result.PayableSalary);
    }
}

public sealed class PayrollProcessIntegrationTests
{
    [Fact]
    public async Task ProcessPayroll_Creates_EmployeePayroll_Earnings_Deductions_And_Run()
    {
        var options = new DbContextOptionsBuilder<PayrollDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        await using var db = new PayrollDbContext(options);
        var companyId = Guid.NewGuid();
        var employeeId = Guid.NewGuid();
        SeedCompliancePolicy(db, companyId);
        db.EmployeeSalaries.Add(new EmployeeSalary
        {
            CompanyId = companyId,
            EmployeeId = employeeId,
            GrossSalary = 30000,
            BasicSalary = 15600,
            EffectiveFrom = new DateOnly(2026, 1, 1),
            IsCurrent = true,
        });
        await db.SaveChangesAsync();

        var handler = CreateHandler(
            db,
            new FakeEmployeeClient(employeeId, companyId),
            new FakeAttendanceClient(companyId, employeeId),
            new FakeLeaveClient(),
            new FakePublisher());

        var response = await handler.Handle(
            new ProcessPayrollCommand(new ProcessPayrollRequest(companyId, 2026, 5, null)),
            CancellationToken.None);

        Assert.True(response.Success);
        Assert.Single(db.PayrollRuns);
        var run = db.PayrollRuns.Single();
        Assert.Equal(2026, run.YearNo);
        Assert.Equal(5, run.MonthNo);
        Assert.Equal("FullCompliance", run.ProcessingMode);
        Assert.Equal("BDT_COMPLIANCE_V1", run.AppliedPolicyCode);
        Assert.Single(db.EmployeePayrolls);
        Assert.NotEmpty(db.PayrollEarnings);
    }

    [Fact]
    public async Task NonCompliance_Skips_Attendance_Approval_Check()
    {
        var options = new DbContextOptionsBuilder<PayrollDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        await using var db = new PayrollDbContext(options);
        var companyId = Guid.NewGuid();
        var employeeId = Guid.NewGuid();
        SeedNonCompliancePolicy(db, companyId);
        db.EmployeeSalaries.Add(new EmployeeSalary
        {
            CompanyId = companyId,
            EmployeeId = employeeId,
            GrossSalary = 25000,
            BasicSalary = 13000,
            EffectiveFrom = new DateOnly(2026, 1, 1),
            IsCurrent = true,
        });
        await db.SaveChangesAsync();

        var handler = CreateHandler(
            db,
            new FakeEmployeeClient(employeeId, companyId),
            new FakeAttendanceClient(companyId, employeeId, monthlyApproved: false),
            new FakeLeaveClient(),
            new FakePublisher());

        var response = await handler.Handle(
            new ProcessPayrollCommand(new ProcessPayrollRequest(companyId, 2026, 5, null)),
            CancellationToken.None);

        Assert.True(response.Success);
        Assert.True(db.EmployeePayrolls.Single().NetSalary > 0);
    }

    private static void SeedCompliancePolicy(PayrollDbContext db, Guid companyId)
    {
        foreach (var template in PayrollPolicyTemplateSeed.CreateTemplates())
        {
            db.PayrollPolicyTemplates.Add(template);
        }

        db.CompanyPayrollPolicyAssignments.Add(new CompanyPayrollPolicyAssignment
        {
            CompanyId = companyId,
            PolicyTemplateId = PayrollPolicyTemplateSeed.ComplianceId,
            EffectiveFrom = new DateOnly(2026, 1, 1),
            IsActive = true,
        });
    }

    private static void SeedNonCompliancePolicy(PayrollDbContext db, Guid companyId)
    {
        foreach (var template in PayrollPolicyTemplateSeed.CreateTemplates())
        {
            db.PayrollPolicyTemplates.Add(template);
        }

        db.CompanyPayrollPolicyAssignments.Add(new CompanyPayrollPolicyAssignment
        {
            CompanyId = companyId,
            PolicyTemplateId = PayrollPolicyTemplateSeed.NonComplianceGrossOtId,
            EffectiveFrom = new DateOnly(2026, 1, 1),
            IsActive = true,
        });
    }

    private static ProcessPayrollHandler CreateHandler(
        PayrollDbContext db,
        IEmployeeServiceClient employeeClient,
        IAttendanceServiceClient attendanceClient,
        ILeaveServiceClient leaveClient,
        IIntegrationEventPublisher publisher) =>
        new(
            db,
            new PolicyResolver(db),
            new SalaryStructureCalculator(),
            new PayrollCalculationService(new OvertimeCalculationService(), new BonusCalculationService()),
            new SalaryAdvanceService(db),
            employeeClient,
            attendanceClient,
            leaveClient,
            publisher);

    private sealed class FakeEmployeeClient(Guid employeeId, Guid configuredCompanyId) : IEmployeeServiceClient
    {
        public Task<IReadOnlyList<EmployeeSnapshot>> GetActiveEmployeesAsync(Guid companyId, CancellationToken cancellationToken = default) =>
            Task.FromResult<IReadOnlyList<EmployeeSnapshot>>([new EmployeeSnapshot(employeeId, configuredCompanyId, new DateOnly(2025, 1, 1), true, "001", "ERP Bank")]);

        public Task<EmployeeSnapshot?> GetEmployeeByIdAsync(Guid companyId, Guid employeeId, CancellationToken cancellationToken = default) =>
            Task.FromResult<EmployeeSnapshot?>(new EmployeeSnapshot(employeeId, companyId, new DateOnly(2025, 1, 1), true));

        public Task<DateOnly?> GetEmployeeJoinDateAsync(Guid companyId, Guid employeeId, CancellationToken cancellationToken = default) =>
            Task.FromResult<DateOnly?>(new DateOnly(2025, 1, 1));

        public Task<IReadOnlyList<EmployeeSnapshot>> GetResignedEmployeesAsync(Guid companyId, int year, int month, CancellationToken cancellationToken = default) =>
            Task.FromResult<IReadOnlyList<EmployeeSnapshot>>(Array.Empty<EmployeeSnapshot>());

        public Task<EmployeeSalary?> TryResolveHrSalaryAsync(
            Guid companyId,
            Guid employeeId,
            DateOnly periodStart,
            DateOnly periodEnd,
            CancellationToken cancellationToken = default) =>
            Task.FromResult<EmployeeSalary?>(null);
    }

    private sealed class FakeAttendanceClient(Guid configuredCompanyId, Guid configuredEmployeeId, bool monthlyApproved = true) : IAttendanceServiceClient
    {
        public Task<AttendanceSummary?> GetApprovedMonthlySummaryAsync(Guid companyId, Guid employeeId, int year, int month, CancellationToken cancellationToken = default) =>
            Task.FromResult<AttendanceSummary?>(new AttendanceSummary(configuredCompanyId, configuredEmployeeId, year, month, true, 31, 26, 26, 0, 0, 0, 0, 0, 0, 120, 2, 2, 1, 0));

        public Task<bool> IsMonthlyAttendanceApprovedAsync(Guid companyId, int year, int month, CancellationToken cancellationToken = default) =>
            Task.FromResult(monthlyApproved);
    }

    private sealed class FakeLeaveClient : ILeaveServiceClient
    {
        public Task<decimal> GetApprovedLeaveEncashmentAsync(Guid companyId, Guid employeeId, int year, int month, CancellationToken cancellationToken = default) =>
            Task.FromResult(0m);
    }

    private sealed class FakePublisher : IIntegrationEventPublisher
    {
        public Task PublishAsync<TEvent>(TEvent integrationEvent, CancellationToken cancellationToken = default) where TEvent : IntegrationEvent =>
            Task.CompletedTask;
    }
}
