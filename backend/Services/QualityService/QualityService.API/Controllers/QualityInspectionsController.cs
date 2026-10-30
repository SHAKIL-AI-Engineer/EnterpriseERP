using Asp.Versioning;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QualityService.Application;
using QualityService.Contracts;
using QualityService.Domain;

namespace QualityService.API.Controllers;

[ApiController, ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/quality-inspections")]
public sealed class QualityInspectionsController(IMediator mediator) : ControllerBase
{
    [HttpPost, Authorize(Policy = QualityPermissions.InspectionCreate)]
    public async Task<ActionResult<ApiResponse<QualityInspectionDto>>> Create(CreateQualityInspectionRequest request, CancellationToken ct) =>
        Ok(ApiResponse<QualityInspectionDto>.Ok(await mediator.Send(new CreateQualityInspectionCommand(request), ct), "Inspection recorded in draft state."));

    [HttpGet, Authorize]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<QualityInspectionDto>>>> Get(
        [FromQuery] Guid companyId,
        [FromQuery] Guid? orderId,
        [FromQuery] string? inspectionType,
        [FromQuery] DateOnly? fromDate,
        [FromQuery] DateOnly? toDate,
        CancellationToken ct) =>
        Ok(ApiResponse<IReadOnlyList<QualityInspectionDto>>.Ok(await mediator.Send(new GetQualityInspectionsQuery(companyId, orderId, inspectionType, fromDate, toDate), ct)));

    [HttpGet("{id:guid}"), Authorize]
    public async Task<ActionResult<ApiResponse<QualityInspectionDto>>> GetById(Guid id, CancellationToken ct) =>
        Ok(ApiResponse<QualityInspectionDto>.Ok(await mediator.Send(new GetQualityInspectionByIdQuery(id), ct)));

    [HttpPut("{id:guid}"), Authorize(Policy = QualityPermissions.InspectionCreate)]
    public async Task<ActionResult<ApiResponse<QualityInspectionDto>>> Update(Guid id, UpdateQualityInspectionRequest request, CancellationToken ct) =>
        Ok(ApiResponse<QualityInspectionDto>.Ok(await mediator.Send(new UpdateQualityInspectionCommand(id, request), ct), "Inspection updated."));

    [HttpPatch("{id:guid}/submit"), Authorize(Policy = QualityPermissions.InspectionCreate)]
    public async Task<ActionResult<ApiResponse<QualityInspectionDto>>> Submit(Guid id, [FromQuery] Guid? userId, CancellationToken ct) =>
        Ok(ApiResponse<QualityInspectionDto>.Ok(await mediator.Send(new SubmitQualityInspectionCommand(id, userId), ct), "Inspection submitted for review."));

    [HttpPatch("{id:guid}/approve"), Authorize(Policy = QualityPermissions.InspectionApprove)]
    public async Task<ActionResult<ApiResponse<QualityInspectionDto>>> Approve(Guid id, [FromQuery] Guid? userId, CancellationToken ct) =>
        Ok(ApiResponse<QualityInspectionDto>.Ok(await mediator.Send(new ApproveQualityInspectionCommand(id, userId), ct), "Inspection approved and sealed."));

    [HttpPatch("{id:guid}/cancel"), Authorize(Policy = QualityPermissions.InspectionApprove)]
    public async Task<ActionResult<ApiResponse<QualityInspectionDto>>> Cancel(Guid id, [FromQuery] Guid? userId, CancellationToken ct) =>
        Ok(ApiResponse<QualityInspectionDto>.Ok(await mediator.Send(new CancelQualityInspectionCommand(id, userId), ct), "Inspection cancelled."));

    [HttpPost("{inspectionId:guid}/defects"), Authorize(Policy = QualityPermissions.InspectionCreate)]
    public async Task<ActionResult<ApiResponse<QualityInspectionDefectDto>>> AddDefect(Guid inspectionId, QualityInspectionDefectRequest request, CancellationToken ct) =>
        Ok(ApiResponse<QualityInspectionDefectDto>.Ok(await mediator.Send(new AddInspectionDefectCommand(inspectionId, request), ct), "Defect added to inspection sheet."));

    [HttpGet("{inspectionId:guid}/defects"), Authorize]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<QualityInspectionDefectDto>>>> GetDefects(Guid inspectionId, CancellationToken ct) =>
        Ok(ApiResponse<IReadOnlyList<QualityInspectionDefectDto>>.Ok(await mediator.Send(new GetInspectionDefectsQuery(inspectionId), ct)));
}
