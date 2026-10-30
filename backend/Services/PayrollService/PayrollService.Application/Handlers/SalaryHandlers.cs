using MediatR;
using PayrollService.Contracts;
using PayrollService.Domain.Entities;

using Erp.BuildingBlocks.SharedKernel;

namespace PayrollService.Application.Handlers;

public sealed class SalaryStructureHandlers(IPayrollDbContext db, IRedisCacheService cache) :
    IRequestHandler<CreateSalaryStructureCommand, ApiResponse<SalaryStructureDto>>,
    IRequestHandler<AddSalaryStructureComponentCommand, ApiResponse<SalaryStructureComponentDto>>,
    IRequestHandler<GetSalaryStructuresQuery, ApiResponse<IReadOnlyList<SalaryStructureDto>>>,
    IRequestHandler<GetSalaryStructureComponentsQuery, ApiResponse<IReadOnlyList<SalaryStructureComponentDto>>>
{
    public async Task<ApiResponse<SalaryStructureDto>> Handle(CreateSalaryStructureCommand command, CancellationToken cancellationToken)
    {
        var r = command.Request;
        if (db.SalaryStructures.Any(x => x.CompanyId == r.CompanyId && x.StructureCode == r.StructureCode))
        {
            return ApiResponse<SalaryStructureDto>.Fail("Salary structure code already exists.");
        }

        var structure = new SalaryStructure { CompanyId = r.CompanyId, StructureCode = r.StructureCode, StructureName = r.StructureName, GradeId = r.GradeId };
        db.Add(structure);
        foreach (var c in r.Components)
        {
            db.Add(new SalaryStructureComponent
            {
                CompanyId = r.CompanyId,
                SalaryStructureId = structure.Id,
                ComponentCode = c.ComponentCode,
                ComponentName = c.ComponentName,
                ComponentType = c.ComponentType,
                CalculationType = c.CalculationType,
                Amount = c.Amount,
                Percentage = c.Percentage,
                BasedOnComponentCode = c.BasedOnComponentCode,
                IsTaxable = c.IsTaxable,
            });
        }

        await db.SaveChangesAsync(cancellationToken);
        await cache.RemoveAsync(CacheKeys.SalaryStructure(r.CompanyId), cancellationToken);
        var components = db.SalaryStructureComponents.Where(x => x.SalaryStructureId == structure.Id).ToList();
        return ApiResponse<SalaryStructureDto>.Ok(structure.ToDto(components), "Salary structure created.");
    }

    public async Task<ApiResponse<SalaryStructureComponentDto>> Handle(AddSalaryStructureComponentCommand command, CancellationToken cancellationToken)
    {
        var structure = db.SalaryStructures.FirstOrDefault(x => x.Id == command.SalaryStructureId);
        if (structure is null)
        {
            return ApiResponse<SalaryStructureComponentDto>.Fail("Salary structure not found.");
        }

        var r = command.Request;
        var component = new SalaryStructureComponent
        {
            CompanyId = structure.CompanyId,
            SalaryStructureId = command.SalaryStructureId,
            ComponentCode = r.ComponentCode,
            ComponentName = r.ComponentName,
            ComponentType = r.ComponentType,
            CalculationType = r.CalculationType,
            Amount = r.Amount,
            Percentage = r.Percentage,
            BasedOnComponentCode = r.BasedOnComponentCode,
            IsTaxable = r.IsTaxable,
        };

        db.Add(component);
        await db.SaveChangesAsync(cancellationToken);
        await cache.RemoveAsync(CacheKeys.SalaryStructure(structure.CompanyId), cancellationToken);
        return ApiResponse<SalaryStructureComponentDto>.Ok(component.ToDto(), "Salary structure component added.");
    }

    public Task<ApiResponse<IReadOnlyList<SalaryStructureDto>>> Handle(GetSalaryStructuresQuery query, CancellationToken cancellationToken)
    {
        var structures = db.SalaryStructures.Where(x => x.CompanyId == query.CompanyId).OrderBy(x => x.StructureCode).ToList();
        var components = db.SalaryStructureComponents.Where(x => x.CompanyId == query.CompanyId).ToList();
        var result = structures.Select(s => s.ToDto(components.Where(c => c.SalaryStructureId == s.Id).ToList())).ToList();
        return Task.FromResult(ApiResponse<IReadOnlyList<SalaryStructureDto>>.Ok(result));
    }

    public Task<ApiResponse<IReadOnlyList<SalaryStructureComponentDto>>> Handle(GetSalaryStructureComponentsQuery query, CancellationToken cancellationToken)
    {
        var result = db.SalaryStructureComponents.Where(x => x.SalaryStructureId == query.SalaryStructureId).Select(x => x.ToDto()).ToList();
        return Task.FromResult(ApiResponse<IReadOnlyList<SalaryStructureComponentDto>>.Ok(result));
    }
}

