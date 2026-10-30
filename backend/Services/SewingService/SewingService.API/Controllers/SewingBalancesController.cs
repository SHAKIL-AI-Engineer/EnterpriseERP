using Asp.Versioning;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SewingService.Application;
using SewingService.Contracts;
using SewingService.Domain;

namespace SewingService.API.Controllers;

[ApiController, ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/sewing-balances")]
public sealed class SewingBalancesController(IMediator mediator) : ControllerBase
{
    [HttpGet, Authorize(Policy = SewingPermissions.BalanceView)]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<SewingBalanceDto>>>> Get(
        [FromQuery] Guid companyId, [FromQuery] Guid? orderId, CancellationToken ct) =>
        Ok(ApiResponse<IReadOnlyList<SewingBalanceDto>>.Ok(await mediator.Send(new GetSewingBalancesQuery(companyId, orderId), ct)));

    [HttpPost("panel-receive"), Authorize(Policy = SewingPermissions.PanelReceive)]
    public async Task<ActionResult<ApiResponse<PanelTransferReceiptDto>>> ReceivePanel(ReceivePanelTransferRequest request, CancellationToken ct) =>
        Ok(ApiResponse<PanelTransferReceiptDto>.Ok(await mediator.Send(new ReceivePanelTransferCommand(request), ct)));
}
