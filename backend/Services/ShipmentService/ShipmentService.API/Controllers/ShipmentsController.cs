using Asp.Versioning;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ShipmentService.Application;
using ShipmentService.Contracts;
using ShipmentService.Domain;

namespace ShipmentService.API.Controllers;

[ApiController, ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/shipments")]
public sealed class ShipmentsController(IMediator mediator) : ControllerBase
{
    [HttpPost("finished-goods/ready")]
    public async Task<ActionResult<ShipmentReadinessDto>> FinishedGoodsReady(FinishedGoodsReadyRequest request, CancellationToken ct) =>
        await mediator.Send(new MarkFinishedGoodsReadyCommand(request), ct);

    [HttpPost("notify-inspection-passed")]
    public async Task<ActionResult<bool>> NotifyInspectionPassed(NotifyInspectionPassedRequest request, CancellationToken ct) =>
        await mediator.Send(new NotifyInspectionPassedCommand(request), ct);

    [HttpGet("plans")]
    public async Task<ActionResult<ShipmentPlanSnapshotDto?>> GetPlan([FromQuery] Guid companyId, [FromQuery] Guid orderId, CancellationToken ct) =>
        await mediator.Send(new GetShipmentPlanQuery(companyId, orderId), ct);

    [HttpGet("status")]
    public async Task<ActionResult<string>> GetStatus([FromQuery] Guid companyId, [FromQuery] Guid orderId, CancellationToken ct) =>
        await mediator.Send(new GetShipmentStatusQuery(companyId, orderId), ct);

    [HttpPost("executions"), Authorize(Policy = ShipmentPermissions.ExecutionManage)]
    public async Task<ActionResult<ApiResponse<ShipmentExecutionDto>>> CreateExecution(CreateShipmentExecutionRequest request, CancellationToken ct) =>
        Ok(ApiResponse<ShipmentExecutionDto>.Ok(await mediator.Send(new CreateShipmentExecutionCommand(request), ct)));

    [HttpGet("executions"), Authorize]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<ShipmentExecutionDto>>>> GetExecutions([FromQuery] Guid companyId, [FromQuery] Guid? orderId, CancellationToken ct) =>
        Ok(ApiResponse<IReadOnlyList<ShipmentExecutionDto>>.Ok(await mediator.Send(new GetShipmentExecutionsQuery(companyId, orderId), ct)));

    [HttpGet("reports"), Authorize(Policy = ShipmentPermissions.ReportView)]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<ShipmentReportRowDto>>>> Reports([FromQuery] Guid companyId, [FromQuery] Guid? orderId, CancellationToken ct) =>
        Ok(ApiResponse<IReadOnlyList<ShipmentReportRowDto>>.Ok(await mediator.Send(new GetShipmentReportsQuery(companyId, orderId), ct)));
}
