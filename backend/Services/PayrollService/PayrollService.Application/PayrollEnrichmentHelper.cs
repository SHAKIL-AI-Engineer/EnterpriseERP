using PayrollService.Contracts;
using PayrollService.Domain.Entities;

namespace PayrollService.Application;

public static class PayrollEnrichmentHelper
{
    public static bool MatchesEmployeeFilter(
        EmployeeSnapshot? employee,
        int? departmentId,
        int? sectionId,
        int? designationId,
        int? lineId,
        string? searchTerm)
    {
        if (employee is null)
        {
            return departmentId is null && sectionId is null && designationId is null && lineId is null
                && string.IsNullOrWhiteSpace(searchTerm);
        }

        if (departmentId.HasValue && employee.DepartmentId != departmentId)
        {
            return false;
        }

        if (sectionId.HasValue && employee.SectionId != sectionId)
        {
            return false;
        }

        if (designationId.HasValue && employee.DesignationId != designationId)
        {
            return false;
        }

        if (lineId.HasValue && employee.LineId != lineId)
        {
            return false;
        }

        if (!string.IsNullOrWhiteSpace(searchTerm))
        {
            var needle = searchTerm.Trim();
            var haystack = $"{employee.EmployeeCode} {employee.EmployeeName}".ToLowerInvariant();
            if (!haystack.Contains(needle.ToLowerInvariant()))
            {
                return false;
            }
        }

        return true;
    }

    public static SalarySheetRowDto ToSalarySheetRow(EmployeePayroll payroll, EmployeeSnapshot? employee) => new(
        payroll.EmployeeId,
        employee?.EmployeeCode,
        employee?.EmployeeName,
        employee?.DepartmentName,
        employee?.DesignationName,
        payroll.GrossSalary,
        payroll.BasicSalary,
        payroll.TotalDays,
        payroll.PresentDays,
        payroll.AbsentDays,
        payroll.OvertimeHours,
        payroll.OvertimeAmount,
        payroll.TotalEarnings,
        payroll.TotalDeduction,
        payroll.NetSalary,
        payroll.Status);

    public static IReadOnlyList<SummaryGroupDto> GroupBy(
        IEnumerable<(EmployeePayroll Payroll, EmployeeSnapshot? Employee)> rows,
        Func<EmployeeSnapshot?, string?> groupSelector) =>
        rows
            .GroupBy(x => groupSelector(x.Employee) ?? "Unassigned")
            .Select(g => new SummaryGroupDto(
                g.Key,
                g.Sum(x => x.Payroll.GrossSalary),
                g.Sum(x => x.Payroll.OvertimeAmount),
                g.Sum(x => x.Payroll.TotalDeduction),
                g.Sum(x => x.Payroll.NetSalary),
                g.Count()))
            .OrderBy(x => x.Name)
            .ToList();
}
