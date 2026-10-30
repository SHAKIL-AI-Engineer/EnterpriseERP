using System.Security.Claims;
using Erp.BuildingBlocks.CommonResponses;
using Erp.BuildingBlocks.Contracts.Pagination;
using LeaveService.Application.Features.LeaveApplications;
using LeaveService.Application.Features.LeaveTypes;
using LeaveService.Application.Features.Operational;
using HolidayListQuery = LeaveService.Application.Features.Operational.HolidayListQuery;
using LeaveEncashmentListQuery = LeaveService.Application.Features.Operational.LeaveEncashmentListQuery;
using LeaveService.Contracts.DayTypes;
using LeaveService.Contracts.EarnLeaves;
using LeaveService.Contracts.Holidays;
using LeaveService.Contracts.LeaveApplications;
using LeaveService.Contracts.LeaveBalances;
using LeaveService.Contracts.LeaveEncashments;
using LeaveService.Contracts.LeavePolicies;
using LeaveService.Contracts.LeaveTypes;
using LeaveService.Contracts.WeeklyOffs;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LeaveService.Api.Controllers;

[ApiController]
[Route("api/v1/leave-types")]
[Authorize]
public sealed class LeaveTypesController(IMediator mediator) : ControllerBase
{
    [HttpPost]
    [Authorize(Policy = "Permission:LEAVE_TYPE_MANAGE")]
    public async Task<ActionResult<ApiResponse<LeaveTypeDto>>> Create([FromBody] CreateLeaveTypeRequest request, CancellationToken cancellationToken) =>
        Ok(ApiResponse<LeaveTypeDto>.Ok(await mediator.Send(new CreateLeaveTypeCommand(request, null), cancellationToken), HttpContext.TraceIdentifier));

    [HttpGet]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<LeaveTypeDto>>>> List([FromQuery] Guid companyId, CancellationToken cancellationToken) =>
        Ok(ApiResponse<IReadOnlyList<LeaveTypeDto>>.Ok(await mediator.Send(new GetLeaveTypesQuery(companyId), cancellationToken), HttpContext.TraceIdentifier));

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ApiResponse<LeaveTypeDto>>> GetById(Guid id, CancellationToken cancellationToken)
    {
        var data = await mediator.Send(new GetLeaveTypeByIdQuery(id), cancellationToken);
        return data == null ? NotFound() : Ok(ApiResponse<LeaveTypeDto>.Ok(data, HttpContext.TraceIdentifier));
    }

    [HttpPut("{id:guid}")]
    [Authorize(Policy = "Permission:LEAVE_TYPE_MANAGE")]
    public async Task<ActionResult<ApiResponse<LeaveTypeDto>>> Update(Guid id, [FromBody] UpdateLeaveTypeRequest request, CancellationToken cancellationToken) =>
        Ok(ApiResponse<LeaveTypeDto>.Ok(await mediator.Send(new UpdateLeaveTypeCommand(id, request, null), cancellationToken), HttpContext.TraceIdentifier));

    [HttpPatch("{id:guid}/activate")]
    [Authorize(Policy = "Permission:LEAVE_TYPE_MANAGE")]
    public async Task<ActionResult<ApiResponse<LeaveTypeDto>>> Activate(Guid id, CancellationToken cancellationToken) =>
        Ok(ApiResponse<LeaveTypeDto>.Ok(await mediator.Send(new SetLeaveTypeActiveCommand(id, true, null), cancellationToken), HttpContext.TraceIdentifier));

    [HttpPatch("{id:guid}/deactivate")]
    [Authorize(Policy = "Permission:LEAVE_TYPE_MANAGE")]
    public async Task<ActionResult<ApiResponse<LeaveTypeDto>>> Deactivate(Guid id, CancellationToken cancellationToken) =>
        Ok(ApiResponse<LeaveTypeDto>.Ok(await mediator.Send(new SetLeaveTypeActiveCommand(id, false, null), cancellationToken), HttpContext.TraceIdentifier));

