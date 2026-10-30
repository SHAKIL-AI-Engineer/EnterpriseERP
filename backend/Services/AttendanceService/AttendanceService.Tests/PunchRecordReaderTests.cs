using AttendanceService.Infrastructure.Services;
using Xunit;

namespace AttendanceService.Tests;

public class PunchRecordReaderTests
{
    [Fact]
    public void ToWallClockPunchTime_PreservesClockFaceFromOffset()
    {
        var offset = new DateTimeOffset(2026, 5, 13, 7, 56, 41, TimeSpan.Zero);
        var wall = PunchRecordReader.ToWallClockPunchTime(offset);
        Assert.Equal(2026, wall.Year);
        Assert.Equal(5, wall.Month);
        Assert.Equal(13, wall.Day);
        Assert.Equal(7, wall.Hour);
        Assert.Equal(56, wall.Minute);
        Assert.Equal(DateTimeKind.Unspecified, wall.Kind);
    }
}
