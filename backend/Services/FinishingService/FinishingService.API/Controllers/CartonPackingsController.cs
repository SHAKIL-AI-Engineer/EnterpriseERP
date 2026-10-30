using Asp.Versioning;
using FinishingService.Application;
using FinishingService.Contracts;
using FinishingService.Domain;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FinishingService.API.Controllers;

[ApiController, ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/carton-packings")]
public sealed class CartonPackingsController(IMediator mediator) : ControllerBase
{
    [HttpPost, Authorize(Policy = FinishingPermissions.CartonCreate)]
    public async Task<ActionResult<ApiResponse<CartonPackingDto>>> Create(CreateCartonPackingRequest request, CancellationToken ct) =>
        Ok(ApiResponse<CartonPackingDto>.Ok(await mediator.Send(new CreateCartonPackingCommand(request), ct), "Carton packing registered in open state."));

    [HttpPatch("{id:guid}/close"), Authorize(Policy = FinishingPermissions.CartonClose)]
    public async Task<ActionResult<ApiResponse<CartonPackingDto>>> Close(Guid id, [FromQuery] Guid? userId, CancellationToken ct) =>
        Ok(ApiResponse<CartonPackingDto>.Ok(await mediator.Send(new CloseCartonPackingCommand(id, userId), ct), "Carton closed and sealed."));

    [HttpPatch("{id:guid}/cancel"), Authorize(Policy = FinishingPermissions.CartonCreate)]
    public async Task<ActionResult<ApiResponse<CartonPackingDto>>> Cancel(Guid id, [FromQuery] Guid? userId, CancellationToken ct) =>
        Ok(ApiResponse<CartonPackingDto>.Ok(await mediator.Send(new CancelCartonPackingCommand(id, userId), ct), "Carton packing cancelled."));

    [HttpGet, Authorize]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<CartonPackingDto>>>> Get(
        [FromQuery] Guid companyId, 
        [FromQuery] Guid? orderId, 
        [FromQuery] Guid? buyerPurchaseOrderId, 
        [FromQuery] string? status, 
        CancellationToken ct) =>
        Ok(ApiResponse<IReadOnlyList<CartonPackingDto>>.Ok(await mediator.Send(new GetCartonPackingsQuery(companyId, orderId, buyerPurchaseOrderId, status), ct)));

    [HttpGet("{id:guid}"), Authorize]
    public async Task<ActionResult<ApiResponse<CartonPackingDto>>> GetById(Guid id, CancellationToken ct) =>
        Ok(ApiResponse<CartonPackingDto>.Ok(await mediator.Send(new GetCartonPackingByIdQuery(id), ct)));
}
