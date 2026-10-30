using Asp.Versioning;
using FinishingService.Application;
using FinishingService.Contracts;
using FinishingService.Domain;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FinishingService.API.Controllers;

[ApiController, ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/finishing-receives")]
public sealed class FinishingReceivesController(IMediator mediator) : ControllerBase
{
    [HttpPost, Authorize(Policy = FinishingPermissions.ReceiveCreate)]
    public async Task<ActionResult<ApiResponse<FinishingReceiveDto>>> Create(CreateFinishingReceiveRequest request, CancellationToken ct) =>
        Ok(ApiResponse<FinishingReceiveDto>.Ok(await mediator.Send(new CreateFinishingReceiveCommand(request), ct), "Finishing receive created in draft."));

    [HttpPatch("{id:guid}/confirm"), Authorize(Policy = FinishingPermissions.ReceiveConfirm)]
    public async Task<ActionResult<ApiResponse<FinishingReceiveDto>>> Confirm(Guid id, [FromQuery] Guid? userId, CancellationToken ct) =>
        Ok(ApiResponse<FinishingReceiveDto>.Ok(await mediator.Send(new ConfirmFinishingReceiveCommand(id, userId), ct), "Finishing receive confirmed."));

    [HttpPatch("{id:guid}/cancel"), Authorize(Policy = FinishingPermissions.ReceiveConfirm)]
    public async Task<ActionResult<ApiResponse<FinishingReceiveDto>>> Cancel(Guid id, [FromQuery] Guid? userId, CancellationToken ct) =>
        Ok(ApiResponse<FinishingReceiveDto>.Ok(await mediator.Send(new CancelFinishingReceiveCommand(id, userId), ct), "Finishing receive cancelled."));

    [HttpGet, Authorize]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<FinishingReceiveDto>>>> Get([FromQuery] Guid companyId, [FromQuery] Guid? orderId, [FromQuery] string? status, CancellationToken ct) =>
        Ok(ApiResponse<IReadOnlyList<FinishingReceiveDto>>.Ok(await mediator.Send(new GetFinishingReceivesQuery(companyId, orderId, status), ct)));

    [HttpGet("quantity"), Authorize]
    public async Task<ActionResult<ApiResponse<int>>> GetQuantity(
        [FromQuery] Guid companyId, [FromQuery] Guid orderId, [FromQuery] string? color, [FromQuery] string size, CancellationToken ct) =>
        Ok(ApiResponse<int>.Ok(await mediator.Send(new GetFinishingReceiveQuantityQuery(companyId, orderId, color, size), ct)));

    [HttpGet("{id:guid}"), Authorize]
    public async Task<ActionResult<ApiResponse<FinishingReceiveDto>>> GetById(Guid id, CancellationToken ct) =>
        Ok(ApiResponse<FinishingReceiveDto>.Ok(await mediator.Send(new GetFinishingReceiveByIdQuery(id), ct)));
}
