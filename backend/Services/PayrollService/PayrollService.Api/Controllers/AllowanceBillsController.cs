using Microsoft.AspNetCore.Authorization;
using PayrollService.Domain.Enums;
using System.Security.Claims;
using MediatR;
using Microsoft.AspNetCore.Mvc;
using PayrollService.Application;
using PayrollService.Contracts;

namespace PayrollService.Api.Controllers;

[ApiController]
[Route("api/v1/allowance-bills")]
public sealed class AllowanceBillsController(IMediator mediator) : ControllerBase
{
    [HttpPost]
    public async Task<IActionResult> Create(AllowanceBillRequest request) => Ok(await mediator.Send(new CreateAllowanceBillCommand(request)));

    [HttpGet]
    public async Task<IActionResult> Get([FromQuery] Guid companyId, [FromQuery] Guid? employeeId, [FromQuery] DateOnly? fromDate, [FromQuery] DateOnly? toDate) =>
        Ok(await mediator.Send(new GetAllowanceBillsQuery(companyId, employeeId, fromDate, toDate)));

    [HttpPatch("{id:guid}/approve")]
    [Authorize(Policy = PayrollPermissions.SalaryAdvanceApprove)]
    public async Task<IActionResult> Approve(Guid id, ApprovalRequest request) => Ok(await mediator.Send(new ApproveAllowanceBillCommand(id, Guid.Parse(User.FindFirstValue("sub")!))));

    [HttpPatch("{id:guid}/reject")]
    [Authorize(Policy = PayrollPermissions.SalaryAdvanceApprove)]
    public async Task<IActionResult> Reject(Guid id, ApprovalRequest request) => Ok(await mediator.Send(new RejectAllowanceBillCommand(id, Guid.Parse(User.FindFirstValue("sub")!), request.Remarks)));
}
