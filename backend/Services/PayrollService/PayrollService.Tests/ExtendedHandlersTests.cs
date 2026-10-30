using PayrollService.Application;
using PayrollService.Application.Handlers;
using PayrollService.Contracts;
using PayrollService.Domain.Entities;
using Xunit;

namespace PayrollService.Tests;

public sealed class ExtendedHandlersTests
{
    [Fact]
    public void PayrollEnrichmentHelper_GroupsByDepartment()
    {
        var employeeId = Guid.NewGuid();
        var rows = new List<(EmployeePayroll Payroll, EmployeeSnapshot? Employee)>
        {
            (new EmployeePayroll { GrossSalary = 100, OvertimeAmount = 10, TotalDeduction = 5, NetSalary = 95 }, new EmployeeSnapshot(employeeId, Guid.NewGuid(), DateOnly.FromDateTime(DateTime.UtcNow), true, DepartmentName: "Cutting")),
            (new EmployeePayroll { GrossSalary = 200, OvertimeAmount = 20, TotalDeduction = 10, NetSalary = 190 }, new EmployeeSnapshot(Guid.NewGuid(), Guid.NewGuid(), DateOnly.FromDateTime(DateTime.UtcNow), true, DepartmentName: "Sewing")),
        };

        var groups = PayrollEnrichmentHelper.GroupBy(rows, e => e?.DepartmentName);
        Assert.Equal(2, groups.Count);
        Assert.Equal(100, groups.First(x => x.Name == "Cutting").TotalGrossSalary);
    }

    [Fact]
    public void SalarySheetRowDto_HasEnrichedFields()
    {
        var dto = new SalarySheetRowDto(
            Guid.NewGuid(),
            "EMP001",
            "Test User",
            "HR",
            "Officer",
            30000,
            15000,
            30,
            28,
            2,
            4,
            500,
            30500,
            200,
            30300,
            "Processed");

        Assert.Equal("EMP001", dto.EmployeeCode);
        Assert.Equal("Test User", dto.EmployeeName);
    }
}
