using Erp.BuildingBlocks.SharedKernel;
using Xunit;

namespace AttendanceService.Tests;

public class OvertimeHourRulesTests
{
    [Theory]
    [InlineData(44, 0)]
    [InlineData(45, 1)]
    [InlineData(104, 1)]
    [InlineData(105, 2)]
    [InlineData(164, 2)]
    [InlineData(165, 3)]
    public void ConvertMinutesToHours_MatchesBucketRule(int minutes, int expectedHours)
    {
        Assert.Equal(expectedHours, OvertimeHourRules.ConvertMinutesToHours(minutes));
    }

    [Fact]
    public void ResolveOtHours_WhenDisabled_ReturnsZeroRegardlessOfMinutes()
    {
        Assert.Equal(0, OvertimeHourRules.ResolveOtHours(165, isOtEnabled: false));
        Assert.Equal(0, OvertimeHourRules.ResolveOtHours(775, isOtEnabled: false));
    }

    [Fact]
    public void ResolveOtHours_WhenEnabled_DelegatesToConvertMinutesToHours()
    {
        Assert.Equal(3, OvertimeHourRules.ResolveOtHours(165, isOtEnabled: true));
    }
}
