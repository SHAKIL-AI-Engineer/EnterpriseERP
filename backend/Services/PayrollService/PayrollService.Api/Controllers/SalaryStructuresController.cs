using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PayrollService.Application;
using PayrollService.Contracts;
using PayrollService.Domain.Enums;

namespace PayrollService.Api.Controllers;

[ApiController]
[Route("api/v1/salary-structures")]
public sealed class SalaryStructuresController(IMediator mediator) : ControllerBase
{
    [HttpPost]
    [Authorize(Policy = PayrollPermissions.SalaryStructureManage)]
    public async Task<IActionResult> Create(CreateSalaryStructureRequest request) => Ok(await mediator.Send(new CreateSalaryStructureCommand(request)));

    [HttpGet]
    public async Task<IActionResult> Get([FromQuery] Guid companyId) => Ok(await mediator.Send(new GetSalaryStructuresQuery(companyId)));

    [HttpPost("{id:guid}/components")]
    [Authorize(Policy = PayrollPermissions.SalaryStructureManage)]
    public async Task<IActionResult> AddComponent(Guid id, CreateSalaryStructureComponentRequest request) => Ok(await mediator.Send(new AddSalaryStructureComponentCommand(id, request)));

    [HttpGet("{id:guid}/components")]
    public async Task<IActionResult> GetComponents(Guid id) => Ok(await mediator.Send(new GetSalaryStructureComponentsQuery(id)));
}
