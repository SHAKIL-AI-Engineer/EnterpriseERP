using System.Security.Claims;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PayrollService.Application;
using PayrollService.Contracts;
using PayrollService.Domain.Enums;

namespace PayrollService.Api.Controllers;

[ApiController]
[Route("api/v1/payroll/daily-sheet")]
public sealed class PayrollDailyController(IMediator mediator) : ControllerBase
{
    [HttpGet]
    [Authorize(Policy = PayrollPermissions.SalarySheetView)]
    public async Task<IActionResult> Get(
        [FromQuery] Guid companyId,
        [FromQuery] DateOnly date,
        [FromQuery] int? departmentId,
        [FromQuery] string? searchTerm) =>
        Ok(await mediator.Send(new GetDailySalarySheetQuery(companyId, date, departmentId, searchTerm)));

    [HttpPost("process")]
    [Authorize(Policy = PayrollPermissions.PayrollProcess)]
    public async Task<IActionResult> Process(ProcessDailyPayrollRequest request) =>
        Ok(await mediator.Send(new ProcessDailyPayrollCommand(request with { ProcessedBy = Guid.Parse(User.FindFirstValue("sub")!) })));
}
