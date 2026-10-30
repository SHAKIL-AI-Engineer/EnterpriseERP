using System.Security.Claims;
using MediatR;
using MerchandisingService.Application;
using MerchandisingService.Contracts;
using MerchandisingService.Domain;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MerchandisingService.API.Controllers;

[ApiController]
[Route("api/v1/merchandising/approvals")]
public sealed class ApprovalsController(IMediator mediator) : ControllerBase
{
    [HttpPost]
    [Authorize(Policy = MerchandisingPolicies.ApprovalManage)]
    public async Task<ActionResult<ApiResponse<ApprovalRequestDto>>> Create(CreateApprovalRequestRequest request, CancellationToken cancellationToken) =>
        Ok(ApiResponse<ApprovalRequestDto>.Ok(await mediator.Send(new CreateApprovalRequestCommand(request with { RequestedBy = User.FindFirstValue("sub")! }), cancellationToken), "Approval request created."));

    [HttpGet("{id:guid}")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<ApprovalRequestDto>>> GetById(Guid id, [FromQuery] Guid companyId, CancellationToken cancellationToken) =>
        Ok(ApiResponse<ApprovalRequestDto>.Ok(await mediator.Send(new GetApprovalRequestQuery(companyId, id), cancellationToken)));

    [HttpGet("pending")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<ApprovalRequestDto>>>> GetPending([FromQuery] Guid companyId, CancellationToken cancellationToken) =>
        Ok(ApiResponse<IReadOnlyList<ApprovalRequestDto>>.Ok(await mediator.Send(new GetPendingApprovalsQuery(companyId), cancellationToken)));

    [HttpPost("{requestId:guid}/steps/{stepId:guid}/approve")]
    [Authorize(Policy = MerchandisingPolicies.ApprovalManage)]
    public async Task<ActionResult<ApiResponse<ApprovalRequestDto>>> Approve(Guid requestId, Guid stepId, ApproveStepRequest request, CancellationToken cancellationToken) =>
        Ok(ApiResponse<ApprovalRequestDto>.Ok(await mediator.Send(new ApproveStepCommand(requestId, stepId, request with { ApproverUserId = Guid.Parse(User.FindFirstValue("sub")!) }), cancellationToken), "Step approved."));

    [HttpPost("{requestId:guid}/steps/{stepId:guid}/reject")]
    [Authorize(Policy = MerchandisingPolicies.ApprovalManage)]
    public async Task<ActionResult<ApiResponse<ApprovalRequestDto>>> Reject(Guid requestId, Guid stepId, RejectStepRequest request, CancellationToken cancellationToken) =>
        Ok(ApiResponse<ApprovalRequestDto>.Ok(await mediator.Send(new RejectStepCommand(requestId, stepId, request with { ApproverUserId = Guid.Parse(User.FindFirstValue("sub")!) }), cancellationToken), "Step rejected."));
}

[ApiController]
[Route("api/v1/merchandising/shipment-executions")]
public sealed class ShipmentExecutionsController(IMediator mediator) : ControllerBase
{
    [HttpPost]
    [Authorize(Policy = MerchandisingPolicies.ShipmentExecutionManage)]
    public async Task<ActionResult<ApiResponse<ShipmentExecutionDto>>> Create(CreateShipmentExecutionRequest request, CancellationToken cancellationToken) =>
        Ok(ApiResponse<ShipmentExecutionDto>.Ok(await mediator.Send(new CreateShipmentExecutionCommand(request), cancellationToken), "Shipment execution created."));

    [HttpGet]
    [Authorize]
    public async Task<ActionResult<ApiResponse<ShipmentExecutionDto?>>> GetByPlan([FromQuery] Guid companyId, [FromQuery] Guid shipmentPlanId, CancellationToken cancellationToken) =>
        Ok(ApiResponse<ShipmentExecutionDto?>.Ok(await mediator.Send(new GetShipmentExecutionQuery(companyId, shipmentPlanId), cancellationToken)));

    [HttpPost("packing-lists")]
    [Authorize(Policy = MerchandisingPolicies.ShipmentExecutionManage)]
    public async Task<ActionResult<ApiResponse<PackingListDto>>> CreatePackingList(CreatePackingListRequest request, CancellationToken cancellationToken) =>
        Ok(ApiResponse<PackingListDto>.Ok(await mediator.Send(new CreatePackingListCommand(request), cancellationToken), "Packing list created."));
}
