using Asp.Versioning;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QualityService.Application;
using QualityService.Contracts;
using QualityService.Domain;

namespace QualityService.API.Controllers;

[ApiController, ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/final-inspections")]
public sealed class FinalInspectionsController(IMediator mediator) : ControllerBase
{
    [HttpPost, Authorize(Policy = QualityPermissions.FinalInspectionCreate)]
    public async Task<ActionResult<ApiResponse<FinalInspectionDto>>> Create(CreateFinalInspectionRequest request, CancellationToken ct) =>
        Ok(ApiResponse<FinalInspectionDto>.Ok(await mediator.Send(new CreateFinalInspectionCommand(request), ct), "Final AQL inspection sheet registered."));

    [HttpGet, Authorize]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<FinalInspectionDto>>>> Get(
        [FromQuery] Guid companyId,
        [FromQuery] Guid? orderId,
        [FromQuery] DateOnly? fromDate,
        [FromQuery] DateOnly? toDate,
        CancellationToken ct) =>
        Ok(ApiResponse<IReadOnlyList<FinalInspectionDto>>.Ok(await mediator.Send(new GetFinalInspectionsQuery(companyId, orderId, fromDate, toDate), ct)));

    [HttpGet("{id:guid}"), Authorize]
    public async Task<ActionResult<ApiResponse<FinalInspectionDto>>> GetById(Guid id, CancellationToken ct) =>
        Ok(ApiResponse<FinalInspectionDto>.Ok(await mediator.Send(new GetFinalInspectionByIdQuery(id), ct)));

    [HttpPatch("{id:guid}/approve"), Authorize(Policy = QualityPermissions.FinalInspectionApprove)]
    public async Task<ActionResult<ApiResponse<FinalInspectionDto>>> Approve(Guid id, [FromQuery] Guid? userId, CancellationToken ct) =>
        Ok(ApiResponse<FinalInspectionDto>.Ok(await mediator.Send(new ApproveFinalInspectionCommand(id, userId), ct), "Final AQL inspection approved."));

    [HttpPatch("{id:guid}/cancel"), Authorize(Policy = QualityPermissions.FinalInspectionApprove)]
    public async Task<ActionResult<ApiResponse<FinalInspectionDto>>> Cancel(Guid id, [FromQuery] Guid? userId, CancellationToken ct) =>
        Ok(ApiResponse<FinalInspectionDto>.Ok(await mediator.Send(new CancelFinalInspectionCommand(id, userId), ct), "Final inspection cancelled."));
}
