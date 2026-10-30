using System.Security.Claims;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PayrollService.Application;
using PayrollService.Contracts;
using PayrollService.Domain.Enums;

namespace PayrollService.Api.Controllers;

[ApiController]
[Route("api/v1/employee-salaries")]
public sealed class EmployeeSalariesController(IMediator mediator) : ControllerBase
{
    [HttpPost]
    [Authorize(Policy = PayrollPermissions.EmployeeSalaryManage)]
    public async Task<IActionResult> Assign(EmployeeSalaryRequest request) => Ok(await mediator.Send(new AssignEmployeeSalaryCommand(request with { CreatedBy = Guid.Parse(User.FindFirstValue("sub")!) })));

    [HttpGet("{employeeId:guid}/current")]
    public async Task<IActionResult> Current(Guid employeeId, [FromQuery] Guid companyId) => Ok(await mediator.Send(new GetCurrentEmployeeSalaryQuery(companyId, employeeId)));

    [HttpGet("{employeeId:guid}/history")]
    public async Task<IActionResult> History(Guid employeeId, [FromQuery] Guid companyId) => Ok(await mediator.Send(new GetEmployeeSalaryHistoryQuery(companyId, employeeId)));
}
