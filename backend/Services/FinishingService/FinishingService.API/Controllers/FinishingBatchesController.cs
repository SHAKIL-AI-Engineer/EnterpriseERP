using Asp.Versioning;
using FinishingService.Application;
using FinishingService.Contracts;
using FinishingService.Domain;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FinishingService.API.Controllers;

[ApiController, ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/finishing-batches")]
public sealed class FinishingBatchesController(IMediator mediator) : ControllerBase
{
    [HttpPost, Authorize(Policy = FinishingPermissions.BatchCreate)]
    public async Task<ActionResult<ApiResponse<FinishingBatchDto>>> Create(CreateFinishingBatchRequest request, CancellationToken ct) =>
        Ok(ApiResponse<FinishingBatchDto>.Ok(await mediator.Send(new CreateFinishingBatchCommand(request), ct), "Finishing batch created in draft."));

    [HttpPatch("{id:guid}/start"), Authorize(Policy = FinishingPermissions.BatchCreate)]
    public async Task<ActionResult<ApiResponse<FinishingBatchDto>>> Start(Guid id, [FromQuery] Guid? userId, CancellationToken ct) =>
        Ok(ApiResponse<FinishingBatchDto>.Ok(await mediator.Send(new StartFinishingBatchCommand(id, userId), ct), "Finishing batch started."));

    [HttpPatch("{id:guid}/complete"), Authorize(Policy = FinishingPermissions.BatchCreate)]
    public async Task<ActionResult<ApiResponse<FinishingBatchDto>>> Complete(Guid id, [FromQuery] Guid? userId, CancellationToken ct) =>
        Ok(ApiResponse<FinishingBatchDto>.Ok(await mediator.Send(new CompleteFinishingBatchCommand(id, userId), ct), "Finishing batch completed."));

    [HttpPatch("{id:guid}/cancel"), Authorize(Policy = FinishingPermissions.BatchCreate)]
    public async Task<ActionResult<ApiResponse<FinishingBatchDto>>> Cancel(Guid id, [FromQuery] Guid? userId, CancellationToken ct) =>
        Ok(ApiResponse<FinishingBatchDto>.Ok(await mediator.Send(new CancelFinishingBatchCommand(id, userId), ct), "Finishing batch cancelled."));

    [HttpGet, Authorize]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<FinishingBatchDto>>>> Get([FromQuery] Guid companyId, [FromQuery] Guid? orderId, [FromQuery] string? status, CancellationToken ct) =>
        Ok(ApiResponse<IReadOnlyList<FinishingBatchDto>>.Ok(await mediator.Send(new GetFinishingBatchesQuery(companyId, orderId, status), ct)));

    [HttpGet("{id:guid}"), Authorize]
    public async Task<ActionResult<ApiResponse<FinishingBatchDto>>> GetById(Guid id, CancellationToken ct) =>
        Ok(ApiResponse<FinishingBatchDto>.Ok(await mediator.Send(new GetFinishingBatchByIdQuery(id), ct)));
}