    [HttpDelete("{id:guid}")]
    [Authorize(Policy = "Permission:LEAVE_TYPE_MANAGE")]
    public async Task<ActionResult<ApiResponse<string>>> Delete(Guid id, CancellationToken cancellationToken)
    {
        await mediator.Send(new DeleteLeaveTypeCommand(id, null), cancellationToken);
        return Ok(ApiResponse<string>.Ok("Leave type deleted.", HttpContext.TraceIdentifier));
    }
}

[ApiController]
[Route("api/v1/leave-policies")]
[Authorize]
public sealed class LeavePoliciesController(IMediator mediator) : ControllerBase
{
    [HttpPost]
    [Authorize(Policy = "Permission:LEAVE_POLICY_MANAGE")]
    public async Task<ActionResult<ApiResponse<LeavePolicyDto>>> Create([FromBody] CreateLeavePolicyRequest request, CancellationToken cancellationToken) =>
        Ok(ApiResponse<LeavePolicyDto>.Ok(await mediator.Send(new CreateLeavePolicyCommand(request), cancellationToken), HttpContext.TraceIdentifier));

    [HttpGet]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<LeavePolicyDto>>>> List([FromQuery] Guid companyId, CancellationToken cancellationToken) =>
        Ok(ApiResponse<IReadOnlyList<LeavePolicyDto>>.Ok(await mediator.Send(new GetLeavePoliciesQuery(companyId), cancellationToken), HttpContext.TraceIdentifier));

    [HttpPut("{id:guid}")]
    [Authorize(Policy = "Permission:LEAVE_POLICY_MANAGE")]
    public async Task<ActionResult<ApiResponse<LeavePolicyDto>>> Update(Guid id, [FromBody] UpdateLeavePolicyRequest request, CancellationToken cancellationToken) =>
        Ok(ApiResponse<LeavePolicyDto>.Ok(await mediator.Send(new UpdateLeavePolicyCommand(id, request), cancellationToken), HttpContext.TraceIdentifier));
}

[ApiController]
[Route("api/v1/leave-balances")]
[Authorize]
public sealed class LeaveBalancesController(IMediator mediator) : ControllerBase
{
    [HttpPost("generate-yearly")]
    [Authorize(Policy = "Permission:LEAVE_BALANCE_ADJUST")]
    public async Task<ActionResult<ApiResponse<int>>> GenerateYearly([FromBody] GenerateYearlyBalancesRequest request, CancellationToken cancellationToken) =>
        Ok(ApiResponse<int>.Ok(await mediator.Send(new GenerateYearlyBalancesCommand(request), cancellationToken), HttpContext.TraceIdentifier));

    [HttpPost("accrue-monthly")]
    [Authorize(Policy = "Permission:LEAVE_BALANCE_ADJUST")]
    public async Task<ActionResult<ApiResponse<int>>> AccrueMonthly([FromBody] AccrueMonthlyBalancesRequest request, CancellationToken cancellationToken) =>
        Ok(ApiResponse<int>.Ok(await mediator.Send(new AccrueMonthlyBalancesCommand(request), cancellationToken), HttpContext.TraceIdentifier));

