using AccountsService.Application;
using AccountsService.Contracts;
using AccountsService.Domain;
using Asp.Versioning;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AccountsService.API.Controllers;

[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/chart-of-accounts")]
public sealed class ChartOfAccountsController(IMediator mediator) : ControllerBase
{
    [HttpPost, Authorize(Policy = AccountsPermissions.CoaManage)]
    public async Task<ActionResult<ApiResponse<ChartOfAccountDto>>> Create(CreateChartOfAccountRequest request, CancellationToken ct) => Ok(ApiResponse<ChartOfAccountDto>.Ok(await mediator.Send(new CreateChartOfAccountCommand(request), ct), "Account created."));

    [HttpGet, Authorize]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<ChartOfAccountDto>>>> Get([FromQuery] Guid companyId, CancellationToken ct) => Ok(ApiResponse<IReadOnlyList<ChartOfAccountDto>>.Ok(await mediator.Send(new GetChartOfAccountsQuery(companyId), ct)));

    [HttpGet("{id:guid}"), Authorize]
    public async Task<ActionResult<ApiResponse<ChartOfAccountDto>>> GetById(Guid id, CancellationToken ct) => Ok(ApiResponse<ChartOfAccountDto>.Ok(await mediator.Send(new GetChartOfAccountByIdQuery(id), ct)));

    [HttpPut("{id:guid}"), Authorize(Policy = AccountsPermissions.CoaManage)]
    public async Task<ActionResult<ApiResponse<ChartOfAccountDto>>> Update(Guid id, UpdateChartOfAccountRequest request, CancellationToken ct) => Ok(ApiResponse<ChartOfAccountDto>.Ok(await mediator.Send(new UpdateChartOfAccountCommand(id, request), ct), "Account updated."));

    [HttpPatch("{id:guid}/activate"), Authorize(Policy = AccountsPermissions.CoaManage)]
    public async Task<ActionResult<ApiResponse<ChartOfAccountDto>>> Activate(Guid id, CancellationToken ct) => Ok(ApiResponse<ChartOfAccountDto>.Ok(await mediator.Send(new SetChartOfAccountActiveCommand(id, true), ct), "Account activated."));

    [HttpPatch("{id:guid}/deactivate"), Authorize(Policy = AccountsPermissions.CoaManage)]
    public async Task<ActionResult<ApiResponse<ChartOfAccountDto>>> Deactivate(Guid id, CancellationToken ct) => Ok(ApiResponse<ChartOfAccountDto>.Ok(await mediator.Send(new SetChartOfAccountActiveCommand(id, false), ct), "Account deactivated."));
}

[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/fiscal-years")]
public sealed class FiscalYearsController(IMediator mediator) : ControllerBase
{
    [HttpPost, Authorize(Policy = AccountsPermissions.CoaManage)]
    public async Task<ActionResult<ApiResponse<FiscalYearDto>>> Create(CreateFiscalYearRequest request, CancellationToken ct) => Ok(ApiResponse<FiscalYearDto>.Ok(await mediator.Send(new CreateFiscalYearCommand(request), ct), "Fiscal year created."));

    [HttpGet, Authorize]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<FiscalYearDto>>>> Get([FromQuery] Guid companyId, CancellationToken ct) => Ok(ApiResponse<IReadOnlyList<FiscalYearDto>>.Ok(await mediator.Send(new GetFiscalYearsQuery(companyId), ct)));

    [HttpPatch("{id:guid}/close"), Authorize(Policy = AccountsPermissions.CoaManage)]
    public async Task<ActionResult<ApiResponse<FiscalYearDto>>> Close(Guid id, [FromQuery] Guid? userId, CancellationToken ct) => Ok(ApiResponse<FiscalYearDto>.Ok(await mediator.Send(new CloseFiscalYearCommand(id, userId), ct), "Fiscal year closed."));
}
