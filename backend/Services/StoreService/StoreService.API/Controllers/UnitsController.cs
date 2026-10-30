using MediatR;
using Microsoft.AspNetCore.Mvc;
using StoreService.Application;
using StoreService.Contracts;

namespace StoreService.API.Controllers;

[ApiController]
[Route("api/v1/store/units")]
public sealed class UnitsController(IMediator mediator) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<StoreUnitDto>>>> Get([FromQuery] Guid companyId, CancellationToken cancellationToken) =>
        Ok(ApiResponse<IReadOnlyList<StoreUnitDto>>.Ok(await mediator.Send(new GetUnitsQuery(companyId), cancellationToken)));

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ApiResponse<StoreUnitDto>>> GetById(Guid id, [FromQuery] Guid companyId, CancellationToken cancellationToken) =>
        Ok(ApiResponse<StoreUnitDto>.Ok(await mediator.Send(new GetUnitByIdQuery(companyId, id), cancellationToken)));

    [HttpPost]
    public async Task<ActionResult<ApiResponse<StoreUnitDto>>> Create(CreateStoreUnitRequest request, CancellationToken cancellationToken) =>
        Ok(ApiResponse<StoreUnitDto>.Ok(await mediator.Send(new CreateUnitCommand(request), cancellationToken), "Unit created."));

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<ApiResponse<StoreUnitDto>>> Update(Guid id, UpdateStoreUnitRequest request, CancellationToken cancellationToken) =>
        Ok(ApiResponse<StoreUnitDto>.Ok(await mediator.Send(new UpdateUnitCommand(id, request), cancellationToken), "Unit updated."));

    [HttpDelete("{id:guid}")]
    public async Task<ActionResult<ApiResponse<object>>> Delete(Guid id, [FromQuery] Guid companyId, CancellationToken cancellationToken)
    {
        await mediator.Send(new DeleteUnitCommand(companyId, id), cancellationToken);
        return Ok(ApiResponse<object>.Ok(new { }, "Unit deleted."));
    }
}
