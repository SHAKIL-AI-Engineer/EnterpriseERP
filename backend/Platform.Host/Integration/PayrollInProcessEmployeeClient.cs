using Erp.BuildingBlocks.SharedKernel;
using HRService.Application.Employees;
using PayrollService.Application;
using PayrollService.Domain.Entities;

namespace EnterpriseERP.Platform.Host.Integration;

/// <summary>
/// Reads HR employees in-process (no HTTP) so payroll processing does not depend on hr.employees.read over self-calls.
/// </summary>
public sealed class PayrollInProcessEmployeeClient(IEmployeeReadService employees) : IEmployeeServiceClient
{
    public async Task<IReadOnlyList<EmployeeSnapshot>> GetActiveEmployeesAsync(
        Guid companyId,
        CancellationToken cancellationToken = default)
    {
        var result = await employees.ListAsync(new EmployeeListQuery
        {
            CompanyId = companyId,
            Status = "Active",
            Page = 1,
            PageSize = 200,
        }, cancellationToken);

        return result.Data
            .Where(x => string.Equals(x.Status, "Active", StringComparison.OrdinalIgnoreCase))
            .Select(MapListItem)
            .ToList();
    }

    public async Task<EmployeeSnapshot?> GetEmployeeByIdAsync(
        Guid companyId,
        Guid employeeId,
        CancellationToken cancellationToken = default)
    {
        var details = await employees.GetByIdAsync(employeeId, cancellationToken);
        return details is null || details.CompanyId != companyId ? null : MapDetails(details);
    }

    public async Task<DateOnly?> GetEmployeeJoinDateAsync(
        Guid companyId,
        Guid employeeId,
        CancellationToken cancellationToken = default)
    {
        var employee = await GetEmployeeByIdAsync(companyId, employeeId, cancellationToken);
        return employee?.JoinDate;
    }

    public Task<IReadOnlyList<EmployeeSnapshot>> GetResignedEmployeesAsync(
        Guid companyId,
        int year,
        int month,
        CancellationToken cancellationToken = default) =>
        Task.FromResult<IReadOnlyList<EmployeeSnapshot>>(Array.Empty<EmployeeSnapshot>());

    public async Task<EmployeeSalary?> TryResolveHrSalaryAsync(
        Guid companyId,
        Guid employeeId,
        DateOnly periodStart,
        DateOnly periodEnd,
        CancellationToken cancellationToken = default)
    {
        var details = await employees.GetByIdAsync(employeeId, cancellationToken);
        if (details is null || details.CompanyId != companyId)
        {
            return null;
        }

        if (details.CurrentSalaryInfo is { GrossSalary: > 0 } hrSalary)
        {
            var effectiveFrom = DateOnly.FromDateTime(hrSalary.EffectiveFrom);
            if (effectiveFrom <= periodEnd)
            {
                return MapSalary(companyId, employeeId, hrSalary.BasicSalary, hrSalary.HouseRent,
                    hrSalary.MedicalAllowance, hrSalary.ConveyanceAllowance, hrSalary.FoodAllowance,
                    hrSalary.GrossSalary, effectiveFrom);
            }
        }

        var manpower = await employees.ManpowerListAsync(new ManpowerListQuery
        {
            CompanyId = companyId,
            Status = "Active",
            Page = 1,
            PageSize = 200,
        }, cancellationToken);

        var row = manpower.Data.FirstOrDefault(x => x.Id == employeeId);
        if (row is null || row.GrossSalary <= 0)
        {
            return null;
        }

        return MapSalary(companyId, employeeId, 0, 0, 0, 0, 0, row.GrossSalary, periodStart);
    }

    private static EmployeeSnapshot MapListItem(EmployeeListItemDto item) =>
        new(
            item.Id,
            item.CompanyId,
            DateOnly.FromDateTime(BusinessTime.Now),
            string.Equals(item.Status, "Active", StringComparison.OrdinalIgnoreCase),
            EmployeeCode: item.EmployeeID,
            EmployeeName: item.FullName,
            DepartmentName: item.DepartmentName,
            DesignationName: item.DesignationName,
            IsOtEnabled: item.IsOtEnabled);

    private static EmployeeSnapshot MapDetails(EmployeeDetailsDto details)
    {
        var job = details.CurrentJobInfo;
        var primaryBank = details.BankAccounts.FirstOrDefault(b => b.IsPrimary) ?? details.BankAccounts.FirstOrDefault();
        return new EmployeeSnapshot(
            details.Id,
            details.CompanyId,
            DateOnly.FromDateTime(details.JoinDate),
            string.Equals(details.Status, "Active", StringComparison.OrdinalIgnoreCase),
            primaryBank?.AccountNo,
            primaryBank?.BankName,
            details.EmployeeID,
            details.FullName,
            null,
            job?.DepartmentName,
            null,
            job?.SectionName,
            null,
            job?.DesignationName,
            null,
            null,
            details.IsOtEnabled);
    }

    private static EmployeeSalary MapSalary(
        Guid companyId,
        Guid employeeId,
        decimal basic,
        decimal houseRent,
        decimal medical,
        decimal conveyance,
        decimal food,
        decimal gross,
        DateOnly effectiveFrom) =>
        new()
        {
            CompanyId = companyId,
            EmployeeId = employeeId,
            SalaryCalculationType = "Monthly",
            BasicSalary = basic,
            HouseRent = houseRent,
            MedicalAllowance = medical,
            ConveyanceAllowance = conveyance,
            FoodAllowance = food,
            GrossSalary = gross,
            EffectiveFrom = effectiveFrom,
            IsCurrent = true,
        };
}
