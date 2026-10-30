using MediatR;
using MerchandisingService.Application;
using MerchandisingService.Contracts;
using MerchandisingService.Domain;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MerchandisingService.API.Controllers;

[ApiController]
[Route("api/v1/merchandising/master/{resource}")]
public sealed class MasterDataController(IMediator mediator) : ControllerBase
{
    [HttpPost]
    [Authorize(Policy = MerchandisingPolicies.MasterManage)]
    public async Task<ActionResult<ApiResponse<MasterDataDto>>> Create(string resource, CreateMasterDataRequest request, CancellationToken cancellationToken) =>
        Ok(ApiResponse<MasterDataDto>.Ok(await mediator.Send(new CreateMasterDataCommand(resource, request), cancellationToken), "Master data created."));

    [HttpGet]
    [Authorize]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<MasterDataDto>>>> Get(string resource, [FromQuery] Guid companyId, CancellationToken cancellationToken) =>
        Ok(ApiResponse<IReadOnlyList<MasterDataDto>>.Ok(await mediator.Send(new GetMasterDataListQuery(resource, companyId), cancellationToken)));

    [HttpGet("{id:guid}")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<MasterDataDto>>> GetById(string resource, Guid id, [FromQuery] Guid companyId, CancellationToken cancellationToken) =>
        Ok(ApiResponse<MasterDataDto>.Ok(await mediator.Send(new GetMasterDataByIdQuery(resource, companyId, id), cancellationToken)));

    [HttpPut("{id:guid}")]
    [Authorize(Policy = MerchandisingPolicies.MasterManage)]
    public async Task<ActionResult<ApiResponse<MasterDataDto>>> Update(string resource, Guid id, UpdateMasterDataRequest request, CancellationToken cancellationToken) =>
        Ok(ApiResponse<MasterDataDto>.Ok(await mediator.Send(new UpdateMasterDataCommand(resource, id, request), cancellationToken), "Master data updated."));

    [HttpDelete("{id:guid}")]
    [Authorize(Policy = MerchandisingPolicies.MasterManage)]
    public async Task<ActionResult<ApiResponse<bool>>> Delete(string resource, Guid id, CancellationToken cancellationToken)
    {
        await mediator.Send(new DeleteMasterDataCommand(resource, id), cancellationToken);
        return Ok(ApiResponse<bool>.Ok(true, "Master data deleted."));
    }
}
