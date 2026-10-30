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
[Route("api/v{version:apiVersion}/cash-receipts")]
public sealed class CashReceiptsController(IMediator mediator) : ControllerBase
{
    [HttpPost, Authorize(Policy = AccountsPermissions.CashReceiveCreate)]
    public async Task<ActionResult<ApiResponse<CashReceiptDto>>> Create(CreateCashReceiptRequest request, CancellationToken ct) => Ok(ApiResponse<CashReceiptDto>.Ok(await mediator.Send(new CreateCashReceiptCommand(request), ct), "Cash receipt created."));
    [HttpGet, Authorize]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<CashReceiptDto>>>> Get([FromQuery] Guid companyId, [FromQuery] DateOnly? fromDate, [FromQuery] DateOnly? toDate, CancellationToken ct) => Ok(ApiResponse<IReadOnlyList<CashReceiptDto>>.Ok(await mediator.Send(new GetCashReceiptsQuery(companyId, fromDate, toDate), ct)));
    [HttpGet("{id:guid}"), Authorize]
    public async Task<ActionResult<ApiResponse<CashReceiptDto>>> GetById(Guid id, CancellationToken ct) => Ok(ApiResponse<CashReceiptDto>.Ok(await mediator.Send(new GetCashReceiptByIdQuery(id), ct)));
    [HttpPatch("{id:guid}/approve"), Authorize(Policy = AccountsPermissions.CashReceiveApprove)]
    public async Task<ActionResult<ApiResponse<CashReceiptDto>>> Approve(Guid id, [FromQuery] Guid? userId, CancellationToken ct) => Ok(ApiResponse<CashReceiptDto>.Ok(await mediator.Send(new ApproveCashReceiptCommand(id, userId), ct), "Cash receipt approved."));
    [HttpPatch("{id:guid}/post"), Authorize(Policy = AccountsPermissions.VoucherPost)]
    public async Task<ActionResult<ApiResponse<CashReceiptDto>>> Post(Guid id, [FromQuery] Guid? userId, CancellationToken ct) => Ok(ApiResponse<CashReceiptDto>.Ok(await mediator.Send(new PostCashReceiptCommand(id, userId), ct), "Cash receipt posted."));
    [HttpPatch("{id:guid}/cancel"), Authorize(Policy = AccountsPermissions.CashReceiveApprove)]
    public async Task<ActionResult<ApiResponse<CashReceiptDto>>> Cancel(Guid id, [FromQuery] Guid? userId, CancellationToken ct) => Ok(ApiResponse<CashReceiptDto>.Ok(await mediator.Send(new CancelCashReceiptCommand(id, userId), ct), "Cash receipt cancelled."));
}

[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/money-receipts")]
public sealed class MoneyReceiptsController(IMediator mediator) : ControllerBase
{
    [HttpPost, Authorize(Policy = AccountsPermissions.CashReceiveCreate)]
    public async Task<ActionResult<ApiResponse<MoneyReceiptDto>>> Create(CreateMoneyReceiptRequest request, CancellationToken ct) => Ok(ApiResponse<MoneyReceiptDto>.Ok(await mediator.Send(new CreateMoneyReceiptCommand(request), ct), "Money receipt created."));
    [HttpGet, Authorize]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<MoneyReceiptDto>>>> Get([FromQuery] Guid companyId, [FromQuery] DateOnly? fromDate, [FromQuery] DateOnly? toDate, CancellationToken ct) => Ok(ApiResponse<IReadOnlyList<MoneyReceiptDto>>.Ok(await mediator.Send(new GetMoneyReceiptsQuery(companyId, fromDate, toDate), ct)));
    [HttpGet("{id:guid}"), Authorize]
    public async Task<ActionResult<ApiResponse<MoneyReceiptDto>>> GetById(Guid id, CancellationToken ct) => Ok(ApiResponse<MoneyReceiptDto>.Ok(await mediator.Send(new GetMoneyReceiptByIdQuery(id), ct)));
    [HttpPatch("{id:guid}/approve"), Authorize(Policy = AccountsPermissions.CashReceiveApprove)]
    public async Task<ActionResult<ApiResponse<MoneyReceiptDto>>> Approve(Guid id, [FromQuery] Guid? userId, CancellationToken ct) => Ok(ApiResponse<MoneyReceiptDto>.Ok(await mediator.Send(new ApproveMoneyReceiptCommand(id, userId), ct), "Money receipt approved."));
    [HttpPatch("{id:guid}/post"), Authorize(Policy = AccountsPermissions.VoucherPost)]
    public async Task<ActionResult<ApiResponse<MoneyReceiptDto>>> Post(Guid id, [FromQuery] Guid? userId, CancellationToken ct) => Ok(ApiResponse<MoneyReceiptDto>.Ok(await mediator.Send(new PostMoneyReceiptCommand(id, userId), ct), "Money receipt posted."));
}

[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/daily-expenses")]
public sealed class DailyExpensesController(IMediator mediator) : ControllerBase
{
    [HttpPost, Authorize(Policy = AccountsPermissions.DailyExpenseCreate)]
    public async Task<ActionResult<ApiResponse<DailyExpenseDto>>> Create(CreateDailyExpenseRequest request, CancellationToken ct) => Ok(ApiResponse<DailyExpenseDto>.Ok(await mediator.Send(new CreateDailyExpenseCommand(request), ct), "Daily expense created."));
    [HttpGet, Authorize]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<DailyExpenseDto>>>> Get([FromQuery] Guid companyId, [FromQuery] DateOnly? fromDate, [FromQuery] DateOnly? toDate, CancellationToken ct) => Ok(ApiResponse<IReadOnlyList<DailyExpenseDto>>.Ok(await mediator.Send(new GetDailyExpensesQuery(companyId, fromDate, toDate), ct)));
    [HttpGet("{id:guid}"), Authorize]
    public async Task<ActionResult<ApiResponse<DailyExpenseDto>>> GetById(Guid id, CancellationToken ct) => Ok(ApiResponse<DailyExpenseDto>.Ok(await mediator.Send(new GetDailyExpenseByIdQuery(id), ct)));
    [HttpPatch("{id:guid}/approve"), Authorize(Policy = AccountsPermissions.DailyExpenseApprove)]
    public async Task<ActionResult<ApiResponse<DailyExpenseDto>>> Approve(Guid id, [FromQuery] Guid? userId, CancellationToken ct) => Ok(ApiResponse<DailyExpenseDto>.Ok(await mediator.Send(new ApproveDailyExpenseCommand(id, userId), ct), "Daily expense approved."));
    [HttpPatch("{id:guid}/pay"), Authorize(Policy = AccountsPermissions.VoucherPost)]
    public async Task<ActionResult<ApiResponse<DailyExpenseDto>>> Pay(Guid id, [FromQuery] Guid? userId, CancellationToken ct) => Ok(ApiResponse<DailyExpenseDto>.Ok(await mediator.Send(new PayDailyExpenseCommand(id, userId), ct), "Daily expense paid."));
    [HttpPatch("{id:guid}/reject"), Authorize(Policy = AccountsPermissions.DailyExpenseApprove)]
    public async Task<ActionResult<ApiResponse<DailyExpenseDto>>> Reject(Guid id, [FromQuery] Guid? userId, CancellationToken ct) => Ok(ApiResponse<DailyExpenseDto>.Ok(await mediator.Send(new RejectDailyExpenseCommand(id, userId), ct), "Daily expense rejected."));
}
