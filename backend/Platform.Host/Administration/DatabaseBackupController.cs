using System.Security.Claims;
using AuthService.Infrastructure.Identity;
using AuthService.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;

namespace EnterpriseERP.Platform.Host.Administration;

[ApiController]
[Route("api/v1/database")]
[Authorize(Roles = "SuperAdmin")]
public sealed class DatabaseBackupController(IConfiguration config, AdministratorDbContext db,
    UserManager<AppUser> users) : ControllerBase
{
    private static readonly string[] Keys = ["HrDb", "CompanyDb", "AttendanceDb", "LeaveDb", "ShiftDb", "PayrollDb", "AuthDb"];
    [HttpGet("backups")]
    public async Task<IActionResult> List(CancellationToken ct) => Ok(new {
        databases = Keys.Where(k => !string.IsNullOrEmpty(config.GetConnectionString(k))),
        items = await db.Backups.AsNoTracking().OrderByDescending(x => x.CreatedAt).Take(100).ToListAsync(ct)
    });

    [HttpPost("backup")]
    public async Task<IActionResult> Backup(BackupRequest request, CancellationToken ct)
    {
        if (!Keys.Contains(request.DatabaseKey)) return BadRequest(new { message = "Unknown database." });
        var connectionString = config.GetConnectionString(request.DatabaseKey);
        if (string.IsNullOrEmpty(connectionString)) return BadRequest(new { message = "Database is not configured." });
        var builder = new SqlConnectionStringBuilder(connectionString);
        var databaseName = builder.InitialCatalog;
        await using var connection = new SqlConnection(connectionString);
        await connection.OpenAsync(ct);
        await using var getDirectory = new SqlCommand("SELECT CAST(SERVERPROPERTY('InstanceDefaultBackupPath') AS nvarchar(4000))", connection);
        var directory = config["DatabaseBackup:ServerDirectory"] ?? (await getDirectory.ExecuteScalarAsync(ct))?.ToString();
        if (string.IsNullOrWhiteSpace(directory)) return Conflict(new { message = "Configure a SQL Server backup directory accessible to the SQL Server service account." });
        var item = new DatabaseBackup { DatabaseKey = request.DatabaseKey, DatabaseName = databaseName, CreatedBy = User.FindFirstValue("sub")!,
            FileName = $"erp_{request.DatabaseKey}_{DateTime.UtcNow:yyyyMMdd_HHmmss}_{Guid.NewGuid():N}.bak" };
        item.ServerPath = directory.TrimEnd('/', '\\') + (directory.Contains('\\') ? "\\" : "/") + item.FileName;
        db.Backups.Add(item); await db.SaveChangesAsync(ct);
        try
        {
            await using var command = new SqlCommand($"BACKUP DATABASE [{databaseName.Replace("]", "]]")}] TO DISK = @path WITH COPY_ONLY, CHECKSUM, INIT", connection) { CommandTimeout = 600 };
            command.Parameters.AddWithValue("@path", item.ServerPath);
            await command.ExecuteNonQueryAsync(ct);
            await Verify(connection, item.ServerPath, ct);
            item.Status = "Verified";
            await db.SaveChangesAsync(CancellationToken.None);
            return Ok(new { item.Id, item.FileName, item.ServerPath, item.Status, message = "SQL Server backup created and verified." });
        }
        catch (SqlException)
        {
            item.Status = "Failed"; await db.SaveChangesAsync(CancellationToken.None);
            return Problem(statusCode: 503, detail: "SQL Server could not create or verify this backup. Check backup permissions and the server directory.");
        }
    }

    [HttpPost("backups/{id:guid}/verify")]
    public async Task<IActionResult> VerifyBackup(Guid id, CancellationToken ct)
    {
        var item = await db.Backups.FindAsync([id], ct);
        if (item is null) return NotFound();
        await using var connection = new SqlConnection(config.GetConnectionString(item.DatabaseKey));
        await connection.OpenAsync(ct); await Verify(connection, item.ServerPath, ct);
        item.Status = "Verified"; await db.SaveChangesAsync(ct); return Ok(new { message = "Backup verification passed." });
    }

    [HttpPost("backups/{id:guid}/restore")]
    public async Task<IActionResult> Restore(Guid id, RestoreBackupRequest request, CancellationToken ct)
    {
        var user = await users.FindByIdAsync(User.FindFirstValue("sub")!);
        if (user is null || !await users.CheckPasswordAsync(user, request.CurrentPassword)) return Unauthorized(new { message = "Confirm your current password." });
        var item = await db.Backups.FindAsync([id], ct);
        if (item is null) return NotFound();
        if (item.DatabaseKey == "AuthDb") return Conflict(new { message = "Restore authentication data through the maintenance procedure while application services are stopped." });
        if (request.ConfirmDatabase != item.DatabaseName) return BadRequest(new { message = "Type the exact database name to confirm restoration." });
        var builder = new SqlConnectionStringBuilder(config.GetConnectionString(item.DatabaseKey)) { InitialCatalog = "master" };
        await using var connection = new SqlConnection(builder.ConnectionString);
        await connection.OpenAsync(ct); await Verify(connection, item.ServerPath, ct);
        var name = item.DatabaseName.Replace("]", "]]");
        // Always return the database to multi-user mode even if restore fails.
        await using var command = new SqlCommand($"""
            BEGIN TRY
              ALTER DATABASE [{name}] SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
              RESTORE DATABASE [{name}] FROM DISK = @path WITH REPLACE, CHECKSUM;
              ALTER DATABASE [{name}] SET MULTI_USER;
            END TRY
            BEGIN CATCH
              ALTER DATABASE [{name}] SET MULTI_USER;
              THROW;
            END CATCH
            """, connection) { CommandTimeout = 600 };
        command.Parameters.AddWithValue("@path", item.ServerPath);
        await command.ExecuteNonQueryAsync(ct);
        return Ok(new { message = "Database restored. Refresh the application before continuing." });
    }

    private static async Task Verify(SqlConnection connection, string path, CancellationToken ct)
    {
        await using var verify = new SqlCommand("RESTORE VERIFYONLY FROM DISK = @path WITH CHECKSUM", connection) { CommandTimeout = 600 };
        verify.Parameters.AddWithValue("@path", path); await verify.ExecuteNonQueryAsync(ct);
    }
}

public sealed class DatabaseBackup
{
    public Guid Id { get; set; } = Guid.NewGuid(); public string DatabaseKey { get; set; } = "";
    public string DatabaseName { get; set; } = ""; public string FileName { get; set; } = "";
    public string ServerPath { get; set; } = ""; public string Status { get; set; } = "Started";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow; public string CreatedBy { get; set; } = "";
}
public sealed record BackupRequest(string DatabaseKey);
public sealed record RestoreBackupRequest(string CurrentPassword, string ConfirmDatabase);