    [HttpGet("{employeeId:guid}")]
    [Authorize(Policy = "Permission:LEAVE_BALANCE_VIEW")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<EmployeeLeaveBalanceDto>>>> GetByEmployee(Guid employeeId, [FromQuery] Guid companyId, [FromQuery] int year, CancellationToken cancellationToken) =>
        Ok(ApiResponse<IReadOnlyList<EmployeeLeaveBalanceDto>>.Ok(await mediator.Send(new GetEmployeeLeaveBalancesQuery(companyId, employeeId, year), cancellationToken), HttpContext.TraceIdentifier));

    [HttpPost("adjust")]
    [Authorize(Policy = "Permission:LEAVE_BALANCE_ADJUST")]
    public async Task<ActionResult<ApiResponse<EmployeeLeaveBalanceDto>>> Adjust([FromBody] AdjustLeaveBalanceRequest request, CancellationToken cancellationToken) =>
        Ok(ApiResponse<EmployeeLeaveBalanceDto>.Ok(await mediator.Send(new AdjustLeaveBalanceCommand(request, null), cancellationToken), HttpContext.TraceIdentifier));
}

[ApiController]
[Route("api/v1/leaves")]
[Authorize]
public sealed class LeavesController(IMediator mediator) : ControllerBase
{
    [HttpPost("apply")]
    [Authorize(Policy = "Permission:LEAVE_APPLY")]
    public async Task<ActionResult<ApiResponse<LeaveApplicationDto>>> Apply([FromBody] ApplyLeaveRequest request, CancellationToken cancellationToken) =>
        Ok(ApiResponse<LeaveApplicationDto>.Ok(await mediator.Send(new ApplyLeaveCommand(request with { AppliedBy = Guid.Parse(User.FindFirstValue("sub")!) }), cancellationToken), HttpContext.TraceIdentifier));

    [HttpGet("applications")]
    public async Task<ActionResult<PaginatedApiResponse<LeaveApplicationListItemDto>>> Applications(
        [FromQuery] LeaveApplicationListQuery query,
        CancellationToken cancellationToken)
    {
        var result = await mediator.Send(new ListLeaveApplicationsQuery(query), cancellationToken);
        return Ok(PaginatedApiResponse<LeaveApplicationListItemDto>.Ok(
            result.Data,
            result.Pagination,
            "Data loaded successfully",
            HttpContext.TraceIdentifier));
    }

    [HttpGet("applications/{id:guid}")]
    public async Task<ActionResult<ApiResponse<LeaveApplicationDto>>> ApplicationById(Guid id, CancellationToken cancellationToken)
    {
        var data = await mediator.Send(new GetLeaveApplicationByIdQuery(id), cancellationToken);
        return data == null ? NotFound() : Ok(ApiResponse<LeaveApplicationDto>.Ok(data, HttpContext.TraceIdentifier));
    }

    [HttpPatch("applications/{id:guid}/approve")]
    [Authorize(Policy = "Permission:LEAVE_APPROVE")]
    public async Task<ActionResult<ApiResponse<LeaveApplicationDto>>> Approve(Guid id, [FromBody] ApproveLeaveRequest request, CancellationToken cancellationToken)
    {
        var r = request with { LeaveApplicationId = id, ApprovedBy = Guid.Parse(User.FindFirstValue("sub")!), ApproverUserId = Guid.Parse(User.FindFirstValue("sub")!) };
        return Ok(ApiResponse<LeaveApplicationDto>.Ok(await mediator.Send(new ApproveLeaveCommand(r), cancellationToken), HttpContext.TraceIdentifier));
    }

    [HttpPatch("applications/{id:guid}/reject")]
    [Authorize(Policy = "Permission:LEAVE_REJECT")]
    public async Task<ActionResult<ApiResponse<LeaveApplicationDto>>> Reject(Guid id, [FromBody] RejectLeaveRequest request, CancellationToken cancellationToken)
    {
        var r = request with { LeaveApplicationId = id, RejectedBy = Guid.Parse(User.FindFirstValue("sub")!), ApproverUserId = Guid.Parse(User.FindFirstValue("sub")!) };
        return Ok(ApiResponse<LeaveApplicationDto>.Ok(await mediator.Send(new RejectLeaveCommand(r), cancellationToken), HttpContext.TraceIdentifier));
    }

