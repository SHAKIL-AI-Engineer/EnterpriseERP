using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ShiftService.Api.Models;
using ShiftService.Application.Features.Shifts.Commands;
using ShiftService.Application.Features.Shifts.Queries;
using ShiftService.Application.DTOs;

namespace ShiftService.Api.Controllers;

[ApiController]
[Route("api/v1/shifts")]
[Authorize(Roles = "SuperAdmin,Admin,HR,Management,HR Officer,IT Officer")]
public class ShiftsController(IMediator mediator) : ControllerBase
{
    [HttpPost]
    public async Task<ActionResult<ApiResponse<Guid>>> Create(CreateShiftCommand command)
    {
        var id = await mediator.Send(command);
        return Ok(ApiResponse<Guid>.Ok(id, HttpContext.TraceIdentifier));
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<IEnumerable<ShiftDto>>>> GetByCompany([FromQuery] Guid companyId)
    {
        var data = await mediator.Send(new GetShiftsByCompanyQuery(companyId));
        return Ok(ApiResponse<IEnumerable<ShiftDto>>.Ok(data, HttpContext.TraceIdentifier));
    }

    [HttpGet("evaluation")]
    public async Task<ActionResult<ApiResponse<ShiftEvaluationDto>>> Evaluate(
        [FromQuery] Guid companyId,
        [FromQuery] Guid employeeId,
        [FromQuery] DateTime date)
    {
        var data = await mediator.Send(new EvaluateShiftQuery(companyId, employeeId, date));
        return Ok(ApiResponse<ShiftEvaluationDto>.Ok(data, HttpContext.TraceIdentifier));
    }

    [HttpPost("evaluation/bulk")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<ShiftEvaluationDto>>>> EvaluateBulk(
        BulkShiftEvaluationRequest request)
    {
        var data = await mediator.Send(new EvaluateManyShiftsQuery(
            request.CompanyId,
            request.EmployeeIds,
            request.Date));
        return Ok(ApiResponse<IReadOnlyList<ShiftEvaluationDto>>.Ok(data, HttpContext.TraceIdentifier));
    }

    [HttpGet("applicable")]
    public async Task<ActionResult<ApiResponse<ShiftEvaluationDto>>> Applicable(
        [FromQuery] Guid companyId,
        [FromQuery] Guid employeeId,
        [FromQuery] DateTime date)
    {
        var data = await mediator.Send(new EvaluateShiftQuery(companyId, employeeId, date));
        return Ok(ApiResponse<ShiftEvaluationDto>.Ok(data, HttpContext.TraceIdentifier));
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ApiResponse<ShiftDto>>> GetById(Guid id)
    {
        var data = await mediator.Send(new GetShiftByIdQuery(id));
        if (data == null) return NotFound(ApiResponse<ShiftDto>.Fail(["Shift not found"], HttpContext.TraceIdentifier));
        return Ok(ApiResponse<ShiftDto>.Ok(data, HttpContext.TraceIdentifier));
    }

    [HttpGet("{id:guid}/detail")]
    public async Task<ActionResult<ApiResponse<ShiftDetailDto>>> GetDetail(Guid id)
    {
        var data = await mediator.Send(new GetShiftDetailQuery(id));
        if (data == null) return NotFound(ApiResponse<ShiftDetailDto>.Fail(["Shift not found"], HttpContext.TraceIdentifier));
        return Ok(ApiResponse<ShiftDetailDto>.Ok(data, HttpContext.TraceIdentifier));
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<ApiResponse<bool>>> Update(Guid id, UpdateShiftCommand command)
    {
        if (id != command.Id) return BadRequest(ApiResponse<bool>.Fail(["ID mismatch"], HttpContext.TraceIdentifier));
        var success = await mediator.Send(command);
        return Ok(ApiResponse<bool>.Ok(success, HttpContext.TraceIdentifier));
    }

    [HttpPatch("{id:guid}/activate")]
    public async Task<ActionResult<ApiResponse<bool>>> Activate(Guid id)
    {
        var success = await mediator.Send(new ActivateShiftCommand(id));
        return Ok(ApiResponse<bool>.Ok(success, HttpContext.TraceIdentifier));
    }

    [HttpPatch("{id:guid}/deactivate")]
    public async Task<ActionResult<ApiResponse<bool>>> Deactivate(Guid id)
    {
        var success = await mediator.Send(new DeactivateShiftCommand(id));
        return Ok(ApiResponse<bool>.Ok(success, HttpContext.TraceIdentifier));
    }
}

public sealed record BulkShiftEvaluationRequest(
    Guid CompanyId,
    IReadOnlyCollection<Guid> EmployeeIds,
    DateTime Date);