public sealed class EmployeeSalaryHandlers(IPayrollDbContext db, IRedisCacheService cache) :
    IRequestHandler<AssignEmployeeSalaryCommand, ApiResponse<EmployeeSalaryDto>>,
    IRequestHandler<GetCurrentEmployeeSalaryQuery, ApiResponse<EmployeeSalaryDto>>,
    IRequestHandler<GetEmployeeSalaryHistoryQuery, ApiResponse<IReadOnlyList<EmployeeSalaryDto>>>
{
    public async Task<ApiResponse<EmployeeSalaryDto>> Handle(AssignEmployeeSalaryCommand command, CancellationToken cancellationToken)
    {
        var r = command.Request;
        foreach (var current in db.EmployeeSalaries.Where(x => x.CompanyId == r.CompanyId && x.EmployeeId == r.EmployeeId && x.IsCurrent))
        {
            current.IsCurrent = false;
            current.EffectiveTo = r.EffectiveFrom.AddDays(-1);
        }

        var salary = new EmployeeSalary
        {
            CompanyId = r.CompanyId,
            EmployeeId = r.EmployeeId,
            SalaryStructureId = r.SalaryStructureId,
            SalaryCalculationType = string.IsNullOrWhiteSpace(r.SalaryCalculationType) ? "Monthly" : r.SalaryCalculationType,
            GrossSalary = r.GrossSalary,
            BasicSalary = r.BasicSalary,
            HouseRent = r.HouseRent,
            MedicalAllowance = r.MedicalAllowance,
            ConveyanceAllowance = r.ConveyanceAllowance,
            FoodAllowance = r.FoodAllowance,
            EffectiveFrom = r.EffectiveFrom,
            CreatedBy = r.CreatedBy,
        };
        db.Add(salary);
        db.Add(new PayrollAuditLog { CompanyId = r.CompanyId, EntityName = nameof(EmployeeSalary), EntityId = salary.Id, Action = "Assigned", ActorId = r.CreatedBy });
        await db.SaveChangesAsync(cancellationToken);
        await cache.RemoveAsync(CacheKeys.EmployeeSalary(r.CompanyId, r.EmployeeId), cancellationToken);
        return ApiResponse<EmployeeSalaryDto>.Ok(salary.ToDto(), "Employee salary assigned.");
    }

    public Task<ApiResponse<EmployeeSalaryDto>> Handle(GetCurrentEmployeeSalaryQuery query, CancellationToken cancellationToken)
    {
        var salary = db.EmployeeSalaries.FirstOrDefault(x => x.CompanyId == query.CompanyId && x.EmployeeId == query.EmployeeId && x.IsCurrent);
        return Task.FromResult(salary is null
            ? ApiResponse<EmployeeSalaryDto>.Fail("Current employee salary not found.")
            : ApiResponse<EmployeeSalaryDto>.Ok(salary.ToDto()));
    }

    public Task<ApiResponse<IReadOnlyList<EmployeeSalaryDto>>> Handle(GetEmployeeSalaryHistoryQuery query, CancellationToken cancellationToken)
    {
        var result = db.EmployeeSalaries
            .Where(x => x.CompanyId == query.CompanyId && x.EmployeeId == query.EmployeeId)
            .OrderByDescending(x => x.EffectiveFrom)
            .Select(x => x.ToDto())
            .ToList();
        return Task.FromResult(ApiResponse<IReadOnlyList<EmployeeSalaryDto>>.Ok(result));
    }
}

