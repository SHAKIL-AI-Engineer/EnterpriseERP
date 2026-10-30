using Erp.BuildingBlocks.CommonResponses;
using Erp.BuildingBlocks.Contracts.Pagination;
using HRService.Application.Manpower;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HRService.Api.Controllers;

[ApiController]
[Route("api/v1/hr/[controller]")]
[Authorize]
public sealed class ManpowerRequirementsController(IManpowerRequirementService service) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<ApiResponse<PagedResult<ManpowerRequirementDto>>>> List(
        [FromQuery] ManpowerRequirementQuery query,
        CancellationToken cancellationToken)
    {
        var data = await service.ListAsync(query, cancellationToken);
        return Ok(ApiResponse<PagedResult<ManpowerRequirementDto>>.Ok(data, HttpContext.TraceIdentifier));
    }

    [HttpGet("summary")]
    public async Task<ActionResult<ApiResponse<IEnumerable<ManpowerRequirementSummaryDto>>>> Summary(
        [FromQuery] Guid companyId,
        CancellationToken cancellationToken)
    {
        var data = await service.GetSummaryAsync(companyId, cancellationToken);
        return Ok(ApiResponse<IEnumerable<ManpowerRequirementSummaryDto>>.Ok(data, HttpContext.TraceIdentifier));
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ApiResponse<ManpowerRequirementDto>>> Get(
        Guid id,
        CancellationToken cancellationToken)
    {
        var data = await service.GetByIdAsync(id, cancellationToken);
        if (data == null)
            return NotFound(ApiResponse<ManpowerRequirementDto>.Fail(HttpContext.TraceIdentifier, [new ApiError("NotFound", "Requirement not found")]));
        
        return Ok(ApiResponse<ManpowerRequirementDto>.Ok(data, HttpContext.TraceIdentifier));
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<Guid>>> Create(
        [FromBody] CreateManpowerRequirementDto dto,
        CancellationToken cancellationToken)
    {
        var id = await service.CreateAsync(dto, cancellationToken);
        return CreatedAtAction(nameof(Get), new { id }, ApiResponse<Guid>.Ok(id, HttpContext.TraceIdentifier));
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<ApiResponse<string>>> Update(
        Guid id,
        [FromBody] UpdateManpowerRequirementDto dto,
        CancellationToken cancellationToken)
    {
        await service.UpdateAsync(id, dto, cancellationToken);
        return Ok(ApiResponse<string>.Ok("Manpower requirement updated", HttpContext.TraceIdentifier));
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult<ApiResponse<string>>> Delete(
        Guid id,
        CancellationToken cancellationToken)
    {
        await service.DeleteAsync(id, cancellationToken);
        return Ok(ApiResponse<string>.Ok("Manpower requirement deleted", HttpContext.TraceIdentifier));
    }
}
