using Asp.Versioning;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SewingService.Application;
using SewingService.Contracts;
using SewingService.Domain;

namespace SewingService.API.Controllers;

[ApiController, ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/sewing-outputs")]
public sealed class SewingOutputsController(IMediator mediator) : ControllerBase
{
    [HttpPost, Authorize(Policy = SewingPermissions.OutputCreate)]
    public async Task<ActionResult<ApiResponse<SewingOutputDto>>> Create(CreateSewingOutputRequest request, CancellationToken ct) =>
        Ok(ApiResponse<SewingOutputDto>.Ok(await mediator.Send(new CreateSewingOutputCommand(request), ct)));

    [HttpGet, Authorize]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<SewingOutputDto>>>> Get(
        [FromQuery] Guid companyId, [FromQuery] Guid? orderId, [FromQuery] int page = 1, [FromQuery] int pageSize = 50, CancellationToken ct = default) =>
        Ok(ApiResponse<IReadOnlyList<SewingOutputDto>>.Ok(await mediator.Send(new GetSewingOutputsQuery(companyId, orderId, page, pageSize), ct)));

    [HttpGet("quantity"), Authorize]
    public async Task<ActionResult<ApiResponse<int>>> GetQuantity(
        [FromQuery] Guid companyId, [FromQuery] Guid orderId, [FromQuery] string? color, [FromQuery] string size, CancellationToken ct) =>
        Ok(ApiResponse<int>.Ok(await mediator.Send(new GetSewingOutputQuantityQuery(companyId, orderId, color, size), ct)));
}

[ApiController]
[Route("api/production")]
public sealed class ProductionIntegrationController(IMediator mediator) : ControllerBase
{
    [HttpGet("outputs/{productionOutputId:guid}")]
    public async Task<ActionResult<SewingOutputSnapshotDto>> GetOutput(
        Guid productionOutputId, [FromQuery] Guid companyId, CancellationToken ct) =>
        await mediator.Send(new GetSewingOutputByIdQuery(productionOutputId, companyId), ct);

    [HttpGet("orders/{orderId:guid}/balance")]
    public async Task<ActionResult<int>> GetOrderBalance(Guid orderId, [FromQuery] Guid companyId, CancellationToken ct) =>
        await mediator.Send(new GetOrderSewingBalanceQuery(companyId, orderId), ct);

    [HttpPost("panel-transfers/receive")]
    public async Task<ActionResult<PanelTransferReceiptDto>> ReceivePanel(PanelTransferReceiveLegacyRequest request, CancellationToken ct) =>
        await mediator.Send(new ReceivePanelTransferLegacyCommand(request), ct);
}
