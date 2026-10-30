using MediatR;
using Microsoft.AspNetCore.Mvc;
using StoreService.Application;
using StoreService.Contracts;

namespace StoreService.API.Controllers;

[ApiController]
[Route("api/v1/store/buyers")]
public sealed class BuyersController(IMediator mediator) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<StoreBuyerDto>>>> Get([FromQuery] Guid companyId, CancellationToken cancellationToken) =>
        Ok(ApiResponse<IReadOnlyList<StoreBuyerDto>>.Ok(await mediator.Send(new GetBuyersQuery(companyId), cancellationToken)));

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ApiResponse<StoreBuyerDto>>> GetById(Guid id, [FromQuery] Guid companyId, CancellationToken cancellationToken) =>
        Ok(ApiResponse<StoreBuyerDto>.Ok(await mediator.Send(new GetBuyerByIdQuery(companyId, id), cancellationToken)));

    [HttpPost]
    public async Task<ActionResult<ApiResponse<StoreBuyerDto>>> Create(CreateStoreBuyerRequest request, CancellationToken cancellationToken) =>
        Ok(ApiResponse<StoreBuyerDto>.Ok(await mediator.Send(new CreateBuyerCommand(request), cancellationToken), "Buyer created."));

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<ApiResponse<StoreBuyerDto>>> Update(Guid id, UpdateStoreBuyerRequest request, CancellationToken cancellationToken) =>
        Ok(ApiResponse<StoreBuyerDto>.Ok(await mediator.Send(new UpdateBuyerCommand(id, request), cancellationToken), "Buyer updated."));

    [HttpDelete("{id:guid}")]
    public async Task<ActionResult<ApiResponse<object>>> Delete(Guid id, [FromQuery] Guid companyId, CancellationToken cancellationToken)
    {
        await mediator.Send(new DeleteBuyerCommand(companyId, id), cancellationToken);
        return Ok(ApiResponse<object>.Ok(new { }, "Buyer deactivated."));
    }
}
