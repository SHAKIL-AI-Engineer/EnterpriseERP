using Erp.BuildingBlocks.CommonResponses;
using HRService.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

using Erp.BuildingBlocks.SharedKernel;

namespace HRService.Api.Controllers;

[ApiController]
[Route("api/v1/dashboard")]
[Authorize]
public sealed class DashboardController(HrDbContext db) : ControllerBase
{
    public sealed record DashboardSummaryDto(
        int TotalWorkforce,
        int PresentToday,
        int OnLeaveToday,
        int OpenPositions,
        double WorkforceGrowth,
        double AttendanceTrend);

    [HttpGet("summary")]
    public async Task<ActionResult<ApiResponse<DashboardSummaryDto>>> GetSummary(CancellationToken cancellationToken)
    {
        var total = await db.Employees.CountAsync(e => !e.IsDeleted, cancellationToken);
        var onLeave = await db.Employees.CountAsync(
            e => !e.IsDeleted && (e.Status == "On Leave" || e.Status.Contains("Leave")),
            cancellationToken);
        var openPositions = await db.ManpowerRequirements.AsNoTracking()
            .Where(r => !r.IsDeleted && (r.Status == "Pending" || r.Status == "Approved"))
            .SumAsync(r => (int?)r.RequiredNumber, cancellationToken) ?? 0;
        var summary = new DashboardSummaryDto(total, 0, onLeave, openPositions, 0, 0);
        return Ok(ApiResponse<DashboardSummaryDto>.Ok(summary, HttpContext.TraceIdentifier));
    }

    public sealed record AttendanceStatDto(string Date, int PresentCount, int TargetCount);

    [HttpGet("attendance-stats")]
    public async Task<ActionResult<ApiResponse<IEnumerable<AttendanceStatDto>>>> GetAttendanceStats(
        CancellationToken cancellationToken)
    {
        var total = await db.Employees.CountAsync(e => !e.IsDeleted, cancellationToken);
        var today = BusinessTime.Now.Date;
        var stats = Enumerable.Range(0, 7)
            .Select(i => today.AddDays(-6 + i))
            .Select(d => new AttendanceStatDto(d.ToString("MMM dd"), 0, total))
            .ToList();
        return Ok(ApiResponse<IEnumerable<AttendanceStatDto>>.Ok(stats, HttpContext.TraceIdentifier));
    }

    public sealed record DepartmentStatDto(string DepartmentName, int EmployeeCount, string Color);

    [HttpGet("department-stats")]
    public async Task<ActionResult<ApiResponse<IEnumerable<DepartmentStatDto>>>> GetDepartmentStats(
        CancellationToken cancellationToken)
    {
        var grouped = await db.EmployeeJobInfos.AsNoTracking()
            .Where(j => j.IsCurrent && j.DepartmentId != null)
            .Join(
                db.Employees.AsNoTracking().Where(e => !e.IsDeleted),
                j => j.EmployeeId,
                e => e.Id,
                (j, _) => j)
            .GroupBy(j => j.DepartmentId)
            .Select(g => new { DepartmentId = g.Key, Count = g.Count() })
            .ToListAsync(cancellationToken);

        var deptIds = grouped.Select(g => g.DepartmentId!.Value).ToList();
        var deptNames = await db.Departments.AsNoTracking()
            .Where(d => deptIds.Contains(d.Id))
            .ToDictionaryAsync(d => d.Id, d => d.Name, cancellationToken);

        var result = grouped
            .Select(g => new DepartmentStatDto(
                deptNames.GetValueOrDefault(g.DepartmentId!.Value, "Unassigned"),
                g.Count,
                string.Empty))
            .OrderByDescending(d => d.EmployeeCount)
            .ToList();

        return Ok(ApiResponse<IEnumerable<DepartmentStatDto>>.Ok(result, HttpContext.TraceIdentifier));
    }

    public sealed record RecentHireDto(
        string Name,
        string Position,
        string Department,
        string JoinDate,
        string ImageUrl);

    [HttpGet("recent-hires")]
    public async Task<ActionResult<ApiResponse<IEnumerable<RecentHireDto>>>> GetRecentHires(
        CancellationToken cancellationToken)
    {
        var hires = await db.Employees.AsNoTracking()
            .Where(e => !e.IsDeleted)
            .OrderByDescending(e => e.JoinDate)
            .Take(8)
            .Select(e => new
            {
                e.Id,
                e.FullName,
                e.JoinDate,
                Designation = e.JobInfos
                    .Where(j => j.IsCurrent)
                    .Select(j => j.Designation != null ? j.Designation.Name : null)
                    .FirstOrDefault(),
                Department = e.JobInfos
                    .Where(j => j.IsCurrent)
                    .Select(j => j.Department != null ? j.Department.Name : null)
                    .FirstOrDefault(),
            })
            .ToListAsync(cancellationToken);

        var result = hires.Select(h => new RecentHireDto(
            h.FullName,
            h.Designation ?? "—",
            h.Department ?? "—",
            h.JoinDate.ToString("yyyy-MM-dd"),
            string.Empty)).ToList();

        return Ok(ApiResponse<IEnumerable<RecentHireDto>>.Ok(result, HttpContext.TraceIdentifier));
    }

    public sealed record UpcomingEventDto(string Name, string EventType, string Date, string Color);

    [HttpGet("upcoming-events")]
    public ActionResult<ApiResponse<IEnumerable<UpcomingEventDto>>> GetUpcomingEvents()
    {
        return Ok(ApiResponse<IEnumerable<UpcomingEventDto>>.Ok(
            Array.Empty<UpcomingEventDto>(),
            HttpContext.TraceIdentifier));
    }
}
