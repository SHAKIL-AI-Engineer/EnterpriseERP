using Asp.Versioning;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SewingService.Application;
using SewingService.Contracts;
using SewingService.Domain;

namespace SewingService.API.Controllers;

[ApiController, ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/production-targets")]
public sealed class ProductionTargetsController(IMediator mediator) : ControllerBase
{
    [HttpPost, Authorize(Policy = SewingPermissions.TargetManage)]
    public async Task<ActionResult<ApiResponse<ProductionTargetDto>>> Save(SaveProductionTargetRequest request, CancellationToken ct) =>
        Ok(ApiResponse<ProductionTargetDto>.Ok(await mediator.Send(new SaveProductionTargetCommand(request), ct)));

    [HttpGet, Authorize]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<ProductionTargetDto>>>> Get(
        [FromQuery] Guid companyId, [FromQuery] Guid? assignmentId, [FromQuery] DateOnly? date, CancellationToken ct) =>
        Ok(ApiResponse<IReadOnlyList<ProductionTargetDto>>.Ok(await mediator.Send(new GetProductionTargetsQuery(companyId, assignmentId, date), ct)));

    [HttpDelete("{id:guid}"), Authorize(Policy = SewingPermissions.TargetManage)]
    public async Task<ActionResult<ApiResponse<object>>> Delete(Guid id, CancellationToken ct)
    {
        await mediator.Send(new DeleteProductionTargetCommand(id), ct);
        return Ok(ApiResponse<object>.Ok(new object(), "Deleted."));
    }
}
