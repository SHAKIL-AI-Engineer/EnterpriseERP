using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PayrollService.Application;
using PayrollService.Contracts;
using PayrollService.Domain.Enums;

namespace PayrollService.Api.Controllers;

[ApiController]
[Route("api/v1/payroll/bonuses")]
public sealed class PayrollBonusController(IMediator mediator) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> List(
        [FromQuery] Guid companyId,
        [FromQuery] int year,
        [FromQuery] int? month,
        [FromQuery] string? bonusType) =>
        Ok(await mediator.Send(new GetPayrollBonusesQuery(companyId, year, month, bonusType)));

    [HttpPost]
    [Authorize(Policy = PayrollPermissions.PayrollProcess)]
    public async Task<IActionResult> Create(CreatePayrollBonusRequest request) =>
        Ok(await mediator.Send(new CreatePayrollBonusCommand(request)));

    [HttpPost("process-festival")]
    [Authorize(Policy = PayrollPermissions.PayrollProcess)]
    public async Task<IActionResult> ProcessFestival(ProcessFestivalBonusRequest request) =>
        Ok(await mediator.Send(new ProcessFestivalBonusCommand(request)));

    [HttpDelete("{employeePayrollId:guid}")]
    [Authorize(Policy = PayrollPermissions.PayrollProcess)]
    public async Task<IActionResult> Delete(Guid employeePayrollId) =>
        Ok(await mediator.Send(new DeletePayrollBonusCommand(employeePayrollId)));

    [HttpGet("bank-sheet")]
    [Authorize(Policy = PayrollPermissions.BankSheetExport)]
    public async Task<IActionResult> BankSheet(
        [FromQuery] Guid companyId,
        [FromQuery] int yearNo,
        [FromQuery] int monthNo) =>
        Ok(await mediator.Send(new GetFestivalBonusBankSheetQuery(companyId, yearNo, monthNo)));
}
