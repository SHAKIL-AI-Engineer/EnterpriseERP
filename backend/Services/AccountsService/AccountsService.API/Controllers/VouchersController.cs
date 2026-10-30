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
[Route("api/v{version:apiVersion}/vouchers")]
public sealed class VouchersController(IMediator mediator) : ControllerBase
{
    [HttpPost, Authorize(Policy = AccountsPermissions.VoucherCreate)]
    public async Task<ActionResult<ApiResponse<VoucherDto>>> Create(CreateVoucherRequest request, CancellationToken ct) => Ok(ApiResponse<VoucherDto>.Ok(await mediator.Send(new CreateVoucherCommand(request), ct), "Voucher created."));

    [HttpGet, Authorize]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<VoucherDto>>>> Get([FromQuery] Guid companyId, [FromQuery] DateOnly? fromDate, [FromQuery] DateOnly? toDate, [FromQuery] string? type, CancellationToken ct) => Ok(ApiResponse<IReadOnlyList<VoucherDto>>.Ok(await mediator.Send(new GetVouchersQuery(companyId, fromDate, toDate, type), ct)));

    [HttpGet("{id:guid}"), Authorize]
    public async Task<ActionResult<ApiResponse<VoucherDto>>> GetById(Guid id, CancellationToken ct) => Ok(ApiResponse<VoucherDto>.Ok(await mediator.Send(new GetVoucherByIdQuery(id), ct)));

    [HttpPatch("{id:guid}/submit"), Authorize(Policy = AccountsPermissions.VoucherCreate)]
    public async Task<ActionResult<ApiResponse<VoucherDto>>> Submit(Guid id, [FromQuery] Guid? userId, CancellationToken ct) => Ok(ApiResponse<VoucherDto>.Ok(await mediator.Send(new SubmitVoucherCommand(id, userId), ct), "Voucher submitted."));

    [HttpPatch("{id:guid}/approve"), Authorize(Policy = AccountsPermissions.VoucherApprove)]
    public async Task<ActionResult<ApiResponse<VoucherDto>>> Approve(Guid id, [FromQuery] Guid? userId, CancellationToken ct) => Ok(ApiResponse<VoucherDto>.Ok(await mediator.Send(new ApproveVoucherCommand(id, userId), ct), "Voucher approved."));

    [HttpPatch("{id:guid}/post"), Authorize(Policy = AccountsPermissions.VoucherPost)]
    public async Task<ActionResult<ApiResponse<VoucherDto>>> Post(Guid id, [FromQuery] Guid? userId, CancellationToken ct) => Ok(ApiResponse<VoucherDto>.Ok(await mediator.Send(new PostVoucherCommand(id, userId), ct), "Voucher posted."));

    [HttpPatch("{id:guid}/cancel"), Authorize(Policy = AccountsPermissions.VoucherApprove)]
    public async Task<ActionResult<ApiResponse<VoucherDto>>> Cancel(Guid id, [FromQuery] Guid? userId, CancellationToken ct) => Ok(ApiResponse<VoucherDto>.Ok(await mediator.Send(new CancelVoucherCommand(id, userId), ct), "Voucher cancelled."));
}