public sealed class SalaryIncrementHandlers(IPayrollDbContext db, ISalaryIncrementService incrementService, IIntegrationEventPublisher publisher) :
    IRequestHandler<CreateSalaryIncrementCommand, ApiResponse<SalaryIncrementDto>>,
    IRequestHandler<ApproveSalaryIncrementCommand, ApiResponse<SalaryIncrementDto>>,
    IRequestHandler<RejectSalaryIncrementCommand, ApiResponse<SalaryIncrementDto>>,
    IRequestHandler<GetSalaryIncrementHistoryQuery, ApiResponse<IReadOnlyList<SalaryIncrementDto>>>
{
    public async Task<ApiResponse<SalaryIncrementDto>> Handle(CreateSalaryIncrementCommand command, CancellationToken cancellationToken)
    {
        var r = command.Request;
        var increment = new SalaryIncrementRequestEntity
        {
            CompanyId = r.CompanyId,
            EmployeeId = r.EmployeeId,
            OldGrossSalary = r.OldGrossSalary,
            NewGrossSalary = r.NewGrossSalary,
            OldBasicSalary = r.OldBasicSalary,
            NewBasicSalary = r.NewBasicSalary,
            IncrementAmount = r.NewGrossSalary - r.OldGrossSalary,
            IncrementPercentage = r.OldGrossSalary <= 0 ? 0 : decimal.Round((r.NewGrossSalary - r.OldGrossSalary) / r.OldGrossSalary * 100, 2),
            EffectiveFrom = r.EffectiveFrom,
            Reason = r.Reason,
            RequestedBy = r.RequestedBy,
        };

        db.Add(increment);
        await db.SaveChangesAsync(cancellationToken);
        return ApiResponse<SalaryIncrementDto>.Ok(increment.ToDto(), "Salary increment requested.");
    }

    public async Task<ApiResponse<SalaryIncrementDto>> Handle(ApproveSalaryIncrementCommand command, CancellationToken cancellationToken)
    {
        await incrementService.ApproveAsync(command.Id, command.ApprovedBy, cancellationToken);
        var increment = db.SalaryIncrementRequests.First(x => x.Id == command.Id);
        await publisher.PublishAsync(new SalaryIncrementApprovedEvent(increment.CompanyId, increment.EmployeeId, increment.Id, increment.EffectiveFrom), cancellationToken);
        return ApiResponse<SalaryIncrementDto>.Ok(increment.ToDto(), "Salary increment approved.");
    }

    public async Task<ApiResponse<SalaryIncrementDto>> Handle(RejectSalaryIncrementCommand command, CancellationToken cancellationToken)
    {
        var increment = db.SalaryIncrementRequests.FirstOrDefault(x => x.Id == command.Id);
        if (increment is null)
        {
            return ApiResponse<SalaryIncrementDto>.Fail("Salary increment request not found.");
        }

        if (increment.Status != "Pending") return ApiResponse<SalaryIncrementDto>.Fail("Only pending increments can be reviewed.");
        increment.Status = "Rejected";
        increment.ApprovedBy = command.RejectedBy;
        increment.ApprovedAt = BusinessTime.Now;
        await db.SaveChangesAsync(cancellationToken);
        return ApiResponse<SalaryIncrementDto>.Ok(increment.ToDto(), "Salary increment rejected.");
    }

    public Task<ApiResponse<IReadOnlyList<SalaryIncrementDto>>> Handle(GetSalaryIncrementHistoryQuery query, CancellationToken cancellationToken)
    {
        var result = db.SalaryIncrementRequests
            .Where(x => x.CompanyId == query.CompanyId && (!query.EmployeeId.HasValue || x.EmployeeId == query.EmployeeId))
            .OrderByDescending(x => x.RequestedAt)
            .Select(x => x.ToDto())
            .ToList();
        return Task.FromResult(ApiResponse<IReadOnlyList<SalaryIncrementDto>>.Ok(result));
    }
}
