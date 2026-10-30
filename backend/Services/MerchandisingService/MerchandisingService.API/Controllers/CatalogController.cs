using MediatR;
using MerchandisingService.Application;
using MerchandisingService.Contracts;
using MerchandisingService.Domain;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MerchandisingService.API.Controllers;

[ApiController]
[Route("api/v1/merchandising/seasons")]
public sealed class SeasonsController(IMediator mediator) : ControllerBase
{
    [HttpPost]
    [Authorize(Policy = MerchandisingPolicies.StyleManage)]
    public async Task<ActionResult<ApiResponse<SeasonDto>>> Create(CreateSeasonRequest request, CancellationToken cancellationToken) =>
        Ok(ApiResponse<SeasonDto>.Ok(await mediator.Send(new CreateSeasonCommand(request), cancellationToken), "Season created."));

    [HttpGet]
    [Authorize]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<SeasonDto>>>> Get([FromQuery] Guid companyId, CancellationToken cancellationToken) =>
        Ok(ApiResponse<IReadOnlyList<SeasonDto>>.Ok(await mediator.Send(new GetSeasonsQuery(companyId), cancellationToken)));
}

[ApiController]
[Route("api/v1/merchandising/garment-items")]
public sealed class GarmentItemsController(IMediator mediator) : ControllerBase
{
    [HttpPost]
    [Authorize(Policy = MerchandisingPolicies.StyleManage)]
    public async Task<ActionResult<ApiResponse<GarmentItemDto>>> Create(CreateGarmentItemRequest request, CancellationToken cancellationToken) =>
        Ok(ApiResponse<GarmentItemDto>.Ok(await mediator.Send(new CreateGarmentItemCommand(request), cancellationToken), "Garment item created."));

    [HttpGet]
    [Authorize]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<GarmentItemDto>>>> Get([FromQuery] Guid companyId, CancellationToken cancellationToken) =>
        Ok(ApiResponse<IReadOnlyList<GarmentItemDto>>.Ok(await mediator.Send(new GetGarmentItemsQuery(companyId), cancellationToken)));
}

[ApiController]
[Route("api/v1/merchandising/styles")]
public sealed class StylesController(IMediator mediator) : ControllerBase
{
    [HttpPost]
    [Authorize(Policy = MerchandisingPolicies.StyleManage)]
    public async Task<ActionResult<ApiResponse<StyleDto>>> Create(CreateStyleRequest request, CancellationToken cancellationToken) =>
        Ok(ApiResponse<StyleDto>.Ok(await mediator.Send(new CreateStyleCommand(request), cancellationToken), "Style created."));

    [HttpGet]
    [Authorize]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<StyleDto>>>> Get([FromQuery] Guid companyId, [FromQuery] Guid? buyerId, CancellationToken cancellationToken) =>
        Ok(ApiResponse<IReadOnlyList<StyleDto>>.Ok(await mediator.Send(new GetStylesQuery(companyId, buyerId), cancellationToken)));

    [HttpGet("{id:guid}")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<StyleDto>>> GetById(Guid id, [FromQuery] Guid companyId, CancellationToken cancellationToken) =>
        Ok(ApiResponse<StyleDto>.Ok(await mediator.Send(new GetStyleByIdQuery(companyId, id), cancellationToken)));

    [HttpPut("{id:guid}")]
    [Authorize(Policy = MerchandisingPolicies.StyleManage)]
    public async Task<ActionResult<ApiResponse<StyleDto>>> Update(Guid id, UpdateStyleRequest request, CancellationToken cancellationToken) =>
        Ok(ApiResponse<StyleDto>.Ok(await mediator.Send(new UpdateStyleCommand(id, request), cancellationToken), "Style updated."));

    [HttpGet("{styleId:guid}/versions")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<StyleVersionDto>>>> GetVersions(Guid styleId, CancellationToken cancellationToken) =>
        Ok(ApiResponse<IReadOnlyList<StyleVersionDto>>.Ok(await mediator.Send(new GetStyleVersionsQuery(styleId), cancellationToken)));

    [HttpPost("versions")]
    [Authorize(Policy = MerchandisingPolicies.StyleManage)]
    public async Task<ActionResult<ApiResponse<StyleVersionDto>>> CreateVersion(CreateStyleVersionRequest request, CancellationToken cancellationToken) =>
        Ok(ApiResponse<StyleVersionDto>.Ok(await mediator.Send(new CreateStyleVersionCommand(request), cancellationToken), "Style version created."));

    [HttpGet("{styleId:guid}/bom-items")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<StyleBomItemDto>>>> GetBomItems(Guid styleId, CancellationToken cancellationToken) =>
        Ok(ApiResponse<IReadOnlyList<StyleBomItemDto>>.Ok(await mediator.Send(new GetStyleBomItemsQuery(styleId), cancellationToken)));

    [HttpPost("bom-items")]
    [Authorize(Policy = MerchandisingPolicies.BomManage)]
    public async Task<ActionResult<ApiResponse<StyleBomItemDto>>> CreateBomItem(CreateStyleBomItemRequest request, CancellationToken cancellationToken) =>
        Ok(ApiResponse<StyleBomItemDto>.Ok(await mediator.Send(new CreateStyleBomItemCommand(request), cancellationToken), "Style BOM item created."));
}
