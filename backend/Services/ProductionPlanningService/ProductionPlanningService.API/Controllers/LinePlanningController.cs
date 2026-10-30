using Asp.Versioning;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ProductionPlanningService.Application;
using ProductionPlanningService.Contracts;
using ProductionPlanningService.Domain;

namespace ProductionPlanningService.API.Controllers;

[ApiController, ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/production/line-plans")]
public sealed class LinePlansController(IMediator mediator) : ControllerBase
{
    [HttpPost, Authorize(Policy = PlanningPermissions.PlanManage)]
    public async Task<ActionResult<ApiResponse<LineCapacityPlanDto>>> Create(CreateLineCapacityPlanRequest request, CancellationToken ct) =>
        Ok(ApiResponse<LineCapacityPlanDto>.Ok(await mediator.Send(new CreateLinePlanCommand(request), ct)));

    [HttpGet, Authorize]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<LineCapacityPlanDto>>>> Get([FromQuery] Guid companyId, [FromQuery] Guid? orderId, CancellationToken ct) =>
        Ok(ApiResponse<IReadOnlyList<LineCapacityPlanDto>>.Ok(await mediator.Send(new GetLinePlansQuery(companyId, orderId), ct)));

    [HttpGet("{id:guid}"), Authorize]
    public async Task<ActionResult<ApiResponse<LineCapacityPlanDto>>> GetById(Guid id, CancellationToken ct) =>
        Ok(ApiResponse<LineCapacityPlanDto>.Ok(await mediator.Send(new GetLinePlanByIdQuery(id), ct)));

    [HttpPut("{id:guid}"), Authorize(Policy = PlanningPermissions.PlanManage)]
    public async Task<ActionResult<ApiResponse<LineCapacityPlanDto>>> Update(Guid id, UpdateLineCapacityPlanRequest request, CancellationToken ct) =>
        Ok(ApiResponse<LineCapacityPlanDto>.Ok(await mediator.Send(new UpdateLinePlanCommand(id, request), ct)));

    [HttpPatch("{id:guid}/approve"), Authorize(Policy = PlanningPermissions.PlanApprove)]
    public async Task<ActionResult<ApiResponse<LineCapacityPlanDto>>> Approve(Guid id, CancellationToken ct) =>
        Ok(ApiResponse<LineCapacityPlanDto>.Ok(await mediator.Send(new ApproveLinePlanCommand(id), ct)));

    [HttpPatch("{id:guid}/cancel"), Authorize(Policy = PlanningPermissions.PlanApprove)]
    public async Task<ActionResult<ApiResponse<LineCapacityPlanDto>>> Cancel(Guid id, CancellationToken ct) =>
        Ok(ApiResponse<LineCapacityPlanDto>.Ok(await mediator.Send(new CancelLinePlanCommand(id), ct)));
}

[ApiController, ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/production/line-planning")]
public sealed class PlanningCompatController(IMediator mediator) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<LineCapacityPlanDto>>>> GetLegacy([FromQuery] Guid companyId, [FromQuery] Guid? orderId, CancellationToken ct) =>
        Ok(ApiResponse<IReadOnlyList<LineCapacityPlanDto>>.Ok(await mediator.Send(new GetLinePlansQuery(companyId, orderId), ct)));

    [HttpPost]
    public async Task<ActionResult<ApiResponse<LineCapacityPlanDto>>> CreateLegacy(CreateLineCapacityPlanRequest request, CancellationToken ct) =>
        Ok(ApiResponse<LineCapacityPlanDto>.Ok(await mediator.Send(new CreateLinePlanCommand(request), ct)));
}

[ApiController, ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/production/planning-balances")]
public sealed class PlanningBalancesController(IMediator mediator) : ControllerBase
{
    [HttpGet, Authorize(Policy = PlanningPermissions.BalanceView)]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<PlanningBalanceDto>>>> Get([FromQuery] Guid companyId, [FromQuery] Guid? orderId, CancellationToken ct) =>
        Ok(ApiResponse<IReadOnlyList<PlanningBalanceDto>>.Ok(await mediator.Send(new GetPlanningBalancesQuery(companyId, orderId), ct)));
}
