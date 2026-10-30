using Asp.Versioning;
using FinishingService.Application;
using FinishingService.Contracts;
using FinishingService.Domain;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FinishingService.API.Controllers;

[ApiController, ApiVersion("1.0")]
[Route("api/v{version:apiVersion}")]
public sealed class FinishingOperationsController(IMediator mediator) : ControllerBase
{
    // Finishing Inputs
    [HttpPost("finishing-inputs"), Authorize(Policy = FinishingPermissions.InputCreate)]
    public async Task<ActionResult<ApiResponse<FinishingInputDto>>> CreateInput(CreateFinishingInputRequest request, CancellationToken ct) =>
        Ok(ApiResponse<FinishingInputDto>.Ok(await mediator.Send(new CreateFinishingInputCommand(request), ct), "Finishing input logged successfully."));

    [HttpGet("finishing-inputs"), Authorize]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<FinishingInputDto>>>> GetInputs([FromQuery] Guid companyId, [FromQuery] Guid? orderId, [FromQuery] Guid? batchId, CancellationToken ct) =>
        Ok(ApiResponse<IReadOnlyList<FinishingInputDto>>.Ok(await mediator.Send(new GetFinishingInputsQuery(companyId, orderId, batchId), ct)));

    // Ironing Outputs
    [HttpPost("ironing-outputs"), Authorize(Policy = FinishingPermissions.IroningCreate)]
    public async Task<ActionResult<ApiResponse<IroningOutputDto>>> CreateIroning(CreateIroningOutputRequest request, CancellationToken ct) =>
        Ok(ApiResponse<IroningOutputDto>.Ok(await mediator.Send(new CreateIroningOutputCommand(request), ct), "Ironing output logged successfully."));

    [HttpGet("ironing-outputs"), Authorize]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<IroningOutputDto>>>> GetIronings([FromQuery] Guid companyId, [FromQuery] Guid? orderId, [FromQuery] Guid? batchId, CancellationToken ct) =>
        Ok(ApiResponse<IReadOnlyList<IroningOutputDto>>.Ok(await mediator.Send(new GetIroningOutputsQuery(companyId, orderId, batchId), ct)));

    // Quality Control (QC)
    [HttpPost("finishing-qcs"), Authorize(Policy = FinishingPermissions.QCCreate)]
    public async Task<ActionResult<ApiResponse<FinishingQCDto>>> CreateQC(CreateFinishingQCRequest request, CancellationToken ct) =>
        Ok(ApiResponse<FinishingQCDto>.Ok(await mediator.Send(new CreateFinishingQCCommand(request), ct), "Quality check logged successfully."));

    [HttpGet("finishing-qcs"), Authorize]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<FinishingQCDto>>>> GetQCs([FromQuery] Guid companyId, [FromQuery] Guid? orderId, [FromQuery] Guid? batchId, CancellationToken ct) =>
        Ok(ApiResponse<IReadOnlyList<FinishingQCDto>>.Ok(await mediator.Send(new GetFinishingQCsQuery(companyId, orderId, batchId), ct)));

    // Folding / Poly Packing
    [HttpPost("folding-packings"), Authorize(Policy = FinishingPermissions.BatchCreate)]
    public async Task<ActionResult<ApiResponse<FoldingPackingDto>>> CreateFolding(CreateFoldingPackingRequest request, CancellationToken ct) =>
        Ok(ApiResponse<FoldingPackingDto>.Ok(await mediator.Send(new CreateFoldingPackingCommand(request), ct), "Folding & poly packing logged successfully."));

    [HttpGet("folding-packings"), Authorize]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<FoldingPackingDto>>>> GetFoldings([FromQuery] Guid companyId, [FromQuery] Guid? orderId, [FromQuery] Guid? batchId, CancellationToken ct) =>
        Ok(ApiResponse<IReadOnlyList<FoldingPackingDto>>.Ok(await mediator.Send(new GetFoldingPackingsQuery(companyId, orderId, batchId), ct)));

    // Wastages
    [HttpPost("finishing-wastages"), Authorize(Policy = FinishingPermissions.WastageCreate)]
    public async Task<ActionResult<ApiResponse<FinishingWastageDto>>> CreateWastage(CreateFinishingWastageRequest request, CancellationToken ct) =>
        Ok(ApiResponse<FinishingWastageDto>.Ok(await mediator.Send(new CreateFinishingWastageCommand(request), ct), "Wastage record logged successfully."));

    [HttpGet("finishing-wastages"), Authorize]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<FinishingWastageDto>>>> GetWastages([FromQuery] Guid companyId, [FromQuery] Guid? orderId, [FromQuery] Guid? batchId, CancellationToken ct) =>
        Ok(ApiResponse<IReadOnlyList<FinishingWastageDto>>.Ok(await mediator.Send(new GetFinishingWastagesQuery(companyId, orderId, batchId), ct)));
}
