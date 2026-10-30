using System.Security.Claims;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PayrollService.Application;
using PayrollService.Contracts;
using PayrollService.Domain.Enums;

namespace PayrollService.Api.Controllers;

[ApiController]
[Route("api/v1/salary-increments")]
public sealed class SalaryIncrementsController(IMediator mediator) : ControllerBase
{
    [HttpPost]
    [Authorize(Policy = PayrollPermissions.SalaryIncrementRequest)]
    public async Task<IActionResult> Create(SalaryIncrementRequest request) => Ok(await mediator.Send(new CreateSalaryIncrementCommand(request with { RequestedBy = Guid.Parse(User.FindFirstValue("sub")!) })));

    [HttpGet]
    public async Task<IActionResult> Get([FromQuery] Guid companyId, [FromQuery] Guid? employeeId) => Ok(await mediator.Send(new GetSalaryIncrementHistoryQuery(companyId, employeeId)));

    [HttpPatch("{id:guid}/approve")]
    [Authorize(Policy = PayrollPermissions.SalaryIncrementApprove)]
    public async Task<IActionResult> Approve(Guid id, ApprovalRequest request) => Ok(await mediator.Send(new ApproveSalaryIncrementCommand(id, Guid.Parse(User.FindFirstValue("sub")!))));

    [HttpPatch("{id:guid}/reject")]
    [Authorize(Policy = PayrollPermissions.SalaryIncrementApprove)]
    public async Task<IActionResult> Reject(Guid id, ApprovalRequest request) => Ok(await mediator.Send(new RejectSalaryIncrementCommand(id, Guid.Parse(User.FindFirstValue("sub")!), request.Remarks)));
}
