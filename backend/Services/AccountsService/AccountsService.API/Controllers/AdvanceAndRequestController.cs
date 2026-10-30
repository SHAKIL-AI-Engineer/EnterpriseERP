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
[Route("api/v{version:apiVersion}/money-requests")]
public sealed class MoneyRequestsController(IMediator mediator) : ControllerBase
{
    [HttpPost, Authorize(Policy = AccountsPermissions.MoneyRequestCreate)]
    public async Task<ActionResult<ApiResponse<MoneyRequestDto>>> Create(CreateMoneyRequestRequest request, CancellationToken ct) => Ok(ApiResponse<MoneyRequestDto>.Ok(await mediator.Send(new CreateMoneyRequestCommand(request), ct), "Money request created."));
    [HttpGet, Authorize]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<MoneyRequestDto>>>> Get([FromQuery] Guid companyId, [FromQuery] string? status, CancellationToken ct) => Ok(ApiResponse<IReadOnlyList<MoneyRequestDto>>.Ok(await mediator.Send(new GetMoneyRequestsQuery(companyId, status), ct)));
    [HttpGet("{id:guid}"), Authorize]
    public async Task<ActionResult<ApiResponse<MoneyRequestDto>>> GetById(Guid id, CancellationToken ct) => Ok(ApiResponse<MoneyRequestDto>.Ok(await mediator.Send(new GetMoneyRequestByIdQuery(id), ct)));
    [HttpPatch("{id:guid}/approve"), Authorize(Policy = AccountsPermissions.MoneyRequestApprove)]
    public async Task<ActionResult<ApiResponse<MoneyRequestDto>>> Approve(Guid id, ApproveMoneyRequestRequest request, CancellationToken ct) => Ok(ApiResponse<MoneyRequestDto>.Ok(await mediator.Send(new ApproveMoneyRequestCommand(id, request), ct), "Money request approved."));
    [HttpPatch("{id:guid}/reject"), Authorize(Policy = AccountsPermissions.MoneyRequestApprove)]
    public async Task<ActionResult<ApiResponse<MoneyRequestDto>>> Reject(Guid id, [FromQuery] Guid? userId, CancellationToken ct) => Ok(ApiResponse<MoneyRequestDto>.Ok(await mediator.Send(new RejectMoneyRequestCommand(id, userId), ct), "Money request rejected."));
    [HttpPatch("{id:guid}/pay"), Authorize(Policy = AccountsPermissions.VoucherPost)]
    public async Task<ActionResult<ApiResponse<MoneyRequestDto>>> Pay(Guid id, [FromQuery] Guid? userId, CancellationToken ct) => Ok(ApiResponse<MoneyRequestDto>.Ok(await mediator.Send(new PayMoneyRequestCommand(id, userId), ct), "Money request paid."));
}

