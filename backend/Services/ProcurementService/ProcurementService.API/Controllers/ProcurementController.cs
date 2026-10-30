using MediatR;
using ProcurementService.Application;
using ProcurementService.Contracts;
using Microsoft.AspNetCore.Mvc;

namespace ProcurementService.API.Controllers;

[ApiController]
[Route("api/v1/procurement")]
public sealed class ProcurementController(IMediator mediator) : ControllerBase
{
    [HttpPost("requisitions/{requisitionId:guid}/create-po")]
    public async Task<ActionResult<Guid>> CreatePoFromRequisition(Guid requisitionId, CreatePurchaseOrderFromRequisitionRequest request, CancellationToken cancellationToken) =>
        Ok(await mediator.Send(new CreatePurchaseOrderFromRequisitionCommand(requisitionId, request), cancellationToken));

    [HttpPost("requisitions/from-bom")]
    public async Task<ActionResult<Guid>> CreateFromBom([FromBody] CreatePurchaseOrderFromBomRequest request, CancellationToken cancellationToken) =>
        Ok(await mediator.Send(new CreatePurchaseOrderFromBomCommand(request.CompanyId, request.OrderId), cancellationToken));

    [HttpPost("po-lines/{lineId:guid}/receive")]
    public async Task<ActionResult<ApiResponse<SupplierPurchaseOrderLineDto>>> ReceiveLine(Guid lineId, ReceivePurchaseOrderLineRequest request, CancellationToken cancellationToken) =>
        Ok(ApiResponse<SupplierPurchaseOrderLineDto>.Ok(await mediator.Send(new ReceivePurchaseOrderLineCommand(lineId, request), cancellationToken), "Line received."));
}

public sealed record CreatePurchaseOrderFromBomRequest(Guid CompanyId, Guid OrderId);
