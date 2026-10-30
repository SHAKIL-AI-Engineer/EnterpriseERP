using MediatR;
using InventoryService.Application;
using InventoryService.Contracts;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace InventoryService.API.Controllers;

[ApiController]
[Route("api/v1/inventory")]
public sealed class InventoryController(IMediator mediator, IInventoryDbContext db) : ControllerBase
{
    [HttpGet("items")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<StockItemDto>>>> GetItems(
        [FromQuery] Guid companyId, [FromQuery] string? search, CancellationToken cancellationToken) =>
        Ok(ApiResponse<IReadOnlyList<StockItemDto>>.Ok(await mediator.Send(new GetStockItemsQuery(companyId, search), cancellationToken)));

    [HttpGet("items/{itemId:guid}")]
    public async Task<ActionResult<ApiResponse<StockItemDto?>>> GetItem(
        Guid itemId, [FromQuery] Guid companyId, CancellationToken cancellationToken)
    {
        var item = await mediator.Send(new GetStockItemByIdQuery(companyId, itemId), cancellationToken);
        return item is null ? NotFound(ApiResponse<StockItemDto?>.Ok(null, "Item not found.")) : Ok(ApiResponse<StockItemDto?>.Ok(item));
    }

    [HttpGet("items/{itemId:guid}/transactions")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<StockTransactionDto>>>> GetItemTransactions(
        Guid itemId, [FromQuery] Guid companyId, CancellationToken cancellationToken) =>
        Ok(ApiResponse<IReadOnlyList<StockTransactionDto>>.Ok(await mediator.Send(new GetItemTransactionsQuery(companyId, itemId), cancellationToken)));

    [HttpGet("transactions")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<StockTransactionDto>>>> GetTransactions(
        [FromQuery] Guid companyId, [FromQuery] Guid? itemId, [FromQuery] int limit = 50, CancellationToken cancellationToken = default) =>
        Ok(ApiResponse<IReadOnlyList<StockTransactionDto>>.Ok(await mediator.Send(new GetStockTransactionsQuery(companyId, itemId, limit), cancellationToken)));

    [HttpPost("receive")]
    public async Task<ActionResult<ApiResponse<StockItemDto>>> Receive(ReceiveStockRequest request, CancellationToken cancellationToken) =>
        Ok(ApiResponse<StockItemDto>.Ok(await mediator.Send(new ReceiveStockCommand(request), cancellationToken), "Stock received."));

    [HttpPost("items/{itemId:guid}/issue")]
    public async Task<ActionResult<ApiResponse<StockItemDto>>> Issue(Guid itemId, IssueStockRequest request, CancellationToken cancellationToken) =>
        Ok(ApiResponse<StockItemDto>.Ok(await mediator.Send(new IssueStockCommand(itemId, request), cancellationToken), "Stock issued."));

    [HttpGet("items/{itemId:guid}/exists")]
    public async Task<ActionResult<ApiResponse<bool>>> Exists(Guid itemId, [FromQuery] Guid companyId, CancellationToken cancellationToken) =>
        Ok(ApiResponse<bool>.Ok(await db.StockItems.AnyAsync(x => x.Id == itemId && x.CompanyId == companyId, cancellationToken)));

    [HttpGet("items/{itemId:guid}/stock-balance")]
    public async Task<ActionResult<ApiResponse<decimal>>> Balance(Guid itemId, [FromQuery] Guid companyId, CancellationToken cancellationToken)
    {
        var item = await db.StockItems.FirstOrDefaultAsync(x => x.Id == itemId && x.CompanyId == companyId, cancellationToken);
        return Ok(ApiResponse<decimal>.Ok(item?.BalanceQty ?? 0));
    }
}
