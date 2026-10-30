using System.Security.Claims;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PayrollService.Application;
using PayrollService.Contracts;
using PayrollService.Domain.Enums;

namespace PayrollService.Api.Controllers;

[ApiController]
[Route("api/v1/salary-advances")]
public sealed class SalaryAdvancesController(IMediator mediator) : ControllerBase
{
    [HttpPost]
    [Authorize(Policy = PayrollPermissions.SalaryAdvanceRequest)]
    public async Task<IActionResult> Create(SalaryAdvanceRequest request) => Ok(await mediator.Send(new CreateSalaryAdvanceCommand(request with { RequestedBy = Guid.Parse(User.FindFirstValue("sub")!) })));

    [HttpGet("list")]
    public async Task<IActionResult> List(
        [FromQuery] Guid companyId,
        [FromQuery] string? status,
        [FromQuery] int? year,
        [FromQuery] int? month) =>
        Ok(await mediator.Send(new ListSalaryAdvancesQuery(companyId, status, year, month)));

    [HttpGet("summary")]
    public async Task<IActionResult> Summary(
        [FromQuery] Guid companyId,
        [FromQuery] int? year,
        [FromQuery] int? month) =>
        Ok(await mediator.Send(new GetSalaryAdvanceSummaryQuery(companyId, year, month)));

    [HttpPost("batch")]
    [Authorize(Policy = PayrollPermissions.SalaryAdvanceRequest)]
    public async Task<IActionResult> BatchCreate(BatchSalaryAdvanceRequest request) =>
        Ok(await mediator.Send(new BatchCreateSalaryAdvanceCommand(request with { RequestedBy = Guid.Parse(User.FindFirstValue("sub")!) })));

    [HttpPost("batch-delete")]
    [Authorize(Policy = PayrollPermissions.SalaryAdvanceRequest)]
    public async Task<IActionResult> BatchDelete(BatchDeleteSalaryAdvanceRequest request) =>
        Ok(await mediator.Send(new BatchDeleteSalaryAdvanceCommand(request)));

    [HttpGet]
    public async Task<IActionResult> Get([FromQuery] Guid companyId, [FromQuery] Guid employeeId) =>
        Ok(await mediator.Send(new GetSalaryAdvanceBalanceQuery(companyId, employeeId)));

    [HttpPatch("{id:guid}/approve")]
    [Authorize(Policy = PayrollPermissions.SalaryAdvanceApprove)]
    public async Task<IActionResult> Approve(Guid id, ApprovalRequest request) => Ok(await mediator.Send(new ApproveSalaryAdvanceCommand(id, Guid.Parse(User.FindFirstValue("sub")!))));

    [HttpPatch("{id:guid}/reject")]
    [Authorize(Policy = PayrollPermissions.SalaryAdvanceApprove)]
    public async Task<IActionResult> Reject(Guid id, ApprovalRequest request) => Ok(await mediator.Send(new RejectSalaryAdvanceCommand(id, Guid.Parse(User.FindFirstValue("sub")!), request.Remarks)));

    [HttpGet("{employeeId:guid}/balance")]
    public async Task<IActionResult> Balance(Guid employeeId, [FromQuery] Guid companyId) => Ok(await mediator.Send(new GetSalaryAdvanceBalanceQuery(companyId, employeeId)));
}
