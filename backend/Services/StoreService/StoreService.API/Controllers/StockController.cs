using MediatR;
using Microsoft.AspNetCore.Mvc;
using StoreService.Application;
using StoreService.Contracts;

namespace StoreService.API.Controllers;

[ApiController]
[Route("api/v1/store")]
public sealed class StockController(IMediator mediator) : ControllerBase
{
    [HttpPost("stock-in")]
    public async Task<ActionResult<ApiResponse<StockTransactionDto>>> StockIn(StockMovementRequest request, CancellationToken cancellationToken) =>
        Ok(ApiResponse<StockTransactionDto>.Ok(await mediator.Send(new StockInCommand(request), cancellationToken), "Stock received."));

    [HttpPost("stock-out")]
    public async Task<ActionResult<ApiResponse<StockTransactionDto>>> StockOut(StockMovementRequest request, CancellationToken cancellationToken) =>
        Ok(ApiResponse<StockTransactionDto>.Ok(await mediator.Send(new StockOutCommand(request), cancellationToken), "Stock issued."));

    [HttpGet("transactions")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<StockTransactionDto>>>> Transactions(
        [FromQuery] Guid companyId, [FromQuery] Guid? itemId, CancellationToken cancellationToken) =>
        Ok(ApiResponse<IReadOnlyList<StockTransactionDto>>.Ok(await mediator.Send(new GetTransactionsQuery(companyId, itemId), cancellationToken)));

    [HttpGet("dashboard-summary")]
    public async Task<ActionResult<ApiResponse<StockDashboardSummaryDto>>> Dashboard([FromQuery] Guid companyId, CancellationToken cancellationToken) =>
        Ok(ApiResponse<StockDashboardSummaryDto>.Ok(await mediator.Send(new GetDashboardSummaryQuery(companyId), cancellationToken)));

    [HttpGet("low-stock")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<StoreItemDto>>>> LowStock([FromQuery] Guid companyId, CancellationToken cancellationToken) =>
        Ok(ApiResponse<IReadOnlyList<StoreItemDto>>.Ok(await mediator.Send(new GetLowStockQuery(companyId), cancellationToken)));
}