[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/advance-payments")]
public sealed class AdvancePaymentsController(IMediator mediator) : ControllerBase
{
    [HttpPost, Authorize(Policy = AccountsPermissions.AdvancePayCreate)]
    public async Task<ActionResult<ApiResponse<AdvancePaymentDto>>> Create(CreateAdvancePaymentRequest request, CancellationToken ct) => Ok(ApiResponse<AdvancePaymentDto>.Ok(await mediator.Send(new CreateAdvancePaymentCommand(request), ct), "Advance payment created."));
    [HttpGet, Authorize]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<AdvancePaymentDto>>>> Get([FromQuery] Guid companyId, [FromQuery] DateOnly? fromDate, [FromQuery] DateOnly? toDate, CancellationToken ct) => Ok(ApiResponse<IReadOnlyList<AdvancePaymentDto>>.Ok(await mediator.Send(new GetAdvancePaymentsQuery(companyId, fromDate, toDate), ct)));
    [HttpGet("{id:guid}"), Authorize]
    public async Task<ActionResult<ApiResponse<AdvancePaymentDto>>> GetById(Guid id, CancellationToken ct) => Ok(ApiResponse<AdvancePaymentDto>.Ok(await mediator.Send(new GetAdvancePaymentByIdQuery(id), ct)));
    [HttpPatch("{id:guid}/approve"), Authorize(Policy = AccountsPermissions.AdvancePayApprove)]
    public async Task<ActionResult<ApiResponse<AdvancePaymentDto>>> Approve(Guid id, [FromQuery] Guid? userId, CancellationToken ct) => Ok(ApiResponse<AdvancePaymentDto>.Ok(await mediator.Send(new ApproveAdvancePaymentCommand(id, userId), ct), "Advance payment approved."));
    [HttpPatch("{id:guid}/pay"), Authorize(Policy = AccountsPermissions.VoucherPost)]
    public async Task<ActionResult<ApiResponse<AdvancePaymentDto>>> Pay(Guid id, [FromQuery] Guid? userId, CancellationToken ct) => Ok(ApiResponse<AdvancePaymentDto>.Ok(await mediator.Send(new PayAdvancePaymentCommand(id, userId), ct), "Advance payment paid."));
}

[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/advance-salary-payments")]
public sealed class AdvanceSalaryPaymentsController(IMediator mediator) : ControllerBase
{
    [HttpPost, Authorize(Policy = AccountsPermissions.AdvanceSalaryPayCreate)]
    public async Task<ActionResult<ApiResponse<AdvanceSalaryPaymentDto>>> Create(CreateAdvanceSalaryPaymentRequest request, CancellationToken ct) => Ok(ApiResponse<AdvanceSalaryPaymentDto>.Ok(await mediator.Send(new CreateAdvanceSalaryPaymentCommand(request), ct), "Advance salary payment created."));
    [HttpGet, Authorize]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<AdvanceSalaryPaymentDto>>>> Get([FromQuery] Guid companyId, [FromQuery] Guid? employeeId, CancellationToken ct) => Ok(ApiResponse<IReadOnlyList<AdvanceSalaryPaymentDto>>.Ok(await mediator.Send(new GetAdvanceSalaryPaymentsQuery(companyId, employeeId), ct)));
    [HttpGet("{id:guid}"), Authorize]
    public async Task<ActionResult<ApiResponse<AdvanceSalaryPaymentDto>>> GetById(Guid id, CancellationToken ct) => Ok(ApiResponse<AdvanceSalaryPaymentDto>.Ok(await mediator.Send(new GetAdvanceSalaryPaymentByIdQuery(id), ct)));
    [HttpPatch("{id:guid}/approve"), Authorize(Policy = AccountsPermissions.AdvanceSalaryPayApprove)]
    public async Task<ActionResult<ApiResponse<AdvanceSalaryPaymentDto>>> Approve(Guid id, [FromQuery] Guid? userId, CancellationToken ct) => Ok(ApiResponse<AdvanceSalaryPaymentDto>.Ok(await mediator.Send(new ApproveAdvanceSalaryPaymentCommand(id, userId), ct), "Advance salary payment approved."));
    [HttpPatch("{id:guid}/pay"), Authorize(Policy = AccountsPermissions.VoucherPost)]
    public async Task<ActionResult<ApiResponse<AdvanceSalaryPaymentDto>>> Pay(Guid id, [FromQuery] Guid? userId, CancellationToken ct) => Ok(ApiResponse<AdvanceSalaryPaymentDto>.Ok(await mediator.Send(new PayAdvanceSalaryPaymentCommand(id, userId), ct), "Advance salary payment paid."));
}

[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/company-money-transfers")]
public sealed class CompanyMoneyTransfersController(IMediator mediator) : ControllerBase
{
    [HttpPost, Authorize(Policy = AccountsPermissions.CompanyTransferCreate)]
    public async Task<ActionResult<ApiResponse<CompanyMoneyTransferDto>>> Create(CreateCompanyMoneyTransferRequest request, CancellationToken ct) => Ok(ApiResponse<CompanyMoneyTransferDto>.Ok(await mediator.Send(new CreateCompanyMoneyTransferCommand(request), ct), "Company transfer created."));
    [HttpGet, Authorize]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<CompanyMoneyTransferDto>>>> Get([FromQuery] Guid? fromCompanyId, [FromQuery] Guid? toCompanyId, CancellationToken ct) => Ok(ApiResponse<IReadOnlyList<CompanyMoneyTransferDto>>.Ok(await mediator.Send(new GetCompanyMoneyTransfersQuery(fromCompanyId, toCompanyId), ct)));
    [HttpGet("{id:guid}"), Authorize]
    public async Task<ActionResult<ApiResponse<CompanyMoneyTransferDto>>> GetById(Guid id, CancellationToken ct) => Ok(ApiResponse<CompanyMoneyTransferDto>.Ok(await mediator.Send(new GetCompanyMoneyTransferByIdQuery(id), ct)));
    [HttpPatch("{id:guid}/approve"), Authorize(Policy = AccountsPermissions.CompanyTransferApprove)]
    public async Task<ActionResult<ApiResponse<CompanyMoneyTransferDto>>> Approve(Guid id, [FromQuery] Guid? userId, CancellationToken ct) => Ok(ApiResponse<CompanyMoneyTransferDto>.Ok(await mediator.Send(new ApproveCompanyMoneyTransferCommand(id, userId), ct), "Company transfer approved."));
    [HttpPatch("{id:guid}/transfer"), Authorize(Policy = AccountsPermissions.CompanyTransferApprove)]
    public async Task<ActionResult<ApiResponse<CompanyMoneyTransferDto>>> Transfer(Guid id, [FromQuery] Guid? userId, CancellationToken ct) => Ok(ApiResponse<CompanyMoneyTransferDto>.Ok(await mediator.Send(new CompleteCompanyMoneyTransferCommand(id, userId), ct), "Company transfer completed."));
    [HttpPatch("{id:guid}/reject"), Authorize(Policy = AccountsPermissions.CompanyTransferApprove)]
    public async Task<ActionResult<ApiResponse<CompanyMoneyTransferDto>>> Reject(Guid id, [FromQuery] Guid? userId, CancellationToken ct) => Ok(ApiResponse<CompanyMoneyTransferDto>.Ok(await mediator.Send(new RejectCompanyMoneyTransferCommand(id, userId), ct), "Company transfer rejected."));
}
