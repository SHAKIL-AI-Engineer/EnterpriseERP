using MediatR;
using MerchandisingService.Application;
using MerchandisingService.Contracts;
using MerchandisingService.Domain;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MerchandisingService.API.Controllers;

[ApiController]
[Route("api/v1/merchandising/styles/{styleId:guid}/documents")]
public sealed class StyleDocumentsController(IMediator mediator) : ControllerBase
{
    [HttpPost]
    [Authorize(Policy = MerchandisingPolicies.DocumentManage)]
    public async Task<ActionResult<ApiResponse<StyleDocumentDto>>> Create(Guid styleId, CreateStyleDocumentRequest request, CancellationToken cancellationToken)
    {
        if (request.StyleId != styleId)
        {
            return BadRequest(ApiResponse<StyleDocumentDto>.Fail("StyleId in route and body must match."));
        }

        var result = await mediator.Send(new CreateStyleDocumentCommand(request), cancellationToken);
        return Ok(ApiResponse<StyleDocumentDto>.Ok(result, "Style document created."));
    }

    [HttpGet]
    [Authorize]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<StyleDocumentDto>>>> Get(Guid styleId, [FromQuery] Guid companyId, CancellationToken cancellationToken) =>
        Ok(ApiResponse<IReadOnlyList<StyleDocumentDto>>.Ok(await mediator.Send(new GetStyleDocumentsQuery(companyId, styleId), cancellationToken)));
}

[ApiController]
[Route("api/v1/merchandising/orders/{orderId:guid}/documents")]
public sealed class OrderDocumentsController(IMediator mediator) : ControllerBase
{
    [HttpPost]
    [Authorize(Policy = MerchandisingPolicies.DocumentManage)]
    public async Task<ActionResult<ApiResponse<OrderDocumentDto>>> Create(Guid orderId, CreateOrderDocumentRequest request, CancellationToken cancellationToken)
    {
        if (request.OrderId != orderId)
        {
            return BadRequest(ApiResponse<OrderDocumentDto>.Fail("OrderId in route and body must match."));
        }

        var result = await mediator.Send(new CreateOrderDocumentCommand(request), cancellationToken);
        return Ok(ApiResponse<OrderDocumentDto>.Ok(result, "Order document created."));
    }

    [HttpGet]
    [Authorize]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<OrderDocumentDto>>>> Get(Guid orderId, [FromQuery] Guid companyId, CancellationToken cancellationToken) =>
        Ok(ApiResponse<IReadOnlyList<OrderDocumentDto>>.Ok(await mediator.Send(new GetOrderDocumentsQuery(companyId, orderId), cancellationToken)));
}
