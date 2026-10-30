using Microsoft.EntityFrameworkCore;

namespace EnterpriseERP.Platform.Host.Administration;

public sealed class AdministratorDbContext(DbContextOptions<AdministratorDbContext> options) : DbContext(options)
{
    public DbSet<AdministratorEvent> Events => Set<AdministratorEvent>();
    public DbSet<DatabaseBackup> Backups => Set<DatabaseBackup>();
    public DbSet<AdministratorBug> Bugs => Set<AdministratorBug>();

    protected override void OnModelCreating(ModelBuilder model)
    {
        model.Entity<DatabaseBackup>().ToTable("Backups", "administrator");
        model.Entity<AdministratorEvent>().ToTable("Events", "administrator");
        model.Entity<AdministratorBug>().ToTable("Bugs", "administrator");
    }

    public Task InitializeAsync() => Database.ExecuteSqlRawAsync("""
        IF SCHEMA_ID(N'administrator') IS NULL EXEC(N'CREATE SCHEMA administrator');
        IF OBJECT_ID(N'administrator.Backups', N'U') IS NULL
        BEGIN
          CREATE TABLE administrator.Backups (
            Id uniqueidentifier NOT NULL PRIMARY KEY, DatabaseKey nvarchar(max) NOT NULL,
            DatabaseName nvarchar(max) NOT NULL, FileName nvarchar(max) NOT NULL,
            ServerPath nvarchar(max) NOT NULL, Status nvarchar(max) NOT NULL,
            CreatedAt datetime2 NOT NULL, CreatedBy nvarchar(max) NOT NULL
          );
        END;
        IF OBJECT_ID(N'administrator.Events', N'U') IS NULL
        BEGIN
          CREATE TABLE administrator.Events (
            Id uniqueidentifier NOT NULL PRIMARY KEY,
            CreatedAt datetime2 NOT NULL, Level nvarchar(20) NOT NULL,
            Method nvarchar(12) NOT NULL, Path nvarchar(1024) NOT NULL,
            StatusCode int NOT NULL, DurationMs bigint NOT NULL,
            TraceId nvarchar(128) NOT NULL, Actor nvarchar(256) NOT NULL,
            Resolved bit NOT NULL DEFAULT 0, Resolution nvarchar(2000) NOT NULL DEFAULT '',
            ResolvedBy nvarchar(256) NOT NULL DEFAULT '', ResolvedAt datetime2 NULL
          );
          CREATE INDEX IX_AdministratorEvents_CreatedAt ON administrator.Events(CreatedAt DESC);
          CREATE INDEX IX_AdministratorEvents_Status ON administrator.Events(StatusCode, Resolved, CreatedAt DESC);
        END;
        IF OBJECT_ID(N'administrator.Bugs', N'U') IS NULL
        BEGIN
          CREATE TABLE administrator.Bugs (
            Id uniqueidentifier NOT NULL PRIMARY KEY,
            Title nvarchar(160) NOT NULL, Priority nvarchar(20) NOT NULL,
            Status nvarchar(20) NOT NULL, AffectedPath nvarchar(1024) NOT NULL,
            Steps nvarchar(max) NOT NULL, Expected nvarchar(4000) NOT NULL,
            Actual nvarchar(4000) NOT NULL, Notes nvarchar(4000) NOT NULL,
            ReportedBy nvarchar(256) NOT NULL, UpdatedBy nvarchar(256) NOT NULL,
            CreatedAt datetime2 NOT NULL, UpdatedAt datetime2 NOT NULL
          );
          CREATE INDEX IX_AdministratorBugs_Status ON administrator.Bugs(Status, CreatedAt DESC);
        END;
        """);
}

public sealed class AdministratorEvent
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public string Level { get; set; } = "Information";
    public string Method { get; set; } = "";
    public string Path { get; set; } = "";
    public int StatusCode { get; set; }
    public long DurationMs { get; set; }
    public string TraceId { get; set; } = "";
    public string Actor { get; set; } = "";
    public bool Resolved { get; set; }
    public string Resolution { get; set; } = "";
    public string ResolvedBy { get; set; } = "";
    public DateTime? ResolvedAt { get; set; }
}

public sealed class AdministratorBug
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Title { get; set; } = "";
    public string Priority { get; set; } = "Medium";
    public string Status { get; set; } = "Open";
    public string AffectedPath { get; set; } = "";
    public string Steps { get; set; } = "";
    public string Expected { get; set; } = "";
    public string Actual { get; set; } = "";
    public string Notes { get; set; } = "";
    public string ReportedBy { get; set; } = "";
    public string UpdatedBy { get; set; } = "";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