    [HttpPatch("applications/{id:guid}/cancel")]
    [Authorize(Policy = "Permission:LEAVE_CANCEL")]
    public async Task<ActionResult<ApiResponse<LeaveApplicationDto>>> Cancel(Guid id, [FromBody] CancelLeaveRequest request, CancellationToken cancellationToken)
    {
        var r = request with { LeaveApplicationId = id, CancelledBy = Guid.Parse(User.FindFirstValue("sub")!) };
        return Ok(ApiResponse<LeaveApplicationDto>.Ok(await mediator.Send(new CancelLeaveCommand(r), cancellationToken), HttpContext.TraceIdentifier));
    }
}

[ApiController]
[Route("api/v1/holidays")]
[Authorize]
public sealed class HolidaysController(IMediator mediator) : ControllerBase
{
    [HttpPost]
    [Authorize(Policy = "Permission:HOLIDAY_MANAGE")]
    public async Task<ActionResult<ApiResponse<HolidayDto>>> Create([FromBody] HolidayRequest request, CancellationToken cancellationToken) =>
        Ok(ApiResponse<HolidayDto>.Ok(await mediator.Send(new CreateHolidayCommand(request), cancellationToken), HttpContext.TraceIdentifier));

    [HttpGet]
    public async Task<ActionResult<PaginatedApiResponse<HolidayDto>>> List(
        [FromQuery] HolidayListQuery query,
        CancellationToken cancellationToken)
    {
        var result = await mediator.Send(new GetHolidaysQuery(query), cancellationToken);
        return Ok(PaginatedApiResponse<HolidayDto>.Ok(
            result.Data,
            result.Pagination,
            "Data loaded successfully",
            HttpContext.TraceIdentifier));
    }

    [HttpPut("{id:guid}")]
    [Authorize(Policy = "Permission:HOLIDAY_MANAGE")]
    public async Task<ActionResult<ApiResponse<HolidayDto>>> Update(Guid id, [FromBody] HolidayRequest request, CancellationToken cancellationToken) =>
        Ok(ApiResponse<HolidayDto>.Ok(await mediator.Send(new UpdateHolidayCommand(id, request), cancellationToken), HttpContext.TraceIdentifier));

    [HttpDelete("{id:guid}")]
    [Authorize(Policy = "Permission:HOLIDAY_MANAGE")]
    public async Task<ActionResult<ApiResponse<object>>> Delete(Guid id, CancellationToken cancellationToken)
    {
        await mediator.Send(new DeleteHolidayCommand(id), cancellationToken);
        return Ok(ApiResponse<object>.Ok(new { }, HttpContext.TraceIdentifier));
    }
}

[ApiController]
[Route("api/v1/weekly-offs")]
[Authorize]
public sealed class WeeklyOffsController(IMediator mediator) : ControllerBase
{
    [HttpPost]
    [Authorize(Policy = "Permission:WEEKLY_OFF_MANAGE")]
    public async Task<ActionResult<ApiResponse<WeeklyOffDto>>> Create([FromBody] WeeklyOffRequest request, CancellationToken cancellationToken) =>
        Ok(ApiResponse<WeeklyOffDto>.Ok(await mediator.Send(new CreateWeeklyOffCommand(request), cancellationToken), HttpContext.TraceIdentifier));

    [HttpGet]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<WeeklyOffDto>>>> List([FromQuery] Guid companyId, CancellationToken cancellationToken) =>
        Ok(ApiResponse<IReadOnlyList<WeeklyOffDto>>.Ok(await mediator.Send(new GetWeeklyOffsQuery(companyId), cancellationToken), HttpContext.TraceIdentifier));

    [HttpDelete("{id:guid}")]
    [Authorize(Policy = "Permission:WEEKLY_OFF_MANAGE")]
    public async Task<ActionResult<ApiResponse<object>>> Delete(Guid id, CancellationToken cancellationToken)
    {
        await mediator.Send(new DeleteWeeklyOffCommand(id), cancellationToken);
        return Ok(ApiResponse<object>.Ok(new { }, HttpContext.TraceIdentifier));
    }
}

[ApiController]
[Route("api/v1/earn-leaves")]
[Authorize]
public sealed class EarnLeavesController(IMediator mediator) : ControllerBase
{
    [HttpPost("generate")]
    [Authorize(Policy = "Permission:EARN_LEAVE_GENERATE")]
    public async Task<ActionResult<ApiResponse<EarnLeaveSummaryDto>>> Generate([FromBody] GenerateEarnLeaveRequest request, CancellationToken cancellationToken) =>
        Ok(ApiResponse<EarnLeaveSummaryDto>.Ok(await mediator.Send(new GenerateEarnLeaveCommand(request), cancellationToken), HttpContext.TraceIdentifier));

