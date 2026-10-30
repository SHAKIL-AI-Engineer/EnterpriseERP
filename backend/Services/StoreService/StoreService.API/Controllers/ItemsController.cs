using MediatR;
using Microsoft.AspNetCore.Mvc;
using StoreService.Application;
using StoreService.Contracts;

namespace StoreService.API.Controllers;

[ApiController]
[Route("api/v1/store/items")]
public sealed class ItemsController(IMediator mediator) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<StoreItemDto>>>> Get([FromQuery] Guid companyId, CancellationToken cancellationToken) =>
        Ok(ApiResponse<IReadOnlyList<StoreItemDto>>.Ok(await mediator.Send(new GetItemsQuery(companyId), cancellationToken)));

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ApiResponse<StoreItemDto>>> GetById(Guid id, [FromQuery] Guid companyId, CancellationToken cancellationToken) =>
        Ok(ApiResponse<StoreItemDto>.Ok(await mediator.Send(new GetItemByIdQuery(companyId, id), cancellationToken)));

    [HttpPost]
    public async Task<ActionResult<ApiResponse<StoreItemDto>>> Create(CreateStoreItemRequest request, CancellationToken cancellationToken) =>
        Ok(ApiResponse<StoreItemDto>.Ok(await mediator.Send(new CreateItemCommand(request), cancellationToken), "Item created."));

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<ApiResponse<StoreItemDto>>> Update(Guid id, UpdateStoreItemRequest request, CancellationToken cancellationToken) =>
        Ok(ApiResponse<StoreItemDto>.Ok(await mediator.Send(new UpdateItemCommand(id, request), cancellationToken), "Item updated."));

    [HttpDelete("{id:guid}")]
    public async Task<ActionResult<ApiResponse<object>>> Delete(Guid id, [FromQuery] Guid companyId, CancellationToken cancellationToken)
    {
        await mediator.Send(new DeleteItemCommand(companyId, id), cancellationToken);
        return Ok(ApiResponse<object>.Ok(new { }, "Item deactivated."));
    }
}
