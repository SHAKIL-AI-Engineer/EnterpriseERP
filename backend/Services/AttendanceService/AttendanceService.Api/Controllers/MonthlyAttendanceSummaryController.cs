using AttendanceService.Application.Features.Attendance.Queries;
using Erp.BuildingBlocks.CommonSecurity;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AttendanceService.Api.Controllers;

[ApiController]
[Route("api/v1/attendance/monthly-summary")]
[Authorize]
public sealed class MonthlyAttendanceSummaryController(IMediator mediator, ITenantContext tenant) : ControllerBase
{
    [HttpGet("approved")]
    public async Task<IActionResult> GetApproved(
        [FromQuery] Guid companyId,
        [FromQuery] Guid employeeId,
        [FromQuery] int year,
        [FromQuery] int month,
        CancellationToken cancellationToken)
    {
        companyId = TenantCompanyResolver.ResolveCompanyId(tenant, companyId);
        var summary = await mediator.Send(
            new GetApprovedMonthlyAttendanceSummaryQuery(companyId, employeeId, year, month),
            cancellationToken);

        if (summary is null)
        {
            return NotFound();
        }

        return Ok(summary);
    }

    [HttpGet("is-approved")]
    public async Task<IActionResult> IsApproved(
        [FromQuery] Guid companyId,
        [FromQuery] int year,
        [FromQuery] int month,
        CancellationToken cancellationToken)
    {
        companyId = TenantCompanyResolver.ResolveCompanyId(tenant, companyId);
        var approved = await mediator.Send(
            new IsMonthlyAttendanceApprovedQuery(companyId, year, month),
            cancellationToken);
        return Ok(approved);
    }
}
