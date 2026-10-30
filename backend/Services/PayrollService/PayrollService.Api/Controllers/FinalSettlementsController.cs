using System.Security.Claims;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PayrollService.Application;
using PayrollService.Contracts;
using PayrollService.Domain.Enums;

namespace PayrollService.Api.Controllers;

[ApiController]
[Route("api/v1/final-settlements")]
public sealed class FinalSettlementsController(IMediator mediator) : ControllerBase
{
    [HttpPost]
    [Authorize(Policy = PayrollPermissions.FinalSettlementProcess)]
    public async Task<IActionResult> Create(FinalSettlementRequest request) => Ok(await mediator.Send(new GenerateFinalSettlementCommand(request)));

    [HttpGet]
    public async Task<IActionResult> Get([FromQuery] Guid companyId, [FromQuery] Guid? employeeId) => Ok(await mediator.Send(new GetFinalSettlementQuery(companyId, employeeId)));

    [HttpPatch("{id:guid}/approve")]
    [Authorize(Policy = PayrollPermissions.FinalSettlementApprove)]
    public async Task<IActionResult> Approve(Guid id, ApprovalRequest request) => Ok(await mediator.Send(new ApproveFinalSettlementCommand(id, Guid.Parse(User.FindFirstValue("sub")!))));
}
