using MediatR;
using MerchandisingService.Application;
using MerchandisingService.Contracts;
using MerchandisingService.Domain;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MerchandisingService.API.Controllers;

[ApiController]
[Route("api/v1/merchandising/orders")]
public sealed class OrdersController(IMediator mediator) : ControllerBase
{
    [HttpPost]
    [Authorize(Policy = MerchandisingPolicies.OrderCreate)]
    public async Task<ActionResult<ApiResponse<OrderDto>>> Create(CreateOrderRequest request, CancellationToken cancellationToken) =>
        Ok(ApiResponse<OrderDto>.Ok(await mediator.Send(new CreateOrderCommand(request), cancellationToken), "Order created."));

    [HttpGet]
    [Authorize]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<OrderDto>>>> Get([FromQuery] Guid companyId, [FromQuery] Guid? buyerId, [FromQuery] string? status, CancellationToken cancellationToken) =>
        Ok(ApiResponse<IReadOnlyList<OrderDto>>.Ok(await mediator.Send(new GetOrdersQuery(companyId, buyerId, status), cancellationToken)));

    [HttpGet("template")]
    [Authorize]
    public async Task<IActionResult> GetImportTemplate(CancellationToken cancellationToken)
    {
        var bytes = await mediator.Send(new GetOrderImportTemplateQuery(), cancellationToken);
        return File(bytes, "text/csv", "order-import-template.csv");
    }

    [HttpPost("import/preview")]
    [Authorize(Policy = MerchandisingPolicies.OrderCreate)]
    public async Task<ActionResult<ApiResponse<OrderImportPreviewDto>>> PreviewImport([FromQuery] Guid? companyId, IFormFile file, CancellationToken cancellationToken)
    {
        if (file.Length == 0)
        {
            return BadRequest(ApiResponse<OrderImportPreviewDto>.Fail("Uploaded file is empty."));
        }

        await using var stream = file.OpenReadStream();
        var preview = await mediator.Send(new PreviewOrderImportCommand(companyId, stream), cancellationToken);
        return Ok(ApiResponse<OrderImportPreviewDto>.Ok(preview, "Import preview generated."));
    }

    [HttpPost("import")]
    [Authorize(Policy = MerchandisingPolicies.OrderCreate)]
    public async Task<ActionResult<ApiResponse<OrderImportResultDto>>> Import(ImportOrdersRequest request, CancellationToken cancellationToken) =>
        Ok(ApiResponse<OrderImportResultDto>.Ok(await mediator.Send(new ImportOrdersCommand(request.CompanyId, request.Rows), cancellationToken), "Orders imported."));

