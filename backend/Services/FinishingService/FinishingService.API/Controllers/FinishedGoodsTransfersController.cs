using Asp.Versioning;
using FinishingService.Application;
using FinishingService.Contracts;
using FinishingService.Domain;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FinishingService.API.Controllers;

[ApiController, ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/finished-goods-transfers")]
public sealed class FinishedGoodsTransfersController(IMediator mediator) : ControllerBase
{
    [HttpPost, Authorize(Policy = FinishingPermissions.TransferCreate)]
    public async Task<ActionResult<ApiResponse<FinishedGoodsTransferDto>>> Create(CreateFinishedGoodsTransferRequest request, CancellationToken ct) =>
        Ok(ApiResponse<FinishedGoodsTransferDto>.Ok(await mediator.Send(new CreateFinishedGoodsTransferCommand(request), ct), "Finished goods transfer created in draft."));

    [HttpPatch("{id:guid}/confirm"), Authorize(Policy = FinishingPermissions.TransferConfirm)]
    public async Task<ActionResult<ApiResponse<FinishedGoodsTransferDto>>> Confirm(Guid id, [FromQuery] Guid? userId, CancellationToken ct) =>
        Ok(ApiResponse<FinishedGoodsTransferDto>.Ok(await mediator.Send(new ConfirmFinishedGoodsTransferCommand(id, userId), ct), "Finished goods transfer confirmed and inventory updated."));

    [HttpPatch("{id:guid}/cancel"), Authorize(Policy = FinishingPermissions.TransferConfirm)]
    public async Task<ActionResult<ApiResponse<FinishedGoodsTransferDto>>> Cancel(Guid id, [FromQuery] Guid? userId, CancellationToken ct) =>
        Ok(ApiResponse<FinishedGoodsTransferDto>.Ok(await mediator.Send(new CancelFinishedGoodsTransferCommand(id, userId), ct), "Finished goods transfer cancelled."));

    [HttpGet, Authorize]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<FinishedGoodsTransferDto>>>> Get([FromQuery] Guid companyId, [FromQuery] Guid? orderId, [FromQuery] string? status, CancellationToken ct) =>
        Ok(ApiResponse<IReadOnlyList<FinishedGoodsTransferDto>>.Ok(await mediator.Send(new GetFinishedGoodsTransfersQuery(companyId, orderId, status), ct)));

    [HttpGet("{id:guid}"), Authorize]
    public async Task<ActionResult<ApiResponse<FinishedGoodsTransferDto>>> GetById(Guid id, CancellationToken ct) =>
        Ok(ApiResponse<FinishedGoodsTransferDto>.Ok(await mediator.Send(new GetFinishedGoodsTransferByIdQuery(id), ct)));
}
