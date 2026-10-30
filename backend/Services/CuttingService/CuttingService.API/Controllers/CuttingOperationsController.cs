using Asp.Versioning;
using CuttingService.Application;
using CuttingService.Contracts;
using CuttingService.Domain;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CuttingService.API.Controllers;

[ApiController, ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/fabric-issues-to-cutting")]
public sealed class FabricIssuesToCuttingController(IMediator mediator) : ControllerBase
{
    [HttpPost, Authorize(Policy = CuttingPermissions.PlanUpdate)]
    public async Task<ActionResult<ApiResponse<FabricIssueToCuttingDto>>> Create(CreateFabricIssueToCuttingRequest request, CancellationToken ct) => Ok(ApiResponse<FabricIssueToCuttingDto>.Ok(await mediator.Send(new CreateFabricIssueToCuttingCommand(request), ct), "Fabric issue received."));
    [HttpGet, Authorize]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<FabricIssueToCuttingDto>>>> Get([FromQuery] Guid companyId, [FromQuery] Guid? orderId, [FromQuery] Guid? planId, CancellationToken ct) => Ok(ApiResponse<IReadOnlyList<FabricIssueToCuttingDto>>.Ok(await mediator.Send(new GetFabricIssuesToCuttingQuery(companyId, orderId, planId), ct)));
    [HttpGet("{id:guid}"), Authorize]
    public async Task<ActionResult<ApiResponse<FabricIssueToCuttingDto>>> GetById(Guid id, CancellationToken ct) => Ok(ApiResponse<FabricIssueToCuttingDto>.Ok(await mediator.Send(new GetFabricIssueToCuttingByIdQuery(id), ct)));
}

[ApiController, ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/cutting-lays")]
public sealed class CuttingLaysController(IMediator mediator) : ControllerBase
{
    [HttpPost, Authorize(Policy = CuttingPermissions.PlanUpdate)]
    public async Task<ActionResult<ApiResponse<CuttingLayDto>>> Create(CreateCuttingLayRequest request, CancellationToken ct) => Ok(ApiResponse<CuttingLayDto>.Ok(await mediator.Send(new CreateCuttingLayCommand(request), ct), "Cutting lay created."));
    [HttpGet, Authorize]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<CuttingLayDto>>>> Get([FromQuery] Guid companyId, [FromQuery] Guid? planId, CancellationToken ct) => Ok(ApiResponse<IReadOnlyList<CuttingLayDto>>.Ok(await mediator.Send(new GetCuttingLaysQuery(companyId, planId), ct)));
    [HttpGet("{id:guid}"), Authorize]
    public async Task<ActionResult<ApiResponse<CuttingLayDto>>> GetById(Guid id, CancellationToken ct) => Ok(ApiResponse<CuttingLayDto>.Ok(await mediator.Send(new GetCuttingLayByIdQuery(id), ct)));
    [HttpPut("{id:guid}"), Authorize(Policy = CuttingPermissions.PlanUpdate)]
    public async Task<ActionResult<ApiResponse<CuttingLayDto>>> Update(Guid id, UpdateCuttingLayRequest request, CancellationToken ct) => Ok(ApiResponse<CuttingLayDto>.Ok(await mediator.Send(new UpdateCuttingLayCommand(id, request), ct), "Cutting lay updated."));
}

[ApiController, ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/cutting-outputs")]
public sealed class CuttingOutputsController(IMediator mediator) : ControllerBase
{
    [HttpPost, Authorize(Policy = CuttingPermissions.OutputCreate)]
    public async Task<ActionResult<ApiResponse<CuttingOutputDto>>> Create(CreateCuttingOutputRequest request, CancellationToken ct) => Ok(ApiResponse<CuttingOutputDto>.Ok(await mediator.Send(new CreateCuttingOutputCommand(request), ct), "Cutting output created."));
    [HttpGet, Authorize]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<CuttingOutputDto>>>> Get([FromQuery] Guid companyId, [FromQuery] Guid? orderId, [FromQuery] Guid? planId, CancellationToken ct) => Ok(ApiResponse<IReadOnlyList<CuttingOutputDto>>.Ok(await mediator.Send(new GetCuttingOutputsQuery(companyId, orderId, planId), ct)));
    [HttpGet("{id:guid}"), Authorize]
    public async Task<ActionResult<ApiResponse<CuttingOutputDto>>> GetById(Guid id, CancellationToken ct) => Ok(ApiResponse<CuttingOutputDto>.Ok(await mediator.Send(new GetCuttingOutputByIdQuery(id), ct)));
}

[ApiController, ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/cutting-wastages")]
public sealed class CuttingWastagesController(IMediator mediator) : ControllerBase
{
    [HttpPost, Authorize(Policy = CuttingPermissions.WastageCreate)]
    public async Task<ActionResult<ApiResponse<CuttingWastageDto>>> Create(CreateCuttingWastageRequest request, CancellationToken ct) => Ok(ApiResponse<CuttingWastageDto>.Ok(await mediator.Send(new CreateCuttingWastageCommand(request), ct), "Cutting wastage recorded."));
    [HttpGet, Authorize]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<CuttingWastageDto>>>> Get([FromQuery] Guid companyId, [FromQuery] Guid? orderId, [FromQuery] Guid? planId, CancellationToken ct) => Ok(ApiResponse<IReadOnlyList<CuttingWastageDto>>.Ok(await mediator.Send(new GetCuttingWastagesQuery(companyId, orderId, planId), ct)));
}

[ApiController, ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/cutting-balances")]
public sealed class CuttingBalancesController(IMediator mediator) : ControllerBase
{
    [HttpGet, Authorize(Policy = CuttingPermissions.BalanceView)]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<CuttingBalanceDto>>>> Get([FromQuery] Guid companyId, [FromQuery] Guid orderId, CancellationToken ct) => Ok(ApiResponse<IReadOnlyList<CuttingBalanceDto>>.Ok(await mediator.Send(new GetCuttingBalancesQuery(companyId, orderId), ct)));
    [HttpGet("order/{orderId:guid}"), Authorize(Policy = CuttingPermissions.BalanceView)]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<CuttingBalanceDto>>>> GetByOrder(Guid orderId, [FromQuery] Guid companyId, CancellationToken ct) => Ok(ApiResponse<IReadOnlyList<CuttingBalanceDto>>.Ok(await mediator.Send(new GetCuttingBalancesQuery(companyId, orderId), ct)));
}
