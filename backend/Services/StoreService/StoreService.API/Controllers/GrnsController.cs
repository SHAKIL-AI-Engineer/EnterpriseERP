using MediatR;
using Microsoft.AspNetCore.Mvc;
using StoreService.Application;
using StoreService.Contracts;

namespace StoreService.API.Controllers;

[ApiController]
[Route("api/v1/store/grns")]
public sealed class GrnsController(IMediator mediator) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<GrnDto>>>> Get([FromQuery] Guid companyId, CancellationToken cancellationToken) =>
        Ok(ApiResponse<IReadOnlyList<GrnDto>>.Ok(await mediator.Send(new GetGrnsQuery(companyId), cancellationToken)));

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ApiResponse<GrnDto>>> GetById(Guid id, [FromQuery] Guid companyId, CancellationToken cancellationToken) =>
        Ok(ApiResponse<GrnDto>.Ok(await mediator.Send(new GetGrnByIdQuery(companyId, id), cancellationToken)));

    [HttpPost]
    public async Task<ActionResult<ApiResponse<GrnDto>>> Create(CreateGrnRequest request, CancellationToken cancellationToken) =>
        Ok(ApiResponse<GrnDto>.Ok(await mediator.Send(new CreateGrnCommand(request), cancellationToken), "GRN created."));

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<ApiResponse<GrnDto>>> Update(Guid id, [FromQuery] Guid companyId, UpdateGrnRequest request, CancellationToken cancellationToken) =>
        Ok(ApiResponse<GrnDto>.Ok(await mediator.Send(new UpdateGrnCommand(companyId, id, request), cancellationToken), "GRN updated."));

    [HttpDelete("{id:guid}")]
    public async Task<ActionResult<ApiResponse<object>>> Delete(Guid id, [FromQuery] Guid companyId, CancellationToken cancellationToken)
    {
        await mediator.Send(new DeleteGrnCommand(companyId, id), cancellationToken);
        return Ok(ApiResponse<object>.Ok(new { }, "GRN removed."));
    }
}