    [HttpGet("{employeeId:guid}")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<EmployeeLeaveBalanceDto>>>> Get(Guid employeeId, [FromQuery] Guid companyId, [FromQuery] int year, CancellationToken cancellationToken) =>
        Ok(ApiResponse<IReadOnlyList<EmployeeLeaveBalanceDto>>.Ok(await mediator.Send(new GetEarnLeaveSummaryQuery(companyId, employeeId, year), cancellationToken), HttpContext.TraceIdentifier));
}

[ApiController]
[Route("api/v1/leave-encashments")]
[Authorize]
public sealed class LeaveEncashmentsController(IMediator mediator) : ControllerBase
{
    [HttpPost]
    public async Task<ActionResult<ApiResponse<LeaveEncashmentDto>>> Create([FromBody] LeaveEncashmentRequest request, CancellationToken cancellationToken) =>
        Ok(ApiResponse<LeaveEncashmentDto>.Ok(await mediator.Send(new CreateLeaveEncashmentCommand(request), cancellationToken), HttpContext.TraceIdentifier));

    [HttpGet]
    public async Task<ActionResult<PaginatedApiResponse<LeaveEncashmentDto>>> List(
        [FromQuery] LeaveEncashmentListQuery query,
        CancellationToken cancellationToken)
    {
        var result = await mediator.Send(new GetLeaveEncashmentsQuery(query), cancellationToken);
        return Ok(PaginatedApiResponse<LeaveEncashmentDto>.Ok(
            result.Data,
            result.Pagination,
            "Data loaded successfully",
            HttpContext.TraceIdentifier));
    }

    [HttpPatch("{id:guid}/approve")]
    [Authorize(Policy = "Permission:LEAVE_ENCASHMENT_APPROVE")]
    public async Task<ActionResult<ApiResponse<LeaveEncashmentDto>>> Approve(Guid id, [FromQuery] Guid approvedBy, CancellationToken cancellationToken) =>
        Ok(ApiResponse<LeaveEncashmentDto>.Ok(await mediator.Send(new ApproveLeaveEncashmentCommand(id, approvedBy), cancellationToken), HttpContext.TraceIdentifier));

    [HttpPatch("{id:guid}/reject")]
    [Authorize(Policy = "Permission:LEAVE_ENCASHMENT_APPROVE")]
    public async Task<ActionResult<ApiResponse<LeaveEncashmentDto>>> Reject(Guid id, [FromQuery] Guid rejectedBy, CancellationToken cancellationToken) =>
        Ok(ApiResponse<LeaveEncashmentDto>.Ok(await mediator.Send(new RejectLeaveEncashmentCommand(id, rejectedBy), cancellationToken), HttpContext.TraceIdentifier));

    [HttpPatch("{id:guid}/paid")]
    [Authorize(Policy = "Permission:LEAVE_ENCASHMENT_APPROVE")]
    public async Task<ActionResult<ApiResponse<LeaveEncashmentDto>>> Paid(Guid id, CancellationToken cancellationToken) =>
        Ok(ApiResponse<LeaveEncashmentDto>.Ok(await mediator.Send(new MarkEncashmentPaidCommand(id), cancellationToken), HttpContext.TraceIdentifier));
}

[ApiController]
[Route("api/v1/day-types")]
[Authorize]
public sealed class DayTypesController(IMediator mediator) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<ApiResponse<DayTypeResponse>>> Get([FromQuery] Guid companyId, [FromQuery] Guid employeeId, [FromQuery] DateOnly date, CancellationToken cancellationToken) =>
        Ok(ApiResponse<DayTypeResponse>.Ok(await mediator.Send(new GetDayTypeQuery(companyId, employeeId, date), cancellationToken), HttpContext.TraceIdentifier));
}
