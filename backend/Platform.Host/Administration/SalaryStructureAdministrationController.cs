using Erp.BuildingBlocks.CommonSecurity;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PayrollService.Contracts;
using PayrollService.Domain.Entities;
using PayrollService.Domain.Enums;
using PayrollService.Infrastructure.Persistence;

namespace EnterpriseERP.Platform.Host.Administration;

[ApiController]
[Route("api/v1/salary-structures")]
[Authorize(Policy = PayrollPermissions.SalaryStructureManage)]
public sealed class SalaryStructureAdministrationController(PayrollDbContext db, ITenantContext tenant) : ControllerBase
{
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, CreateSalaryStructureRequest request, CancellationToken ct)
    {
        var structure = await db.SalaryStructures.Include(s => s.Components).SingleOrDefaultAsync(s => s.Id == id, ct);
        if (structure is null) return NotFound();
        if (structure.CompanyId != request.CompanyId || (!tenant.IsSuperAdmin && request.CompanyId != tenant.ActiveCompanyId)) return Forbid();
        Validate(request);
        if (await db.SalaryStructures.AnyAsync(s => s.CompanyId == request.CompanyId && s.StructureCode == request.StructureCode.Trim() && s.Id != id, ct))
            return Conflict(new { message = "A structure with this code already exists." });
        structure.StructureCode = request.StructureCode.Trim(); structure.StructureName = request.StructureName.Trim();
        db.SalaryStructureComponents.RemoveRange(structure.Components);
        foreach (var c in request.Components) db.SalaryStructureComponents.Add(new SalaryStructureComponent {
            CompanyId = structure.CompanyId, SalaryStructureId = structure.Id, ComponentCode = c.ComponentCode,
            ComponentName = c.ComponentName, ComponentType = c.ComponentType, CalculationType = c.CalculationType,
            Amount = c.Amount, Percentage = c.Percentage, BasedOnComponentCode = c.BasedOnComponentCode, IsTaxable = c.IsTaxable });
        await db.SaveChangesAsync(ct); return Ok(new { message = "Salary structure updated." });
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Deactivate(Guid id, CancellationToken ct)
    {
        var structure = await db.SalaryStructures.SingleOrDefaultAsync(s => s.Id == id, ct);
        if (structure is null) return NotFound();
        structure.IsActive = false; await db.SaveChangesAsync(ct);
        return Ok(new { message = "Structure deactivated; payroll history retained." });
    }

    public static void Validate(CreateSalaryStructureRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.StructureCode) || string.IsNullOrWhiteSpace(request.StructureName)
            || request.StructureCode.Length > 50 || request.StructureName.Length > 150 || request.Components.Count == 0 || request.Components.Count > 100
            || request.Components.Any(c => c.CompanyId != request.CompanyId || string.IsNullOrWhiteSpace(c.ComponentCode)
                || c.Amount < 0 || c.Percentage < 0 || c.Percentage > 100 || string.IsNullOrWhiteSpace(c.ComponentName)
                || c.ComponentType is not ("Earning" or "Deduction") || c.CalculationType is not ("Fixed" or "Percentage"))
            || request.Components.Select(c => c.ComponentCode.ToUpperInvariant()).Distinct().Count() != request.Components.Count)
            throw new InvalidOperationException("Provide a structure code, name and unique non-negative components for the selected company.");
        var components = request.Components.ToDictionary(c => c.ComponentCode, StringComparer.OrdinalIgnoreCase);
        foreach (var component in request.Components.Where(c => c.CalculationType == "Percentage"))
        {
            var seen = new HashSet<string>(StringComparer.OrdinalIgnoreCase) { component.ComponentCode };
            var current = component;
            while (current.CalculationType == "Percentage")
            {
                if (current.BasedOnComponentCode is null || !seen.Add(current.BasedOnComponentCode)
                    || !components.TryGetValue(current.BasedOnComponentCode, out var parent))
                    throw new InvalidOperationException("Percentage components must refer to an existing component without circular references.");
                current = parent;
            }
        }
    }
}
