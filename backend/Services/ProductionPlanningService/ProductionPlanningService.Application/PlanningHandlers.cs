using AutoMapper;
using MediatR;
using Microsoft.EntityFrameworkCore;
using ProductionPlanningService.Contracts;
using ProductionPlanningService.Domain;

namespace ProductionPlanningService.Application;

public sealed class PlanningHandlers(IUnitOfWork uow, IMapper mapper) :
    IRequestHandler<CreateLinePlanCommand, LineCapacityPlanDto>,
    IRequestHandler<UpdateLinePlanCommand, LineCapacityPlanDto>,
    IRequestHandler<ApproveLinePlanCommand, LineCapacityPlanDto>,
    IRequestHandler<CancelLinePlanCommand, LineCapacityPlanDto>,
    IRequestHandler<GetLinePlansQuery, IReadOnlyList<LineCapacityPlanDto>>,
    IRequestHandler<GetLinePlanByIdQuery, LineCapacityPlanDto>,
    IRequestHandler<GetPlanningBalancesQuery, IReadOnlyList<PlanningBalanceDto>>
{
    public async Task<LineCapacityPlanDto> Handle(CreateLinePlanCommand command, CancellationToken ct)
    {
        var r = command.Request;
        var plan = new LineCapacityPlan
        {
            CompanyId = r.CompanyId,
            OrderId = r.OrderId,
            LineCode = r.LineCode.Trim(),
            LineName = r.LineName.Trim(),
            PlanDate = r.PlanDate,
            PlannedQty = r.PlannedQty,
            DailyCapacity = r.DailyCapacity,
            Status = r.Status ?? LinePlanStatuses.Planned,
        };
        await uow.LinePlans.AddAsync(plan, ct);
        var balance = new PlanningBalance { CompanyId = r.CompanyId, OrderId = r.OrderId, LineCapacityPlanId = plan.Id, PlannedQty = r.PlannedQty };
        await uow.Balances.AddAsync(balance, ct);
        await uow.SaveChangesAsync(ct);
        return mapper.Map<LineCapacityPlanDto>(plan);
    }

    public async Task<LineCapacityPlanDto> Handle(UpdateLinePlanCommand command, CancellationToken ct)
    {
        var plan = await uow.LinePlans.GetByIdAsync(command.Id, ct) ?? throw new KeyNotFoundException("Plan not found.");
        var r = command.Request;
        plan.LineCode = r.LineCode.Trim();
        plan.LineName = r.LineName.Trim();
        plan.PlanDate = r.PlanDate;
        plan.PlannedQty = r.PlannedQty;
        plan.DailyCapacity = r.DailyCapacity;
        plan.Status = r.Status;
        await uow.SaveChangesAsync(ct);
        return mapper.Map<LineCapacityPlanDto>(plan);
    }

    public async Task<LineCapacityPlanDto> Handle(ApproveLinePlanCommand command, CancellationToken ct)
    {
        var plan = await uow.LinePlans.GetByIdAsync(command.Id, ct) ?? throw new KeyNotFoundException("Plan not found.");
        plan.Status = LinePlanStatuses.Approved;
        await uow.SaveChangesAsync(ct);
        return mapper.Map<LineCapacityPlanDto>(plan);
    }

    public async Task<LineCapacityPlanDto> Handle(CancelLinePlanCommand command, CancellationToken ct)
    {
        var plan = await uow.LinePlans.GetByIdAsync(command.Id, ct) ?? throw new KeyNotFoundException("Plan not found.");
        plan.Status = LinePlanStatuses.Cancelled;
        await uow.SaveChangesAsync(ct);
        return mapper.Map<LineCapacityPlanDto>(plan);
    }

    public async Task<IReadOnlyList<LineCapacityPlanDto>> Handle(GetLinePlansQuery query, CancellationToken ct)
    {
        var q = uow.LinePlans.Query().Where(x => x.CompanyId == query.CompanyId);
        if (query.OrderId.HasValue) q = q.Where(x => x.OrderId == query.OrderId);
        return mapper.Map<IReadOnlyList<LineCapacityPlanDto>>(await q.OrderBy(x => x.PlanDate).ToListAsync(ct));
    }

    public async Task<LineCapacityPlanDto> Handle(GetLinePlanByIdQuery query, CancellationToken ct)
    {
        var plan = await uow.LinePlans.GetByIdAsync(query.Id, ct) ?? throw new KeyNotFoundException("Plan not found.");
        return mapper.Map<LineCapacityPlanDto>(plan);
    }

    public async Task<IReadOnlyList<PlanningBalanceDto>> Handle(GetPlanningBalancesQuery query, CancellationToken ct)
    {
        var q = uow.Balances.Query().Where(x => x.CompanyId == query.CompanyId);
        if (query.OrderId.HasValue) q = q.Where(x => x.OrderId == query.OrderId);
        return mapper.Map<IReadOnlyList<PlanningBalanceDto>>(await q.ToListAsync(ct));
    }
}

public sealed class PlanningMappingProfile : Profile
{
    public PlanningMappingProfile()
    {
        CreateMap<LineCapacityPlan, LineCapacityPlanDto>();
        CreateMap<PlanningBalance, PlanningBalanceDto>();
    }
}
