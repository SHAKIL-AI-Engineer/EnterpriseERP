using MediatR;
using Microsoft.AspNetCore.Mvc;
using ShiftService.Api.Models;
using ShiftService.Application.Features.Shifts.Commands;
using ShiftService.Application.Features.Shifts.Queries;
using ShiftService.Application.DTOs;

namespace ShiftService.Api.Controllers;

[ApiController]
[Route("api/v1/shifts/{shiftId:guid}/policy")]
public class ShiftPolicyController(IMediator mediator) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<ApiResponse<ShiftPolicyDto>>> Get(Guid shiftId)
    {
        var data = await mediator.Send(new GetShiftPolicyQuery(shiftId));
        return Ok(ApiResponse<ShiftPolicyDto>.Ok(data, HttpContext.TraceIdentifier));
    }

    [HttpPut]
    public async Task<ActionResult<ApiResponse<ShiftPolicyDto>>> Upsert(Guid shiftId, UpsertShiftPolicyCommand command)
    {
        if (shiftId != command.ShiftId) return BadRequest(ApiResponse<ShiftPolicyDto>.Fail(["Shift ID mismatch"], HttpContext.TraceIdentifier));
        var data = await mediator.Send(command);
        return Ok(ApiResponse<ShiftPolicyDto>.Ok(data, HttpContext.TraceIdentifier));
    }
}

[ApiController]
[Route("api/v1/shifts/{shiftId:guid}/rules")]
public class ShiftRulesController(IMediator mediator) : ControllerBase
{
    [HttpPost]
    public async Task<ActionResult<ApiResponse<Guid>>> Create(Guid shiftId, CreateShiftRuleCommand command)
    {
        if (shiftId != command.ShiftId) return BadRequest(ApiResponse<Guid>.Fail(["Shift ID mismatch"], HttpContext.TraceIdentifier));
        var id = await mediator.Send(command);
        return Ok(ApiResponse<Guid>.Ok(id, HttpContext.TraceIdentifier));
    }

    [HttpPut]
    public async Task<ActionResult<ApiResponse<bool>>> Update(Guid shiftId, UpdateShiftRuleCommand command)
    {
        var success = await mediator.Send(command);
        return Ok(ApiResponse<bool>.Ok(success, HttpContext.TraceIdentifier));
    }
}

[ApiController]
[Route("api/v1/shifts/{shiftId:guid}/breaks")]
public class ShiftBreaksController(IMediator mediator) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<ShiftBreakDto>>>> List(Guid shiftId)
    {
        var data = await mediator.Send(new GetShiftBreaksQuery(shiftId));
        return Ok(ApiResponse<IReadOnlyList<ShiftBreakDto>>.Ok(data, HttpContext.TraceIdentifier));
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<Guid>>> Create(Guid shiftId, CreateShiftBreakCommand command)
    {
        if (shiftId != command.ShiftId) return BadRequest(ApiResponse<Guid>.Fail(["Shift ID mismatch"], HttpContext.TraceIdentifier));
        var id = await mediator.Send(command);
        return Ok(ApiResponse<Guid>.Ok(id, HttpContext.TraceIdentifier));
    }

    [HttpPut("{breakId:guid}")]
    public async Task<ActionResult<ApiResponse<bool>>> Update(Guid shiftId, Guid breakId, UpdateShiftBreakCommand command)
    {
        if (breakId != command.Id) return BadRequest(ApiResponse<bool>.Fail(["Break ID mismatch"], HttpContext.TraceIdentifier));
        var success = await mediator.Send(command);
        return Ok(ApiResponse<bool>.Ok(success, HttpContext.TraceIdentifier));
    }

    [HttpDelete("{breakId:guid}")]
    public async Task<ActionResult<ApiResponse<bool>>> Delete(Guid shiftId, Guid breakId)
    {
        var success = await mediator.Send(new DeleteShiftBreakCommand(breakId));
        return Ok(ApiResponse<bool>.Ok(success, HttpContext.TraceIdentifier));
    }
}
