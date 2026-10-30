using System.Security.Claims;
using Erp.BuildingBlocks.CommonSecurity;
using HRService.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EnterpriseERP.Platform.Host.Administration;

public sealed class HrOperationsDbContext(DbContextOptions<HrOperationsDbContext> options, ITenantContext tenant) : TenantDbContext(options, tenant)
{
    public DbSet<HrOperation> Operations => Set<HrOperation>();
    protected override void OnModelCreating(ModelBuilder model)
    {
        model.Entity<HrOperation>(b => { b.ToTable("Operations", "hr"); b.Property(x => x.Version).IsRowVersion(); });
        ApplyCompanyFilters(model);
    }
    public Task InitializeAsync() => Database.ExecuteSqlRawAsync("""
        IF SCHEMA_ID(N'hr') IS NULL EXEC(N'CREATE SCHEMA hr');
        IF OBJECT_ID(N'hr.Operations', N'U') IS NULL
        BEGIN
          CREATE TABLE hr.Operations (
            Id uniqueidentifier NOT NULL PRIMARY KEY, CompanyId uniqueidentifier NOT NULL,
            EmployeeId uniqueidentifier NOT NULL, Kind nvarchar(20) NOT NULL,
            Title nvarchar(200) NOT NULL, Notes nvarchar(2000) NOT NULL,
            Status nvarchar(30) NOT NULL, StartedAt datetimeoffset NOT NULL, CompletedAt datetimeoffset NULL,
            CreatedBy uniqueidentifier NOT NULL, UpdatedBy uniqueidentifier NULL, Version rowversion NOT NULL,
            CONSTRAINT FK_HrOperations_Employee FOREIGN KEY(EmployeeId) REFERENCES dbo.Employees(Id)
          );
          CREATE INDEX IX_HrOperations_Company ON hr.Operations(CompanyId, Kind, StartedAt DESC);
          CREATE UNIQUE INDEX IX_HrOperations_OpenMovement ON hr.Operations(EmployeeId) WHERE Kind = 'Movement' AND Status = 'Open';
        END;
        """);
}

public sealed class HrOperation
{
    public Guid Id { get; set; } = Guid.NewGuid(); public Guid CompanyId { get; set; } public Guid EmployeeId { get; set; }
    public string Kind { get; set; } = ""; public string Title { get; set; } = ""; public string Notes { get; set; } = "";
    public string Status { get; set; } = "Open"; public DateTimeOffset StartedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? CompletedAt { get; set; } public Guid CreatedBy { get; set; } public Guid? UpdatedBy { get; set; }
    public byte[] Version { get; set; } = [];
}

[ApiController]
[Route("api/v1/hr/operations")]
[Authorize]
public sealed class HrOperationsController(HrOperationsDbContext db, HrDbContext hr, ITenantContext tenant) : ControllerBase
{
    private void Scope(Guid company) { if (company == Guid.Empty || (!tenant.IsSuperAdmin && tenant.ActiveCompanyId != company)) throw new UnauthorizedAccessException("Select an assigned company."); }
    [HttpGet]
    [Authorize(Policy = "Permission:hr.employees.read")]
    public async Task<IActionResult> List([FromQuery] Guid companyId, [FromQuery] string kind, CancellationToken ct)
    {
        Scope(companyId);
        if (kind is not ("Movement" or "Lifecycle")) return BadRequest(new { message = "Unknown operation type." });
        var rows = await db.Operations.AsNoTracking().Where(x => x.CompanyId == companyId && x.Kind == kind).OrderByDescending(x => x.StartedAt).Take(1000).ToListAsync(ct);
        var employees = await hr.Employees.AsNoTracking().Where(x => x.CompanyId == companyId && !x.IsDeleted)
            .Select(x => new { x.Id, x.FullName, x.EmployeeID }).OrderBy(x => x.FullName).ToListAsync(ct);
        return Ok(new { employees, items = rows.Select(x => new { x.Id, x.EmployeeId, x.Title, x.Notes, x.Status, x.StartedAt, x.CompletedAt,
            employeeName = employees.FirstOrDefault(e => e.Id == x.EmployeeId)?.FullName ?? "Archived employee" }), limit = 1000 });
    }
    [HttpPost]
    [Authorize(Policy = "Permission:hr.employees.write")]
    public async Task<IActionResult> Create(OperationRequest request, CancellationToken ct)
    {
        Scope(request.CompanyId);
        if (request.Kind is not ("Movement" or "Lifecycle") || string.IsNullOrWhiteSpace(request.Title) || request.Title.Length > 200 || request.Notes.Length > 2000)
            return BadRequest(new { message = "Provide an operation type, title (up to 200 characters) and notes (up to 2,000 characters)." });
        if (!await hr.Employees.AnyAsync(e => e.Id == request.EmployeeId && e.CompanyId == request.CompanyId && !e.IsDeleted, ct)) return NotFound(new { message = "Employee is unavailable in this company." });
        if (request.Kind == "Movement" && await db.Operations.AnyAsync(x => x.EmployeeId == request.EmployeeId && x.Kind == "Movement" && x.Status == "Open", ct))
            return Conflict(new { message = "This employee already has an open movement. Record their return first." });
        var item = new HrOperation { CompanyId = request.CompanyId, EmployeeId = request.EmployeeId, Kind = request.Kind,
            Title = request.Title.Trim(), Notes = request.Notes.Trim(), CreatedBy = Guid.Parse(User.FindFirstValue("sub")!) };
        db.Operations.Add(item); await db.SaveChangesAsync(ct); return Ok(new { item.Id });
    }
    [HttpPost("{id:guid}/complete")]
    [Authorize(Policy = "Permission:hr.employees.write")]
    public async Task<IActionResult> Complete(Guid id, [FromQuery] Guid companyId, CancellationToken ct)
    {
        Scope(companyId);
        var item = await db.Operations.SingleOrDefaultAsync(x => x.Id == id && x.CompanyId == companyId, ct);
        if (item is null) return NotFound();
        if (item.Status != "Open") return Conflict(new { message = "This record is already complete." });
        item.Status = "Completed"; item.CompletedAt = DateTimeOffset.UtcNow; item.UpdatedBy = Guid.Parse(User.FindFirstValue("sub")!);
        await db.SaveChangesAsync(ct); return Ok(new { message = "Completed." });
    }
}
public sealed record OperationRequest(Guid CompanyId, Guid EmployeeId, string Kind, string Title, string Notes);
