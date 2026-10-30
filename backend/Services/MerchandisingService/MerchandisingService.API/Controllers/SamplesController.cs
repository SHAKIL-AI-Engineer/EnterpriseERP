using MediatR;
using MerchandisingService.Application;
using MerchandisingService.Contracts;
using MerchandisingService.Domain;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MerchandisingService.API.Controllers;

[ApiController]
[Route("api/v1/merchandising/samples")]
public sealed class SamplesController(IMediator mediator) : ControllerBase
{
    [HttpPost]
    [Authorize(Policy = MerchandisingPolicies.SampleManage)]
    public async Task<ActionResult<ApiResponse<SampleDto>>> Create(CreateSampleRequest request, CancellationToken cancellationToken) =>
        Ok(ApiResponse<SampleDto>.Ok(await mediator.Send(new CreateSampleCommand(request), cancellationToken), "Sample created."));

    [HttpGet]
    [Authorize]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<SampleDto>>>> Get([FromQuery] Guid companyId, [FromQuery] Guid? styleId, CancellationToken cancellationToken) =>
        Ok(ApiResponse<IReadOnlyList<SampleDto>>.Ok(await mediator.Send(new GetSamplesQuery(companyId, styleId), cancellationToken)));

    [HttpPatch("{id:guid}/approve")]
    [Authorize(Policy = MerchandisingPolicies.SampleManage)]
    public async Task<ActionResult<ApiResponse<SampleDto>>> Approve(Guid id, CancellationToken cancellationToken) =>
        Ok(ApiResponse<SampleDto>.Ok(await mediator.Send(new ApproveSampleCommand(id), cancellationToken), "Sample approved."));

    [HttpPatch("{id:guid}/reject")]
    [Authorize(Policy = MerchandisingPolicies.SampleManage)]
    public async Task<ActionResult<ApiResponse<SampleDto>>> Reject(Guid id, CancellationToken cancellationToken) =>
        Ok(ApiResponse<SampleDto>.Ok(await mediator.Send(new RejectSampleCommand(id), cancellationToken), "Sample rejected."));

    [HttpPatch("{id:guid}/submit")]
    [Authorize(Policy = MerchandisingPolicies.SampleManage)]
    public async Task<ActionResult<ApiResponse<SampleDto>>> Submit(Guid id, SubmitSampleRequest request, CancellationToken cancellationToken) =>
        Ok(ApiResponse<SampleDto>.Ok(await mediator.Send(new SubmitSampleCommand(id, request), cancellationToken), "Sample submitted."));

    [HttpPatch("{id:guid}/revise")]
    [Authorize(Policy = MerchandisingPolicies.SampleManage)]
    public async Task<ActionResult<ApiResponse<SampleDto>>> Revise(Guid id, ReviseSampleRequest request, CancellationToken cancellationToken) =>
        Ok(ApiResponse<SampleDto>.Ok(await mediator.Send(new ReviseSampleCommand(id, request), cancellationToken), "Sample revised."));

    [HttpPost("{id:guid}/costing")]
    [Authorize(Policy = MerchandisingPolicies.SampleManage)]
    public async Task<ActionResult<ApiResponse<SampleCostingDto>>> CreateCosting(Guid id, CreateSampleCostingRequest request, CancellationToken cancellationToken) =>
        Ok(ApiResponse<SampleCostingDto>.Ok(await mediator.Send(new CreateSampleCostingCommand(id, request), cancellationToken), "Sample costing created."));
}
