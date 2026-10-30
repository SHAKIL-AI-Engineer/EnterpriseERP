using Asp.Versioning;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SewingService.Application;
using SewingService.Contracts;
using SewingService.Domain;

namespace SewingService.API.Controllers;

[ApiController, ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/sewing-lines")]
public sealed class SewingLinesController(IMediator mediator) : ControllerBase
{
    [HttpPost, Authorize(Policy = SewingPermissions.LineManage)]
    public async Task<ActionResult<ApiResponse<SewingLineDto>>> Create(CreateSewingLineRequest request, CancellationToken ct) =>
        Ok(ApiResponse<SewingLineDto>.Ok(await mediator.Send(new CreateSewingLineCommand(request), ct)));

    [HttpGet, Authorize]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<SewingLineDto>>>> Get([FromQuery] Guid companyId, [FromQuery] int page = 1, [FromQuery] int pageSize = 50, CancellationToken ct = default) =>
        Ok(ApiResponse<IReadOnlyList<SewingLineDto>>.Ok(await mediator.Send(new GetSewingLinesQuery(companyId, page, pageSize), ct)));

    [HttpGet("{id:guid}"), Authorize]
    public async Task<ActionResult<ApiResponse<SewingLineDto>>> GetById(Guid id, CancellationToken ct) =>
        Ok(ApiResponse<SewingLineDto>.Ok(await mediator.Send(new GetSewingLineByIdQuery(id), ct)));

    [HttpPut("{id:guid}"), Authorize(Policy = SewingPermissions.LineManage)]
    public async Task<ActionResult<ApiResponse<SewingLineDto>>> Update(Guid id, UpdateSewingLineRequest request, CancellationToken ct) =>
        Ok(ApiResponse<SewingLineDto>.Ok(await mediator.Send(new UpdateSewingLineCommand(id, request), ct)));

    [HttpDelete("{id:guid}"), Authorize(Policy = SewingPermissions.LineManage)]
    public async Task<ActionResult<ApiResponse<object>>> Delete(Guid id, CancellationToken ct)
    {
        await mediator.Send(new DeleteSewingLineCommand(id), ct);
        return Ok(ApiResponse<object>.Ok(new object(), "Deleted."));
    }
}
