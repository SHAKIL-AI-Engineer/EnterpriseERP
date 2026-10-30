using System.Text;
using MediatR;
using MerchandisingService.Application;
using MerchandisingService.Contracts;
using MerchandisingService.Domain;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

using Erp.BuildingBlocks.SharedKernel;

namespace MerchandisingService.API.Controllers;

[ApiController]
[Route("api/v1/merchandising/reports")]
public sealed class ReportsController(IMediator mediator) : ControllerBase
{
    [HttpGet("order-summary")]
    [Authorize(Policy = MerchandisingPolicies.ReportView)]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<OrderDto>>>> OrderSummary([FromQuery] Guid companyId, [FromQuery] Guid? buyerId, [FromQuery] string? status, CancellationToken cancellationToken) =>
        Ok(ApiResponse<IReadOnlyList<OrderDto>>.Ok(await mediator.Send(new GetOrderSummaryReportQuery(companyId, buyerId, status), cancellationToken)));

    [HttpGet("order-summary.csv")]
    [Authorize(Policy = MerchandisingPolicies.ReportView)]
    public async Task<IActionResult> ExportOrderSummary([FromQuery] Guid companyId, [FromQuery] Guid? buyerId, [FromQuery] string? status, CancellationToken cancellationToken)
    {
        var orders = await mediator.Send(new GetOrderSummaryReportQuery(companyId, buyerId, status), cancellationToken);
        var csv = new StringBuilder();
        csv.AppendLine("OrderId,OrderNo,BuyerId,StyleId,OrderDate,ShipmentDate,Quantity,UnitPrice,TotalValue,Currency,Status");
        foreach (var order in orders)
        {
            csv.AppendLine($"{order.Id},{order.OrderNo},{order.BuyerId},{order.StyleId},{order.OrderDate},{order.ShipmentDate},{order.TotalOrderQty},{order.UnitPrice},{order.TotalValue},{order.CurrencyCode},{order.OrderStatus}");
        }

        return File(Encoding.UTF8.GetBytes(csv.ToString()), "text/csv", $"merchandising-order-summary-{BusinessTime.Now:yyyyMMddHHmmss}.csv");
    }

    [HttpGet("tna-delay")]
    [Authorize(Policy = MerchandisingPolicies.ReportView)]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<TnaDelayReportRowDto>>>> TnaDelay([FromQuery] Guid companyId, CancellationToken cancellationToken) =>
        Ok(ApiResponse<IReadOnlyList<TnaDelayReportRowDto>>.Ok(await mediator.Send(new GetTnaDelayReportQuery(companyId), cancellationToken)));

    [HttpGet("tna-delay.csv")]
    [Authorize(Policy = MerchandisingPolicies.ReportView)]
    public async Task<IActionResult> ExportTnaDelay([FromQuery] Guid companyId, CancellationToken cancellationToken)
    {
        var rows = await mediator.Send(new GetTnaDelayReportQuery(companyId), cancellationToken);
        var csv = new StringBuilder();
        csv.AppendLine("OrderId,OrderNo,MilestoneId,MilestoneName,PlannedDate,ActualDate,DelayDays,Status");
        foreach (var row in rows)
        {
            csv.AppendLine($"{row.OrderId},{row.OrderNo},{row.MilestoneId},{row.MilestoneName},{row.PlannedDate},{row.ActualDate},{row.DelayDays},{row.Status}");
        }

        return File(Encoding.UTF8.GetBytes(csv.ToString()), "text/csv", $"merchandising-tna-delay-{BusinessTime.Now:yyyyMMddHHmmss}.csv");
    }

    [HttpGet("booking-status")]
    [Authorize(Policy = MerchandisingPolicies.ReportView)]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<BookingStatusReportRowDto>>>> BookingStatus([FromQuery] Guid companyId, [FromQuery] Guid? orderId, CancellationToken cancellationToken) =>
        Ok(ApiResponse<IReadOnlyList<BookingStatusReportRowDto>>.Ok(await mediator.Send(new GetBookingStatusReportQuery(companyId, orderId), cancellationToken)));

    [HttpGet("booking-status.csv")]
    [Authorize(Policy = MerchandisingPolicies.ReportView)]
    public async Task<IActionResult> ExportBookingStatus([FromQuery] Guid companyId, [FromQuery] Guid? orderId, CancellationToken cancellationToken)
    {
        var rows = await mediator.Send(new GetBookingStatusReportQuery(companyId, orderId), cancellationToken);
        var csv = new StringBuilder();
        csv.AppendLine("OrderId,OrderNo,BookingId,BookingNo,BookingType,Status,TotalQty,BookedQty");
        foreach (var row in rows)
        {
            csv.AppendLine($"{row.OrderId},{row.OrderNo},{row.BookingId},{row.BookingNo},{row.BookingType},{row.Status},{row.TotalQty},{row.BookedQty}");
        }

        return File(Encoding.UTF8.GetBytes(csv.ToString()), "text/csv", $"merchandising-booking-status-{BusinessTime.Now:yyyyMMddHHmmss}.csv");
    }

    [HttpGet("order-pipeline")]
    [Authorize(Policy = MerchandisingPolicies.ReportView)]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<OrderPipelineReportRowDto>>>> OrderPipeline([FromQuery] Guid companyId, CancellationToken cancellationToken) =>
        Ok(ApiResponse<IReadOnlyList<OrderPipelineReportRowDto>>.Ok(await mediator.Send(new GetOrderPipelineReportQuery(companyId), cancellationToken)));

    [HttpGet("order-pipeline.csv")]
    [Authorize(Policy = MerchandisingPolicies.ReportView)]
    public async Task<IActionResult> ExportOrderPipeline([FromQuery] Guid companyId, CancellationToken cancellationToken)
    {
        var rows = await mediator.Send(new GetOrderPipelineReportQuery(companyId), cancellationToken);
        var csv = new StringBuilder();
        csv.AppendLine("OrderStatus,OrderCount,TotalQuantity,TotalValue");
        foreach (var row in rows)
        {
            csv.AppendLine($"{row.OrderStatus},{row.OrderCount},{row.TotalQuantity},{row.TotalValue}");
        }

        return File(Encoding.UTF8.GetBytes(csv.ToString()), "text/csv", $"merchandising-order-pipeline-{BusinessTime.Now:yyyyMMddHHmmss}.csv");
    }
}
