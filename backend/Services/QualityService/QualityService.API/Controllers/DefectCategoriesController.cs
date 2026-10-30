using Asp.Versioning;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QualityService.Application;
using QualityService.Contracts;
using QualityService.Domain;

namespace QualityService.API.Controllers;

[ApiController, ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/defect-categories")]
public sealed class DefectCategoriesController(IMediator mediator) : ControllerBase
{
    [HttpPost, Authorize(Policy = QualityPermissions.DefectManage)]
    public async Task<ActionResult<ApiResponse<DefectCategoryDto>>> Create(CreateDefectCategoryRequest request, CancellationToken ct) =>
        Ok(ApiResponse<DefectCategoryDto>.Ok(await mediator.Send(new CreateDefectCategoryCommand(request), ct), "Defect category created."));

    [HttpGet, Authorize]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<DefectCategoryDto>>>> Get([FromQuery] Guid companyId, CancellationToken ct) =>
        Ok(ApiResponse<IReadOnlyList<DefectCategoryDto>>.Ok(await mediator.Send(new GetDefectCategoriesQuery(companyId), ct)));
}
