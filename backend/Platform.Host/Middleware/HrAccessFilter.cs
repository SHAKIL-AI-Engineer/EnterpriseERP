using System.Collections;
using System.Reflection;
using Erp.BuildingBlocks.CommonSecurity;
using HRService.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Controllers;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.EntityFrameworkCore;

namespace EnterpriseERP.Platform.Host.Middleware;

public sealed class HrAccessFilter(IAuthorizationService authorization, ITenantContext tenant, HrDbContext hr) : IAsyncActionFilter
{
    public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
    {
        var descriptor = context.ActionDescriptor as ControllerActionDescriptor;
        var ns = descriptor?.ControllerTypeInfo.Namespace ?? "";
        var read = HttpMethods.IsGet(context.HttpContext.Request.Method);
        var module = ns.StartsWith("HRService.") ? "hr.employees" : ns.StartsWith("PayrollService.") ? "payroll"
            : ns.StartsWith("AttendanceService.") ? "attendance" : ns.StartsWith("LeaveService.") ? "leave"
            : ns.StartsWith("ShiftService.") ? "company" : null;
        if (module is null) { await next(); return; }
        var explicitPolicy = descriptor!.MethodInfo.GetCustomAttributes<AuthorizeAttribute>().Any(a => !string.IsNullOrEmpty(a.Policy))
            || (read && descriptor.ControllerTypeInfo.GetCustomAttributes<AuthorizeAttribute>().Any(a => !string.IsNullOrEmpty(a.Policy)));
        if (!explicitPolicy && !(await authorization.AuthorizeAsync(context.HttpContext.User, null,
                "Permission:" + module + (read ? ".read" : ".write"))).Succeeded)
        { context.Result = new ForbidResult(); return; }

        foreach (var argument in context.ActionArguments)
        {
            if (argument.Value is PayrollService.Contracts.CreateSalaryStructureRequest structure)
                EnterpriseERP.Platform.Host.Administration.SalaryStructureAdministrationController.Validate(structure);
            if (argument.Key.Equals("companyId", StringComparison.OrdinalIgnoreCase) && argument.Value is Guid company)
                EnsureCompany(company);
            if (argument.Key.Equals("employeeId", StringComparison.OrdinalIgnoreCase) && argument.Value is Guid employee)
                await EnsureEmployee(employee, context.HttpContext.RequestAborted);
            await CheckObject(argument.Value, 0, context.HttpContext.RequestAborted);
        }
        await next();
    }

    private void EnsureCompany(Guid company)
    {
        if (company == Guid.Empty) throw new InvalidOperationException("A valid company is required.");
        if (!tenant.IsSuperAdmin && company != tenant.ActiveCompanyId)
            throw new UnauthorizedAccessException("Company scope mismatch.");
    }

    private async Task EnsureEmployee(Guid id, CancellationToken ct)
    {
        if (id != Guid.Empty && !await hr.Employees.AnyAsync(e => e.Id == id && !e.IsDeleted, ct))
            throw new UnauthorizedAccessException("Employee is unavailable in the active company.");
    }

    private async Task CheckObject(object? value, int depth, CancellationToken ct)
    {
        if (value is null || depth > 4 || value is string || value.GetType().IsValueType) return;
        if (value is IEnumerable values)
        { foreach (var item in values) await CheckObject(item, depth + 1, ct); return; }
        if (!(value.GetType().Namespace?.StartsWith("HRService.") == true
            || value.GetType().Namespace?.StartsWith("PayrollService.") == true
            || value.GetType().Namespace?.StartsWith("LeaveService.") == true
            || value.GetType().Namespace?.StartsWith("ShiftService.") == true
            || value.GetType().Namespace?.StartsWith("AttendanceService.") == true)) return;
        foreach (var p in value.GetType().GetProperties().Where(p => p.CanRead && p.GetIndexParameters().Length == 0))
        {
            var item = p.GetValue(value);
            if (p.Name == "CompanyId" && item is Guid company) EnsureCompany(company);
            else if (p.Name == "EmployeeId" && item is Guid employee) await EnsureEmployee(employee, ct);
            else await CheckObject(item, depth + 1, ct);
        }
    }
}
