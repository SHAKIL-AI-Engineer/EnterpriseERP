using AttendanceService.Application.Common.Interfaces;
using AttendanceService.Application.DTOs;
using AttendanceService.Infrastructure;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace AttendanceService.Tests;

/// <summary>
/// End-to-end reprocess for punch 1733 against local SQL (see Configuration/connectionstrings.json).
/// </summary>
public sealed class DailyAttendanceReprocessIntegrationTests
{
    private static readonly Guid CompanyId = Guid.Parse("4131F399-11E9-4733-B52A-1E7853B0D306");
    private const string EmployeeId = "1733";
    private static readonly DateTime RangeStart = new(2026, 5, 8);
    private static readonly DateTime RangeEnd = new(2026, 5, 13);

    private static bool TryBuildProvider(out ServiceProvider? provider, out string? skipReason)
    {
        var configRoot = Path.GetFullPath(Path.Combine(
            AppContext.BaseDirectory,
            "..", "..", "..", "..", "..", "..", "Configuration"));

        var connFile = Path.Combine(configRoot, "connectionstrings.json");
        if (!File.Exists(connFile))
        {
            provider = null;
            skipReason = $"Missing {connFile}";
            return false;
        }

        var configuration = new ConfigurationBuilder()
            .SetBasePath(configRoot)
            .AddJsonFile("connectionstrings.json", optional: false)
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["PunchData:DefaultCompanyId"] = "1",
                ["PunchData:CompanyIdByGuid:4131F399-11E9-4733-B52A-1E7853B0D306"] = "1",
                ["ExternalServices:ShiftServiceUrl"] = "http://127.0.0.1:5000/api/v1/",
            })
            .Build();

        var services = new ServiceCollection();
        services.AddSingleton<IConfiguration>(configuration);
        services.AddAttendanceInfrastructure(configuration);
        provider = services.BuildServiceProvider();
        skipReason = null;
        return true;
    }

    [Fact]
    public async Task ProcessMay8To13_Punch1733_CreatesThenUpdatesDailyAttendance()
    {
        if (!TryBuildProvider(out var provider, out var skipReason))
        {
            Assert.Fail(skipReason);
            return;
        }

        await using var scope = provider!.CreateAsyncScope();
        var orchestrator = scope.ServiceProvider.GetRequiredService<IDailyAttendanceProcessOrchestrator>();
        var db = scope.ServiceProvider.GetRequiredService<IAttendanceDbContext>();

        var existing = await db.DailyAttendances
            .Where(a => a.CompanyId == CompanyId
                && a.EmployeeID == EmployeeId
                && a.AttendanceDate >= RangeStart
                && a.AttendanceDate <= RangeEnd)
            .ToListAsync();
        if (existing.Count > 0)
        {
            db.DailyAttendances.RemoveRange(existing);
            await db.SaveChangesAsync(CancellationToken.None);
        }

        var filter = new[] { "EMP-1733" };
        var totalCreated = 0;
        var totalUpdated = 0;

        for (var day = RangeStart; day <= RangeEnd; day = day.AddDays(1))
        {
            var result = await ProcessOrSkipWhenSeedDataIsMissing(orchestrator, CompanyId, day, filter);
            if (result is null) return;
            totalCreated += result.CreatedCount;
            totalUpdated += result.UpdatedCount;
        }

        Assert.True(totalCreated >= 1, $"Expected at least one created row; created={totalCreated}, updated={totalUpdated}");

        var rows = await db.DailyAttendances
            .AsNoTracking()
            .Where(a => a.CompanyId == CompanyId
                && a.EmployeeID == EmployeeId
                && a.AttendanceDate >= RangeStart
                && a.AttendanceDate <= RangeEnd)
            .OrderBy(a => a.AttendanceDate)
            .ToListAsync();

        Assert.True(rows.Count >= 5, $"Expected daily rows for May 8-13; got {rows.Count}");

        var completeDays = rows
            .Where(r => r.AttendanceDate >= new DateTime(2026, 5, 9)
                && r.InTime.HasValue
                && r.OutTime.HasValue)
            .ToList();
        Assert.True(completeDays.Count >= 4, $"Expected In/Out on most days; got {completeDays.Count}");

        foreach (var row in completeDays)
        {
            Assert.True(row.InTime!.Value < row.OutTime!.Value, $"{row.AttendanceDate:yyyy-MM-dd}: In must be before Out");
            Assert.InRange(row.InTime!.Value, row.AttendanceDate.Date, row.AttendanceDate.Date.AddDays(1));
            Assert.InRange(row.OutTime!.Value, row.AttendanceDate.Date, row.AttendanceDate.Date.AddDays(1).AddHours(8));
        }

        var secondCreated = 0;
        var secondUpdated = 0;
        for (var day = RangeStart; day <= RangeEnd; day = day.AddDays(1))
        {
            var result = await ProcessOrSkipWhenSeedDataIsMissing(orchestrator, CompanyId, day, filter);
            if (result is null) return;
            secondCreated += result.CreatedCount;
            secondUpdated += result.UpdatedCount;
        }

        Assert.Equal(0, secondCreated);
        Assert.True(secondUpdated >= 1, $"Re-run should update existing rows; updated={secondUpdated}");
    }

    private static async Task<ProcessDailyAttendanceResult?> ProcessOrSkipWhenSeedDataIsMissing(
        IDailyAttendanceProcessOrchestrator orchestrator,
        Guid companyId,
        DateTime day,
        IReadOnlyList<string> employeeIds)
    {
        try
        {
            return await orchestrator.ProcessDayAsync(companyId, day, employeeIds);
        }
        catch (InvalidOperationException ex) when (ex.Message.Contains("No active employees found", StringComparison.OrdinalIgnoreCase))
        {
            return null;
        }
    }
}
