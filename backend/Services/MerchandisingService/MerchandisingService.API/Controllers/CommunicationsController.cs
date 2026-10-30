using MediatR;
using MerchandisingService.Application;
using MerchandisingService.Contracts;
using MerchandisingService.Domain;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MerchandisingService.API.Controllers;

[ApiController]
[Route("api/v1/merchandising/communications")]
public sealed class CommunicationsController(IMediator mediator) : ControllerBase
{
    [HttpPost]
    [Authorize(Policy = MerchandisingPolicies.CommunicationManage)]
    public async Task<ActionResult<ApiResponse<CommunicationLogDto>>> Create(CreateCommunicationLogRequest request, CancellationToken cancellationToken) =>
        Ok(ApiResponse<CommunicationLogDto>.Ok(await mediator.Send(new CreateCommunicationLogCommand(request), cancellationToken), "Communication logged."));

    [HttpGet]
    [Authorize]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<CommunicationLogDto>>>> Get(
        [FromQuery] Guid companyId,
        [FromQuery] Guid? styleId,
        [FromQuery] Guid? orderId,
        CancellationToken cancellationToken) =>
        Ok(ApiResponse<IReadOnlyList<CommunicationLogDto>>.Ok(await mediator.Send(new GetCommunicationLogsQuery(companyId, styleId, orderId), cancellationToken)));
}
