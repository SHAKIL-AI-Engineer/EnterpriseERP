using MediatR;
using Microsoft.AspNetCore.Mvc;
using ShiftService.Api.Models;
using ShiftService.Application.Features.Shifts.Commands;
using ShiftService.Application.Features.Shifts.Queries;
using ShiftService.Application.DTOs;
using Erp.BuildingBlocks.Contracts.Pagination;

namespace ShiftService.Api.Controllers;

[ApiController]
[Route("api/v1/employee-shifts")]
public class EmployeeShiftsController(IMediator mediator) : ControllerBase
{
    [HttpPost("assign")]
    public async Task<ActionResult<ApiResponse<Guid>>> Assign(AssignEmployeeShiftCommand command)
    {
        var id = await mediator.Send(command);
        return Ok(ApiResponse<Guid>.Ok(id, HttpContext.TraceIdentifier));
    }

    [HttpGet("{employeeId}/current")]
    public async Task<ActionResult<ApiResponse<EmployeeShiftAssignmentDto>>> GetCurrent(Guid employeeId, [FromQuery] Guid companyId)
    {
        var data = await mediator.Send(new GetCurrentEmployeeShiftQuery(employeeId, companyId));
        if (data == null) return NotFound(ApiResponse<EmployeeShiftAssignmentDto>.Fail(["No current shift found"], HttpContext.TraceIdentifier));
        return Ok(ApiResponse<EmployeeShiftAssignmentDto>.Ok(data, HttpContext.TraceIdentifier));
    }

    [HttpGet("{employeeId}/history")]
    public async Task<ActionResult<ApiResponse<IEnumerable<EmployeeShiftAssignmentDto>>>> GetHistory(Guid employeeId, [FromQuery] Guid companyId)
    {
        var data = await mediator.Send(new GetEmployeeShiftHistoryQuery(employeeId, companyId));
        return Ok(ApiResponse<IEnumerable<EmployeeShiftAssignmentDto>>.Ok(data, HttpContext.TraceIdentifier));
    }
}

[ApiController]
[Route("api/v1/temporary-shifts")]
public class TemporaryShiftsController(IMediator mediator) : ControllerBase
{
    [HttpPost]
    public async Task<ActionResult<ApiResponse<Guid>>> Assign(AssignTemporaryShiftCommand command)
    {
        var id = await mediator.Send(command);
        return Ok(ApiResponse<Guid>.Ok(id, HttpContext.TraceIdentifier));
    }

    [HttpGet("list")]
    public async Task<ActionResult<ApiResponse<PagedResult<TemporaryShiftAssignmentDto>>>> List(
        [FromQuery] Guid companyId,
        [FromQuery] DateTime? fromDate,
        [FromQuery] DateTime? toDate,
        [FromQuery] Guid? employeeId,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var data = await mediator.Send(new ListTemporaryShiftsQuery(companyId, fromDate, toDate, employeeId, page, pageSize));
        return Ok(ApiResponse<PagedResult<TemporaryShiftAssignmentDto>>.Ok(data, HttpContext.TraceIdentifier));
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<TemporaryShiftAssignmentDto>>> GetByDate([FromQuery] Guid companyId, [FromQuery] Guid employeeId, [FromQuery] DateTime date)
    {
        var data = await mediator.Send(new GetTemporaryShiftByDateQuery(employeeId, companyId, date));
        if (data == null) return NotFound(ApiResponse<TemporaryShiftAssignmentDto>.Fail(["No temporary shift found for this date"], HttpContext.TraceIdentifier));
        return Ok(ApiResponse<TemporaryShiftAssignmentDto>.Ok(data, HttpContext.TraceIdentifier));
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ApiResponse<TemporaryShiftAssignmentDto>>> GetById(Guid id)
    {
        var data = await mediator.Send(new GetTemporaryShiftByIdQuery(id));
        if (data == null) return NotFound(ApiResponse<TemporaryShiftAssignmentDto>.Fail(["No temporary shift found"], HttpContext.TraceIdentifier));
        return Ok(ApiResponse<TemporaryShiftAssignmentDto>.Ok(data, HttpContext.TraceIdentifier));
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<ApiResponse<bool>>> Update(Guid id, UpdateTemporaryShiftCommand command)
    {
        if (id != command.Id) return BadRequest(ApiResponse<bool>.Fail(["Route id and command id do not match"], HttpContext.TraceIdentifier));
        var success = await mediator.Send(command);
        return Ok(ApiResponse<bool>.Ok(success, HttpContext.TraceIdentifier));
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult<ApiResponse<bool>>> Delete(Guid id)
    {
        var success = await mediator.Send(new DeleteTemporaryShiftCommand(id));
        return Ok(ApiResponse<bool>.Ok(success, HttpContext.TraceIdentifier));
    }
}

[ApiController]
[Route("api/v1/shift-calendars")]
public class ShiftCalendarsController(IMediator mediator) : ControllerBase
{
    [HttpPost]
    public async Task<ActionResult<ApiResponse<Guid>>> Create(CreateShiftCalendarCommand command)
    {
        var id = await mediator.Send(command);
        return Ok(ApiResponse<Guid>.Ok(id, HttpContext.TraceIdentifier));
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<IEnumerable<ShiftCalendarDto>>>> Get([FromQuery] Guid companyId, [FromQuery] DateTime fromDate, [FromQuery] DateTime toDate)
    {
        var data = await mediator.Send(new GetShiftCalendarQuery(companyId, fromDate, toDate));
        return Ok(ApiResponse<IEnumerable<ShiftCalendarDto>>.Ok(data, HttpContext.TraceIdentifier));
    }
}
