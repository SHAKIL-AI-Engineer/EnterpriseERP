using MediatR;
using Microsoft.AspNetCore.Mvc;
using StoreService.Application;
using StoreService.Contracts;

namespace StoreService.API.Controllers;

[ApiController]
[Route("api/v1/store/orders")]
public sealed class OrdersController(IMediator mediator) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<StoreOrderDto>>>> Get([FromQuery] Guid companyId, CancellationToken cancellationToken) =>
        Ok(ApiResponse<IReadOnlyList<StoreOrderDto>>.Ok(await mediator.Send(new GetOrdersQuery(companyId), cancellationToken)));

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ApiResponse<StoreOrderDto>>> GetById(Guid id, [FromQuery] Guid companyId, CancellationToken cancellationToken) =>
        Ok(ApiResponse<StoreOrderDto>.Ok(await mediator.Send(new GetOrderByIdQuery(companyId, id), cancellationToken)));

    [HttpPost]
    public async Task<ActionResult<ApiResponse<StoreOrderDto>>> Create(CreateStoreOrderRequest request, CancellationToken cancellationToken) =>
        Ok(ApiResponse<StoreOrderDto>.Ok(await mediator.Send(new CreateOrderCommand(request), cancellationToken), "Order created."));

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<ApiResponse<StoreOrderDto>>> Update(Guid id, [FromQuery] Guid companyId, UpdateStoreOrderRequest request, CancellationToken cancellationToken) =>
        Ok(ApiResponse<StoreOrderDto>.Ok(await mediator.Send(new UpdateOrderCommand(companyId, id, request), cancellationToken), "Order updated."));

    [HttpDelete("{id:guid}")]
    public async Task<ActionResult<ApiResponse<object>>> Delete(Guid id, [FromQuery] Guid companyId, CancellationToken cancellationToken)
    {
        await mediator.Send(new DeleteOrderCommand(companyId, id), cancellationToken);
        return Ok(ApiResponse<object>.Ok(new { }, "Order deleted."));
    }
}
