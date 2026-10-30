using PayrollService.Application;
using PayrollService.Domain.Entities;
using PayrollService.Infrastructure.Persistence;

using Erp.BuildingBlocks.SharedKernel;

namespace PayrollService.Infrastructure.Services;

public sealed class SalaryIncrementService(PayrollDbContext db) : ISalaryIncrementService
{
    public async Task ApproveAsync(Guid id, Guid approvedBy, CancellationToken cancellationToken = default)
    {
        var increment = db.SalaryIncrementRequests.FirstOrDefault(x => x.Id == id);
        if (increment is null)
        {
            throw new InvalidOperationException("Salary increment request not found.");
        }

        if (increment.Status != "Pending")
        {
            throw new InvalidOperationException("Only pending increment requests can be approved.");
        }

        foreach (var current in db.EmployeeSalaries.Where(x => x.CompanyId == increment.CompanyId && x.EmployeeId == increment.EmployeeId && x.IsCurrent))
        {
            current.IsCurrent = false;
            current.EffectiveTo = increment.EffectiveFrom.AddDays(-1);
        }

        var old = db.EmployeeSalaries.OrderByDescending(x => x.EffectiveFrom).FirstOrDefault(x => x.CompanyId == increment.CompanyId && x.EmployeeId == increment.EmployeeId);
        db.EmployeeSalaries.Add(new EmployeeSalary
        {
            CompanyId = increment.CompanyId,
            EmployeeId = increment.EmployeeId,
            SalaryStructureId = old?.SalaryStructureId,
            SalaryCalculationType = old?.SalaryCalculationType ?? "Monthly",
            GrossSalary = increment.NewGrossSalary,
            BasicSalary = increment.NewBasicSalary,
            HouseRent = old?.HouseRent ?? 0,
            MedicalAllowance = old?.MedicalAllowance ?? 0,
            ConveyanceAllowance = old?.ConveyanceAllowance ?? 0,
            FoodAllowance = old?.FoodAllowance ?? 0,
            EffectiveFrom = increment.EffectiveFrom,
            CreatedBy = approvedBy,
        });

        increment.Status = "Approved";
        increment.ApprovedBy = approvedBy;
        increment.ApprovedAt = BusinessTime.Now;
        db.PayrollAuditLogs.Add(new PayrollAuditLog { CompanyId = increment.CompanyId, EntityName = nameof(SalaryIncrementRequestEntity), EntityId = increment.Id, Action = "Approved", ActorId = approvedBy });
        await db.SaveChangesAsync(cancellationToken);
    }
}
