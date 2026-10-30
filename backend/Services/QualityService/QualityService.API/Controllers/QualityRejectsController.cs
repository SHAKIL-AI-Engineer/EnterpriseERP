using Asp.Versioning;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QualityService.Application;
using QualityService.Contracts;
using QualityService.Domain;

namespace QualityService.API.Controllers;

[ApiController, ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/quality-rejects")]
public sealed class QualityRejectsController(IMediator mediator) : ControllerBase
{
    [HttpPost, Authorize(Policy = QualityPermissions.RejectCreate)]
    public async Task<ActionResult<ApiResponse<QualityRejectDto>>> Create(CreateQualityRejectRequest request, CancellationToken ct) =>
        Ok(ApiResponse<QualityRejectDto>.Ok(await mediator.Send(new CreateQualityRejectCommand(request), ct), "Reject sheet generated."));

    [HttpGet, Authorize]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<QualityRejectDto>>>> Get([FromQuery] Guid companyId, [FromQuery] Guid? orderId, CancellationToken ct) =>
        Ok(ApiResponse<IReadOnlyList<QualityRejectDto>>.Ok(await mediator.Send(new GetQualityRejectsQuery(companyId, orderId), ct)));
}
