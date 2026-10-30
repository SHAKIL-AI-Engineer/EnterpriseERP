using MediatR;
using ProductionPlanningService.Contracts;

namespace ProductionPlanningService.Application;

public sealed record CreateLinePlanCommand(CreateLineCapacityPlanRequest Request) : IRequest<LineCapacityPlanDto>;
public sealed record UpdateLinePlanCommand(Guid Id, UpdateLineCapacityPlanRequest Request) : IRequest<LineCapacityPlanDto>;
public sealed record ApproveLinePlanCommand(Guid Id) : IRequest<LineCapacityPlanDto>;
public sealed record CancelLinePlanCommand(Guid Id) : IRequest<LineCapacityPlanDto>;
public sealed record GetLinePlansQuery(Guid CompanyId, Guid? OrderId) : IRequest<IReadOnlyList<LineCapacityPlanDto>>;
public sealed record GetLinePlanByIdQuery(Guid Id) : IRequest<LineCapacityPlanDto>;
public sealed record GetPlanningBalancesQuery(Guid CompanyId, Guid? OrderId) : IRequest<IReadOnlyList<PlanningBalanceDto>>;
