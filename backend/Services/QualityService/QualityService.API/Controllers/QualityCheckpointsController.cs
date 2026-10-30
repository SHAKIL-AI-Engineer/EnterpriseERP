using Asp.Versioning;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QualityService.Application;
using QualityService.Contracts;
using QualityService.Domain;

namespace QualityService.API.Controllers;

[ApiController, ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/quality-checkpoints")]
public sealed class QualityCheckpointsController(IMediator mediator) : ControllerBase
{
    [HttpPost, Authorize(Policy = QualityPermissions.CheckpointManage)]
    public async Task<ActionResult<ApiResponse<QualityCheckpointDto>>> Create(CreateQualityCheckpointRequest request, CancellationToken ct) =>
        Ok(ApiResponse<QualityCheckpointDto>.Ok(await mediator.Send(new CreateQualityCheckpointCommand(request), ct), "Quality checkpoint created."));

    [HttpGet, Authorize]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<QualityCheckpointDto>>>> Get([FromQuery] Guid companyId, CancellationToken ct) =>
        Ok(ApiResponse<IReadOnlyList<QualityCheckpointDto>>.Ok(await mediator.Send(new GetQualityCheckpointsQuery(companyId), ct)));

    [HttpPut("{id:guid}"), Authorize(Policy = QualityPermissions.CheckpointManage)]
    public async Task<ActionResult<ApiResponse<QualityCheckpointDto>>> Update(Guid id, UpdateQualityCheckpointRequest request, CancellationToken ct) =>
        Ok(ApiResponse<QualityCheckpointDto>.Ok(await mediator.Send(new UpdateQualityCheckpointCommand(id, request), ct), "Quality checkpoint updated."));

    [HttpPatch("{id:guid}/activate"), Authorize(Policy = QualityPermissions.CheckpointManage)]
    public async Task<ActionResult<ApiResponse<QualityCheckpointDto>>> Activate(Guid id, CancellationToken ct) =>
        Ok(ApiResponse<QualityCheckpointDto>.Ok(await mediator.Send(new ActivateQualityCheckpointCommand(id), ct), "Checkpoint activated."));

    [HttpPatch("{id:guid}/deactivate"), Authorize(Policy = QualityPermissions.CheckpointManage)]
    public async Task<ActionResult<ApiResponse<QualityCheckpointDto>>> Deactivate(Guid id, CancellationToken ct) =>
        Ok(ApiResponse<QualityCheckpointDto>.Ok(await mediator.Send(new DeactivateQualityCheckpointCommand(id), ct), "Checkpoint deactivated."));
}
