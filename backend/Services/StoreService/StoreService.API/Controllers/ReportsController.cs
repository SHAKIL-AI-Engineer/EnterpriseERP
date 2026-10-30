using MediatR;
using Microsoft.AspNetCore.Mvc;
using StoreService.Application;
using StoreService.Contracts;

namespace StoreService.API.Controllers;

[ApiController]
[Route("api/v1/store")]
public sealed class ReportsController(IMediator mediator) : ControllerBase
{
    [HttpGet("shortage-report")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<StoreBookingDto>>>> Shortage([FromQuery] Guid companyId, CancellationToken cancellationToken) =>
        Ok(ApiResponse<IReadOnlyList<StoreBookingDto>>.Ok(await mediator.Send(new GetShortageReportQuery(companyId), cancellationToken)));

    [HttpGet("reports/consumption")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<OrderConsumptionLineDto>>>> Consumption([FromQuery] Guid companyId, CancellationToken cancellationToken) =>
        Ok(ApiResponse<IReadOnlyList<OrderConsumptionLineDto>>.Ok(await mediator.Send(new GetConsumptionReportQuery(companyId), cancellationToken)));

    [HttpGet("reports/item-stock")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<StoreItemDto>>>> ItemStock([FromQuery] Guid companyId, CancellationToken cancellationToken) =>
        Ok(ApiResponse<IReadOnlyList<StoreItemDto>>.Ok(await mediator.Send(new GetItemStockReportQuery(companyId), cancellationToken)));

    [HttpGet("reports/booking-vs-issue")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<BookingVsIssueLineDto>>>> BookingVsIssue(
        [FromQuery] Guid companyId, [FromQuery] string? type, CancellationToken cancellationToken) =>
        Ok(ApiResponse<IReadOnlyList<BookingVsIssueLineDto>>.Ok(await mediator.Send(new GetBookingVsIssueReportQuery(companyId, type), cancellationToken)));

    [HttpGet("ledger")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<StockLedgerEntryDto>>>> Ledger(
        [FromQuery] Guid companyId, [FromQuery] Guid itemId, CancellationToken cancellationToken) =>
        Ok(ApiResponse<IReadOnlyList<StockLedgerEntryDto>>.Ok(await mediator.Send(new GetStockLedgerQuery(companyId, itemId), cancellationToken)));
}
