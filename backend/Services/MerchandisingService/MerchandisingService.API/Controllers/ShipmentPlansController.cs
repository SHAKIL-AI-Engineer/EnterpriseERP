using MediatR;
using MerchandisingService.Application;
using MerchandisingService.Contracts;
using MerchandisingService.Domain;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MerchandisingService.API.Controllers;

[ApiController]
[Route("api/v1/merchandising/shipment-plans")]
public sealed class ShipmentPlansController(IMediator mediator) : ControllerBase
{
    [HttpPost]
    [Authorize(Policy = MerchandisingPolicies.ShipmentPlanManage)]
    public async Task<ActionResult<ApiResponse<ShipmentPlanDto>>> Create(CreateShipmentPlanRequest request, CancellationToken cancellationToken) =>
        Ok(ApiResponse<ShipmentPlanDto>.Ok(await mediator.Send(new CreateShipmentPlanCommand(request), cancellationToken), "Shipment plan created."));

    [HttpGet]
    [Authorize]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<ShipmentPlanDto>>>> Get([FromQuery] Guid companyId, [FromQuery] Guid? orderId, CancellationToken cancellationToken) =>
        Ok(ApiResponse<IReadOnlyList<ShipmentPlanDto>>.Ok(await mediator.Send(new GetShipmentPlansQuery(companyId, orderId), cancellationToken)));

    [HttpPut("{id:guid}")]
    [Authorize(Policy = MerchandisingPolicies.ShipmentPlanManage)]
    public async Task<ActionResult<ApiResponse<ShipmentPlanDto>>> Update(Guid id, UpdateShipmentPlanRequest request, CancellationToken cancellationToken) =>
        Ok(ApiResponse<ShipmentPlanDto>.Ok(await mediator.Send(new UpdateShipmentPlanCommand(id, request), cancellationToken), "Shipment plan updated."));
}
