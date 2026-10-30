using MediatR;
using Microsoft.AspNetCore.Mvc;
using PayrollService.Application;
using PayrollService.Contracts;

namespace PayrollService.Api.Controllers;

[ApiController]
[Route("api/v1/deductions")]
public sealed class DeductionsController(IMediator mediator) : ControllerBase
{
    [HttpPost]
    public async Task<IActionResult> Create(CreateDeductionRequest request) => Ok(await mediator.Send(new CreateDeductionCommand(request)));

    [HttpGet]
    public async Task<IActionResult> Get([FromQuery] Guid companyId, [FromQuery] Guid? employeeId) => Ok(await mediator.Send(new GetDeductionHistoryQuery(companyId, employeeId)));
}
