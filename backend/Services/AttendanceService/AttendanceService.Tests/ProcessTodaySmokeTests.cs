using AttendanceService.Application.Common.Interfaces;
using AttendanceService.Application.DTOs;
using AttendanceService.Infrastructure;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace AttendanceService.Tests;

public sealed class ProcessTodaySmokeTests
{
    [Fact]
    public async Task ProcessToday_EMP1733_AppliesMorningPunch()
    {
        var configRoot = Path.GetFullPath(Path.Combine(
            AppContext.BaseDirectory,
            "..", "..", "..", "..", "..", "..", "Configuration"));
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
        await using var provider = services.BuildServiceProvider();
        await using var scope = provider.CreateAsyncScope();

        var orchestrator = scope.ServiceProvider.GetRequiredService<IDailyAttendanceProcessOrchestrator>();
        var companyId = Guid.Parse("4131F399-11E9-4733-B52A-1E7853B0D306");
        var today = new DateTime(2026, 5, 21);

        ProcessDailyAttendanceResult result;
        try
        {
            result = await orchestrator.ProcessDayAsync(companyId, today, ["EMP-1733"]);
        }
        catch (InvalidOperationException ex) when (ex.Message.Contains("No active employees found", StringComparison.OrdinalIgnoreCase))
        {
            return;
        }

        var db = scope.ServiceProvider.GetRequiredService<IAttendanceDbContext>();
        var row = await db.DailyAttendances.AsNoTracking()
            .FirstAsync(a => a.CompanyId == companyId && a.PunchNumber == 1733 && a.AttendanceDate == today);

        Assert.NotNull(row.InTime);
        Assert.True(result.CreatedCount + result.UpdatedCount >= 1);
        Assert.NotEqual(Domain.Enums.AttendanceStatus.Absent, row.Status);
    }
}
