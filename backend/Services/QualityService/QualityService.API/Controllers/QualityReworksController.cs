using Asp.Versioning;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QualityService.Application;
using QualityService.Contracts;
using QualityService.Domain;

namespace QualityService.API.Controllers;

[ApiController, ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/quality-reworks")]
public sealed class QualityReworksController(IMediator mediator) : ControllerBase
{
    [HttpPost, Authorize(Policy = QualityPermissions.ReworkCreate)]
    public async Task<ActionResult<ApiResponse<QualityReworkDto>>> Create(CreateQualityReworkRequest request, CancellationToken ct) =>
        Ok(ApiResponse<QualityReworkDto>.Ok(await mediator.Send(new CreateQualityReworkCommand(request), ct), "Rework order created."));

    [HttpGet, Authorize]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<QualityReworkDto>>>> Get(
        [FromQuery] Guid companyId,
        [FromQuery] Guid? orderId,
        [FromQuery] string? status,
        CancellationToken ct) =>
        Ok(ApiResponse<IReadOnlyList<QualityReworkDto>>.Ok(await mediator.Send(new GetQualityReworksQuery(companyId, orderId, status), ct)));

    [HttpPatch("{id:guid}/send"), Authorize(Policy = QualityPermissions.ReworkCreate)]
    public async Task<ActionResult<ApiResponse<QualityReworkDto>>> Send(Guid id, [FromQuery] Guid? userId, CancellationToken ct) =>
        Ok(ApiResponse<QualityReworkDto>.Ok(await mediator.Send(new SendQualityReworkCommand(id, userId), ct), "Rework sent to department."));

    [HttpPatch("{id:guid}/complete"), Authorize(Policy = QualityPermissions.ReworkCreate)]
    public async Task<ActionResult<ApiResponse<QualityReworkDto>>> Complete(Guid id, [FromQuery] Guid? userId, CancellationToken ct) =>
        Ok(ApiResponse<QualityReworkDto>.Ok(await mediator.Send(new CompleteQualityReworkCommand(id, userId), ct), "Rework marked completed."));
}
