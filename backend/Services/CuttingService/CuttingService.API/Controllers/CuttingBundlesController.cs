using Asp.Versioning;
using CuttingService.Application;
using CuttingService.Contracts;
using CuttingService.Domain;
using Erp.BuildingBlocks.CommonResponses;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CuttingService.API.Controllers;

[ApiController, ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/cutting-bundles")]
public sealed class CuttingBundlesController(IMediator mediator) : ControllerBase
{
    [HttpGet, Authorize]
    public async Task<ActionResult<PaginatedApiResponse<CuttingBundleDto>>> Get(
        [FromQuery] CuttingBundleListQuery query,
        CancellationToken ct)
    {
        var result = await mediator.Send(new GetCuttingBundlesQuery(query), ct);
        return Ok(PaginatedApiResponse<CuttingBundleDto>.Ok(
            result.Data,
            result.Pagination,
            "Data loaded successfully",
            HttpContext.TraceIdentifier));
    }

    [HttpGet("summary"), Authorize]
    public async Task<ActionResult<CuttingService.Contracts.ApiResponse<CuttingBundleSummaryDto>>> GetSummary(
        [FromQuery] Guid companyId,
        [FromQuery] string? status,
        CancellationToken ct) =>
        Ok(CuttingService.Contracts.ApiResponse<CuttingBundleSummaryDto>.Ok(
            await mediator.Send(new GetCuttingBundleSummaryQuery(companyId, status), ct)));

    [HttpGet("{id:guid}"), Authorize]
    public async Task<ActionResult<CuttingService.Contracts.ApiResponse<CuttingBundleDto>>> GetById(Guid id, CancellationToken ct) =>
        Ok(CuttingService.Contracts.ApiResponse<CuttingBundleDto>.Ok(await mediator.Send(new GetCuttingBundleByIdQuery(id), ct)));

    [HttpPost, Authorize(Policy = CuttingPermissions.BundleManage)]
    public async Task<ActionResult<CuttingService.Contracts.ApiResponse<CuttingBundleDto>>> Create(CreateCuttingBundleRequest request, CancellationToken ct) =>
        Ok(CuttingService.Contracts.ApiResponse<CuttingBundleDto>.Ok(await mediator.Send(new CreateCuttingBundleCommand(request), ct), "Bundle created."));

    [HttpPut("{id:guid}"), Authorize(Policy = CuttingPermissions.BundleManage)]
    public async Task<ActionResult<CuttingService.Contracts.ApiResponse<CuttingBundleDto>>> Update(Guid id, UpdateCuttingBundleRequest request, CancellationToken ct) =>
        Ok(CuttingService.Contracts.ApiResponse<CuttingBundleDto>.Ok(await mediator.Send(new UpdateCuttingBundleCommand(id, request), ct), "Bundle updated."));

    [HttpPatch("{id:guid}/status"), Authorize(Policy = CuttingPermissions.BundleManage)]
    public async Task<ActionResult<CuttingService.Contracts.ApiResponse<CuttingBundleDto>>> UpdateStatus(Guid id, UpdateBundleStatusRequest request, CancellationToken ct) =>
        Ok(CuttingService.Contracts.ApiResponse<CuttingBundleDto>.Ok(await mediator.Send(new UpdateCuttingBundleStatusCommand(id, request), ct), "Bundle status updated."));
}
