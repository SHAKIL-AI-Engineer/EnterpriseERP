using Asp.Versioning;
using CuttingService.Application;
using CuttingService.Contracts;
using CuttingService.Domain;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CuttingService.API.Controllers;

[ApiController, ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/cutting-plans")]
public sealed class CuttingPlansController(IMediator mediator) : ControllerBase
{
    [HttpPost, Authorize(Policy = CuttingPermissions.PlanCreate)]
    public async Task<ActionResult<ApiResponse<CuttingPlanDto>>> Create(CreateCuttingPlanRequest request, CancellationToken ct) => Ok(ApiResponse<CuttingPlanDto>.Ok(await mediator.Send(new CreateCuttingPlanCommand(request), ct), "Cutting plan created."));
    [HttpGet, Authorize]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<CuttingPlanDto>>>> Get([FromQuery] Guid companyId, [FromQuery] Guid? orderId, [FromQuery] string? status, CancellationToken ct) => Ok(ApiResponse<IReadOnlyList<CuttingPlanDto>>.Ok(await mediator.Send(new GetCuttingPlansQuery(companyId, orderId, status), ct)));
    [HttpGet("{id:guid}"), Authorize]
    public async Task<ActionResult<ApiResponse<CuttingPlanDto>>> GetById(Guid id, CancellationToken ct) => Ok(ApiResponse<CuttingPlanDto>.Ok(await mediator.Send(new GetCuttingPlanByIdQuery(id), ct)));
    [HttpPut("{id:guid}"), Authorize(Policy = CuttingPermissions.PlanUpdate)]
    public async Task<ActionResult<ApiResponse<CuttingPlanDto>>> Update(Guid id, UpdateCuttingPlanRequest request, CancellationToken ct) => Ok(ApiResponse<CuttingPlanDto>.Ok(await mediator.Send(new UpdateCuttingPlanCommand(id, request), ct), "Cutting plan updated."));
    [HttpPatch("{id:guid}/approve"), Authorize(Policy = CuttingPermissions.PlanApprove)]
    public async Task<ActionResult<ApiResponse<CuttingPlanDto>>> Approve(Guid id, [FromQuery] Guid? userId, CancellationToken ct) => Ok(ApiResponse<CuttingPlanDto>.Ok(await mediator.Send(new ApproveCuttingPlanCommand(id, userId), ct), "Cutting plan approved."));
    [HttpPatch("{id:guid}/start"), Authorize(Policy = CuttingPermissions.PlanUpdate)]
    public async Task<ActionResult<ApiResponse<CuttingPlanDto>>> Start(Guid id, [FromQuery] Guid? userId, CancellationToken ct) => Ok(ApiResponse<CuttingPlanDto>.Ok(await mediator.Send(new StartCuttingPlanCommand(id, userId), ct), "Cutting plan started."));
    [HttpPatch("{id:guid}/complete"), Authorize(Policy = CuttingPermissions.PlanApprove)]
    public async Task<ActionResult<ApiResponse<CuttingPlanDto>>> Complete(Guid id, [FromQuery] Guid? userId, CancellationToken ct) => Ok(ApiResponse<CuttingPlanDto>.Ok(await mediator.Send(new CompleteCuttingPlanCommand(id, userId), ct), "Cutting plan completed."));
    [HttpPatch("{id:guid}/cancel"), Authorize(Policy = CuttingPermissions.PlanApprove)]
    public async Task<ActionResult<ApiResponse<CuttingPlanDto>>> Cancel(Guid id, [FromQuery] Guid? userId, CancellationToken ct) => Ok(ApiResponse<CuttingPlanDto>.Ok(await mediator.Send(new CancelCuttingPlanCommand(id, userId), ct), "Cutting plan cancelled."));

    [HttpPost("{planId:guid}/size-breakdowns"), Authorize(Policy = CuttingPermissions.PlanUpdate)]
    public async Task<ActionResult<ApiResponse<CuttingPlanSizeBreakdownDto>>> AddBreakdown(Guid planId, AddCuttingPlanSizeBreakdownRequest request, CancellationToken ct) => Ok(ApiResponse<CuttingPlanSizeBreakdownDto>.Ok(await mediator.Send(new AddCuttingPlanSizeBreakdownCommand(planId, request), ct), "Size breakdown added."));
    [HttpGet("{planId:guid}/size-breakdowns"), Authorize]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<CuttingPlanSizeBreakdownDto>>>> GetBreakdowns(Guid planId, CancellationToken ct) => Ok(ApiResponse<IReadOnlyList<CuttingPlanSizeBreakdownDto>>.Ok(await mediator.Send(new GetCuttingPlanSizeBreakdownsQuery(planId), ct)));
}

[ApiController, ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/cutting-size-breakdowns")]
public sealed class CuttingSizeBreakdownsController(IMediator mediator) : ControllerBase
{
    [HttpPut("{id:guid}"), Authorize(Policy = CuttingPermissions.PlanUpdate)]
    public async Task<ActionResult<ApiResponse<CuttingPlanSizeBreakdownDto>>> Update(Guid id, UpdateCuttingPlanSizeBreakdownRequest request, CancellationToken ct) => Ok(ApiResponse<CuttingPlanSizeBreakdownDto>.Ok(await mediator.Send(new UpdateCuttingPlanSizeBreakdownCommand(id, request), ct), "Size breakdown updated."));
    [HttpDelete("{id:guid}"), Authorize(Policy = CuttingPermissions.PlanUpdate)]
    public async Task<ActionResult<ApiResponse<bool>>> Delete(Guid id, CancellationToken ct) { await mediator.Send(new DeleteCuttingPlanSizeBreakdownCommand(id), ct); return Ok(ApiResponse<bool>.Ok(true, "Size breakdown deleted.")); }
}
