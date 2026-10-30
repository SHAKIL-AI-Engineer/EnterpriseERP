using Asp.Versioning;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QualityService.Application;
using QualityService.Contracts;
using QualityService.Domain;

namespace QualityService.API.Controllers;

[ApiController, ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/defect-types")]
public sealed class DefectTypesController(IMediator mediator) : ControllerBase
{
    [HttpPost, Authorize(Policy = QualityPermissions.DefectManage)]
    public async Task<ActionResult<ApiResponse<DefectTypeDto>>> Create(CreateDefectTypeRequest request, CancellationToken ct) =>
        Ok(ApiResponse<DefectTypeDto>.Ok(await mediator.Send(new CreateDefectTypeCommand(request), ct), "Defect type registered."));

    [HttpGet, Authorize]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<DefectTypeDto>>>> Get(
        [FromQuery] Guid companyId, 
        [FromQuery] Guid? categoryId, 
        CancellationToken ct) =>
        Ok(ApiResponse<IReadOnlyList<DefectTypeDto>>.Ok(await mediator.Send(new GetDefectTypesQuery(companyId, categoryId), ct)));

    [HttpPut("{id:guid}"), Authorize(Policy = QualityPermissions.DefectManage)]
    public async Task<ActionResult<ApiResponse<DefectTypeDto>>> Update(Guid id, UpdateDefectTypeRequest request, CancellationToken ct) =>
        Ok(ApiResponse<DefectTypeDto>.Ok(await mediator.Send(new UpdateDefectTypeCommand(id, request), ct), "Defect type updated."));
}