    [HttpGet("{id:guid}")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<OrderDto>>> GetById(Guid id, [FromQuery] Guid companyId, CancellationToken cancellationToken) =>
        Ok(ApiResponse<OrderDto>.Ok(await mediator.Send(new GetOrderByIdQuery(companyId, id), cancellationToken)));

    [HttpGet("{id:guid}/export")]
    [Authorize]
    public async Task<IActionResult> Export(Guid id, CancellationToken cancellationToken)
    {
        var bytes = await mediator.Send(new ExportOrderWorksheetQuery(id), cancellationToken);
        return File(bytes, "text/csv", $"order-{id}.csv");
    }

    [HttpGet("{id:guid}/details")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<OrderDetailsDto>>> GetDetails(Guid id, CancellationToken cancellationToken) =>
        Ok(ApiResponse<OrderDetailsDto>.Ok(await mediator.Send(new GetOrderDetailsQuery(id), cancellationToken)));

    [HttpPut("{id:guid}")]
    [Authorize(Policy = MerchandisingPolicies.OrderUpdate)]
    public async Task<ActionResult<ApiResponse<OrderDto>>> Update(Guid id, UpdateOrderRequest request, CancellationToken cancellationToken) =>
        Ok(ApiResponse<OrderDto>.Ok(await mediator.Send(new UpdateOrderCommand(id, request), cancellationToken), "Order updated."));

    [HttpPatch("{id:guid}/confirm")]
    [Authorize(Policy = MerchandisingPolicies.OrderConfirm)]
    public async Task<ActionResult<ApiResponse<OrderDto>>> Confirm(Guid id, [FromQuery] bool createRequisition = false, CancellationToken cancellationToken = default) =>
        Ok(ApiResponse<OrderDto>.Ok(await mediator.Send(new ConfirmOrderWithOptionsCommand(id, new ConfirmOrderOptions(true, createRequisition)), cancellationToken), "Order confirmed."));

    [HttpGet("{id:guid}/worksheet")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<ProgramOrderWorksheetDto>>> GetWorksheet(Guid id, CancellationToken cancellationToken) =>
        Ok(ApiResponse<ProgramOrderWorksheetDto>.Ok(await mediator.Send(new GetOrderWorksheetQuery(id), cancellationToken)));

    [HttpPost("{orderId:guid}/copy-style-bom")]
    [Authorize(Policy = MerchandisingPolicies.BomManage)]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<BomItemDto>>>> CopyStyleBom(Guid orderId, CopyStyleBomToOrderRequest request, CancellationToken cancellationToken) =>
        Ok(ApiResponse<IReadOnlyList<BomItemDto>>.Ok(await mediator.Send(new CopyStyleBomToOrderCommand(orderId, request), cancellationToken), "Style BOM copied to order."));

    [HttpPost("{orderId:guid}/costing/submit-approval")]
    [Authorize(Policy = MerchandisingPolicies.CostingManage)]
    public async Task<ActionResult<ApiResponse<OrderCostingDto>>> SubmitCostingApproval(Guid orderId, SubmitCostingApprovalRequest request, CancellationToken cancellationToken) =>
        Ok(ApiResponse<OrderCostingDto>.Ok(await mediator.Send(new SubmitCostingApprovalCommand(orderId, request), cancellationToken), "Costing submitted for approval."));

    [HttpPost("{orderId:guid}/assignment")]
    [Authorize(Policy = MerchandisingPolicies.OrderUpdate)]
    public async Task<ActionResult<ApiResponse<OrderAssignmentDto>>> CreateAssignment(Guid orderId, CreateOrderAssignmentRequest request, CancellationToken cancellationToken) =>
        Ok(ApiResponse<OrderAssignmentDto>.Ok(await mediator.Send(new CreateOrderAssignmentCommand(orderId, request), cancellationToken), "Order assignment created."));

    [HttpPost("{orderId:guid}/commercial-terms")]
    [Authorize(Policy = MerchandisingPolicies.OrderUpdate)]
    public async Task<ActionResult<ApiResponse<OrderCommercialTermsDto>>> CreateCommercialTerms(Guid orderId, CreateOrderCommercialTermsRequest request, CancellationToken cancellationToken) =>
        Ok(ApiResponse<OrderCommercialTermsDto>.Ok(await mediator.Send(new CreateOrderCommercialTermsCommand(orderId, request), cancellationToken), "Commercial terms created."));

    [HttpPatch("{id:guid}/cancel")]
    [Authorize(Policy = MerchandisingPolicies.OrderCancel)]
    public async Task<ActionResult<ApiResponse<OrderDto>>> Cancel(Guid id, CancellationToken cancellationToken) =>
        Ok(ApiResponse<OrderDto>.Ok(await mediator.Send(new CancelOrderCommand(id), cancellationToken), "Order cancelled."));

    [HttpPost("{orderId:guid}/buyer-pos")]
    [Authorize(Policy = MerchandisingPolicies.OrderUpdate)]
    public async Task<ActionResult<ApiResponse<BuyerPurchaseOrderDto>>> CreateBuyerPo(Guid orderId, CreateBuyerPoRequest request, CancellationToken cancellationToken) =>
        Ok(ApiResponse<BuyerPurchaseOrderDto>.Ok(await mediator.Send(new CreateBuyerPoCommand(orderId, request), cancellationToken), "Buyer PO created."));

    [HttpGet("{orderId:guid}/buyer-pos")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<BuyerPurchaseOrderDto>>>> GetBuyerPos(Guid orderId, CancellationToken cancellationToken) =>
        Ok(ApiResponse<IReadOnlyList<BuyerPurchaseOrderDto>>.Ok(await mediator.Send(new GetBuyerPosQuery(orderId), cancellationToken)));

    [HttpPost("{orderId:guid}/color-size-breakdown")]
    [Authorize(Policy = MerchandisingPolicies.OrderUpdate)]
    public async Task<ActionResult<ApiResponse<ColorSizeBreakdownDto>>> CreateBreakdown(Guid orderId, CreateColorSizeBreakdownRequest request, CancellationToken cancellationToken) =>
        Ok(ApiResponse<ColorSizeBreakdownDto>.Ok(await mediator.Send(new CreateColorSizeBreakdownCommand(orderId, request), cancellationToken), "Color-size breakdown created."));

    [HttpGet("{orderId:guid}/color-size-breakdown")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<ColorSizeBreakdownDto>>>> GetBreakdown(Guid orderId, CancellationToken cancellationToken) =>
        Ok(ApiResponse<IReadOnlyList<ColorSizeBreakdownDto>>.Ok(await mediator.Send(new GetColorSizeBreakdownQuery(orderId), cancellationToken)));

    [HttpPost("{orderId:guid}/bom-items")]
    [Authorize(Policy = MerchandisingPolicies.BomManage)]
    public async Task<ActionResult<ApiResponse<BomItemDto>>> CreateBomItem(Guid orderId, CreateBomItemRequest request, CancellationToken cancellationToken) =>
        Ok(ApiResponse<BomItemDto>.Ok(await mediator.Send(new CreateBomItemCommand(orderId, request), cancellationToken), "BOM item created."));

    [HttpGet("{orderId:guid}/bom-items")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<BomItemDto>>>> GetBomItems(Guid orderId, CancellationToken cancellationToken) =>
        Ok(ApiResponse<IReadOnlyList<BomItemDto>>.Ok(await mediator.Send(new GetBomItemsQuery(orderId), cancellationToken)));

    [HttpPost("{orderId:guid}/bom-calculate")]
    [Authorize(Policy = MerchandisingPolicies.BomManage)]
    public async Task<ActionResult<ApiResponse<BomCalculationResultDto>>> CalculateBom(Guid orderId, CancellationToken cancellationToken) =>
        Ok(ApiResponse<BomCalculationResultDto>.Ok(await mediator.Send(new CalculateBomCommand(orderId), cancellationToken), "BOM recalculated."));

    [HttpPost("{orderId:guid}/costing")]
    [Authorize(Policy = MerchandisingPolicies.CostingManage)]
    public async Task<ActionResult<ApiResponse<OrderCostingDto>>> CreateCosting(Guid orderId, CreateOrderCostingRequest request, CancellationToken cancellationToken) =>
        Ok(ApiResponse<OrderCostingDto>.Ok(await mediator.Send(new CreateOrderCostingCommand(orderId, request), cancellationToken), "Costing created."));

    [HttpGet("{orderId:guid}/costing")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<OrderCostingDto?>>> GetCosting(Guid orderId, CancellationToken cancellationToken) =>
        Ok(ApiResponse<OrderCostingDto?>.Ok(await mediator.Send(new GetOrderCostingQuery(orderId), cancellationToken)));

    [HttpPut("{orderId:guid}/costing")]
    [Authorize(Policy = MerchandisingPolicies.CostingManage)]
    public async Task<ActionResult<ApiResponse<OrderCostingDto>>> UpdateCosting(Guid orderId, CreateOrderCostingRequest request, CancellationToken cancellationToken) =>
        Ok(ApiResponse<OrderCostingDto>.Ok(await mediator.Send(new UpdateOrderCostingCommand(orderId, request), cancellationToken), "Costing updated."));
}

[ApiController]
[Route("api/v1/merchandising/buyer-pos")]
public sealed class BuyerPosController(IMediator mediator) : ControllerBase
{
    [HttpPut("{id:guid}")]
    [Authorize(Policy = MerchandisingPolicies.OrderUpdate)]
    public async Task<ActionResult<ApiResponse<BuyerPurchaseOrderDto>>> Update(Guid id, UpdateBuyerPoRequest request, CancellationToken cancellationToken) =>
        Ok(ApiResponse<BuyerPurchaseOrderDto>.Ok(await mediator.Send(new UpdateBuyerPoCommand(id, request), cancellationToken), "Buyer PO updated."));
}

[ApiController]
[Route("api/v1/merchandising/color-size-breakdown")]
public sealed class ColorSizeBreakdownController(IMediator mediator) : ControllerBase
{
    [HttpPut("{id:guid}")]
    [Authorize(Policy = MerchandisingPolicies.OrderUpdate)]
    public async Task<ActionResult<ApiResponse<ColorSizeBreakdownDto>>> Update(Guid id, UpdateColorSizeBreakdownRequest request, CancellationToken cancellationToken) =>
        Ok(ApiResponse<ColorSizeBreakdownDto>.Ok(await mediator.Send(new UpdateColorSizeBreakdownCommand(id, request), cancellationToken), "Color-size breakdown updated."));

    [HttpDelete("{id:guid}")]
    [Authorize(Policy = MerchandisingPolicies.OrderUpdate)]
    public async Task<ActionResult<ApiResponse<bool>>> Delete(Guid id, CancellationToken cancellationToken)
    {
        await mediator.Send(new DeleteColorSizeBreakdownCommand(id), cancellationToken);
        return Ok(ApiResponse<bool>.Ok(true, "Color-size breakdown deleted."));
    }
}

[ApiController]
[Route("api/v1/merchandising/bom-items")]
public sealed class BomItemsController(IMediator mediator) : ControllerBase
{
    [HttpPut("{id:guid}")]
    [Authorize(Policy = MerchandisingPolicies.BomManage)]
    public async Task<ActionResult<ApiResponse<BomItemDto>>> Update(Guid id, UpdateBomItemRequest request, CancellationToken cancellationToken) =>
        Ok(ApiResponse<BomItemDto>.Ok(await mediator.Send(new UpdateBomItemCommand(id, request), cancellationToken), "BOM item updated."));

    [HttpDelete("{id:guid}")]
    [Authorize(Policy = MerchandisingPolicies.BomManage)]
    public async Task<ActionResult<ApiResponse<bool>>> Delete(Guid id, CancellationToken cancellationToken)
    {
        await mediator.Send(new DeleteBomItemCommand(id), cancellationToken);
        return Ok(ApiResponse<bool>.Ok(true, "BOM item deleted."));
    }
}
