using HRService.Application.Employees;
using LeaveService.Application.Common.Interfaces;

namespace EnterpriseERP.Platform.Host.Integration;

/// <summary>
/// Reads HR employees in-process (no HTTP) so leave apply does not depend on hr.employees.read over self-calls.
/// </summary>
public sealed class LeaveInProcessEmployeeClient(IEmployeeReadService employees) : IEmployeeServiceClient
{
    public async Task<EmployeeValidationResult> ValidateEmployeeAsync(
        Guid companyId,
        Guid employeeId,
        CancellationToken cancellationToken = default)
    {
        var details = await employees.GetByIdAsync(employeeId, cancellationToken);
        if (details is null)
        {
            return EmployeeValidationResult.NotFound;
        }

        if (details.CompanyId != companyId)
        {
            return EmployeeValidationResult.WrongCompany;
        }

        return string.Equals(details.Status, "Active", StringComparison.OrdinalIgnoreCase)
            ? EmployeeValidationResult.Active
            : EmployeeValidationResult.Inactive;
    }

    public async Task<bool> IsEmployeeActiveAsync(Guid companyId, Guid employeeId, CancellationToken cancellationToken = default)
    {
        var result = await ValidateEmployeeAsync(companyId, employeeId, cancellationToken);
        return result.Status == EmployeeValidationStatus.Active;
    }

    public async Task<DateOnly?> GetEmployeeJoinDateAsync(Guid companyId, Guid employeeId, CancellationToken cancellationToken = default)
    {
        var details = await employees.GetByIdAsync(employeeId, cancellationToken);
        if (details is null || details.CompanyId != companyId)
        {
            return null;
        }

        return DateOnly.FromDateTime(details.JoinDate);
    }

    public async Task<IReadOnlyList<Guid>> GetActiveEmployeeIdsAsync(Guid companyId, CancellationToken cancellationToken = default)
    {
        var result = await employees.ListAsync(new EmployeeListQuery
        {
            CompanyId = companyId,
            Status = "Active",
            Page = 1,
            PageSize = 5000,
        }, cancellationToken);

        return result.Data
            .Where(x => string.Equals(x.Status, "Active", StringComparison.OrdinalIgnoreCase))
            .Select(x => x.Id)
            .ToArray();
    }

    public async Task<IReadOnlyList<EmployeeLookupInfo>> LookupEmployeesAsync(
        IReadOnlyList<Guid> employeeIds,
        CancellationToken cancellationToken = default)
    {
        if (employeeIds.Count == 0)
            return [];

        var distinct = employeeIds.Where(x => x != Guid.Empty).Distinct().ToArray();
        var rows = await employees.ListLookupsByIdsAsync(distinct, cancellationToken: cancellationToken);
        return rows.Select(x => new EmployeeLookupInfo(
            x.Id,
            x.EmployeeCode,
            x.FullName,
            x.DepartmentName,
            x.DesignationName)).ToArray();
    }
}
