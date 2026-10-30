using System.ComponentModel.DataAnnotations;
using System.Security.Claims;
using Erp.BuildingBlocks.CommonResponses;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EnterpriseERP.Platform.Host.Administration;

[ApiController]
[Authorize(Roles = "SuperAdmin,Admin")]
[Route("api/v1/administrator")]
public sealed class AdministratorController(AdministratorDbContext db) : ControllerBase
{
    private string Actor => User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub") ?? "Administrator";
    private IActionResult Success(object value) => Ok(ApiResponse<object>.Ok(value, HttpContext.TraceIdentifier));

    [HttpGet("overview")]
    public async Task<IActionResult> Overview(CancellationToken ct)
    {
        var since = DateTime.UtcNow.AddDays(-1);
        return Success(new {
            requestsLast24Hours = await db.Events.CountAsync(x => x.CreatedAt >= since, ct),
            unresolvedErrors = await db.Events.CountAsync(x => x.StatusCode >= 400 && !x.Resolved, ct),
            openBugs = await db.Bugs.CountAsync(x => x.Status != "Resolved" && x.Status != "Closed", ct),
            source = "Platform Host"
        });
    }

    [HttpGet("logs")]
    public async Task<IActionResult> Logs([FromQuery] string? search, [FromQuery] string? level,
        [FromQuery] bool errorsOnly = false, [FromQuery] bool unresolvedOnly = false,
        [FromQuery] int limit = 200, CancellationToken ct = default)
    {
        var query = db.Events.AsNoTracking();
        if (errorsOnly) query = query.Where(x => x.StatusCode >= 400);
        if (unresolvedOnly) query = query.Where(x => !x.Resolved);
        if (!string.IsNullOrWhiteSpace(level)) query = query.Where(x => x.Level == level);
        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim();
            query = query.Where(x => x.Path.Contains(term) || x.TraceId.Contains(term) || x.Actor.Contains(term));
        }
        var rows = await query.OrderByDescending(x => x.CreatedAt).Take(Math.Clamp(limit, 1, 500)).ToListAsync(ct);
        return Success(rows);
    }

    [HttpPut("errors/{id:guid}/resolution")]
    public async Task<IActionResult> Resolve(Guid id, ResolutionRequest request, CancellationToken ct)
    {
        var row = await db.Events.SingleOrDefaultAsync(x => x.Id == id && x.StatusCode >= 400, ct);
        if (row is null) return NotFound();
        row.Resolved = request.Resolved;
        row.Resolution = request.Notes?.Trim() ?? "";
        row.ResolvedBy = Actor;
        row.ResolvedAt = request.Resolved ? DateTime.UtcNow : null;
        await db.SaveChangesAsync(ct);
        return Success(row);
    }

    [HttpGet("bugs")]
    public async Task<IActionResult> Bugs([FromQuery] string? status, [FromQuery] string? search, CancellationToken ct)
    {
        var query = db.Bugs.AsNoTracking();
        if (!string.IsNullOrWhiteSpace(status)) query = query.Where(x => x.Status == status);
        if (!string.IsNullOrWhiteSpace(search)) query = query.Where(x => x.Title.Contains(search) || x.AffectedPath.Contains(search));
        return Success(await query.OrderByDescending(x => x.UpdatedAt).Take(500).ToListAsync(ct));
    }

    [HttpPost("bugs")]
    public async Task<IActionResult> Report(BugRequest request, CancellationToken ct)
    {
        if (!Priorities.Contains(request.Priority)) return BadRequest("Invalid priority.");
        var bug = new AdministratorBug {
            Title = request.Title.Trim(), Priority = request.Priority, AffectedPath = request.AffectedPath?.Trim() ?? "",
            Steps = request.Steps.Trim(), Expected = request.Expected?.Trim() ?? "", Actual = request.Actual?.Trim() ?? "",
            ReportedBy = Actor, UpdatedBy = Actor
        };
        db.Bugs.Add(bug);
        await db.SaveChangesAsync(ct);
        return Success(bug);
    }

    [HttpPut("bugs/{id:guid}")]
    public async Task<IActionResult> UpdateBug(Guid id, BugUpdateRequest request, CancellationToken ct)
    {
        if (!Statuses.Contains(request.Status) || !Priorities.Contains(request.Priority)) return BadRequest("Invalid bug status or priority.");
        var bug = await db.Bugs.SingleOrDefaultAsync(x => x.Id == id, ct);
        if (bug is null) return NotFound();
        bug.Status = request.Status;
        bug.Priority = request.Priority;
        bug.Notes = request.Notes?.Trim() ?? "";
        bug.UpdatedBy = Actor;
        bug.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);
        return Success(bug);
    }

    private static readonly HashSet<string> Priorities = ["Low", "Medium", "High", "Critical"];
    private static readonly HashSet<string> Statuses = ["Open", "InProgress", "Resolved", "Closed"];
}

public sealed record ResolutionRequest(bool Resolved, [StringLength(2000)] string Notes = "");
public sealed record BugRequest(
    [Required, StringLength(160, MinimumLength = 3)] string Title,
    [Required] string Priority,
    [StringLength(1024)] string AffectedPath,
    [Required, StringLength(8000, MinimumLength = 3)] string Steps,
    [StringLength(4000)] string Expected = "",
    [StringLength(4000)] string Actual = "");
public sealed record BugUpdateRequest([Required] string Status, [Required] string Priority, [StringLength(4000)] string Notes = "");
