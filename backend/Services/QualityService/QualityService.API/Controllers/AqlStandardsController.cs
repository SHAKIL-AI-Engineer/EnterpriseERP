using Asp.Versioning;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QualityService.Application;
using QualityService.Contracts;
using QualityService.Domain;

namespace QualityService.API.Controllers;

[ApiController, ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/aql-standards")]
public sealed class AqlStandardsController(IMediator mediator) : ControllerBase
{
    [HttpPost, Authorize(Policy = QualityPermissions.CheckpointManage)]
    public async Task<ActionResult<ApiResponse<AQLStandardDto>>> Create(CreateAQLStandardRequest request, CancellationToken ct) =>
        Ok(ApiResponse<AQLStandardDto>.Ok(await mediator.Send(new CreateAQLStandardCommand(request), ct), "AQL standard limit registered."));

    [HttpGet, Authorize]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<AQLStandardDto>>>> Get([FromQuery] Guid companyId, CancellationToken ct) =>
        Ok(ApiResponse<IReadOnlyList<AQLStandardDto>>.Ok(await mediator.Send(new GetAQLStandardsQuery(companyId), ct)));

    [HttpGet("find"), Authorize]
    public async Task<ActionResult<ApiResponse<AQLStandardDto>>> Find([FromQuery] Guid companyId, [FromQuery] int lotSize, CancellationToken ct) =>
        Ok(ApiResponse<AQLStandardDto>.Ok(await mediator.Send(new FindAQLStandardByLotSizeQuery(companyId, lotSize), ct)));
}
