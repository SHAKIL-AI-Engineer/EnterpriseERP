using AttendanceService.Application.Features.Attendance;
using AttendanceService.Domain.Entities;
using AttendanceService.Domain.Enums;
using Xunit;

namespace AttendanceService.Tests;

public class AttendanceReportHelperTests
{
    private static DailyAttendance Row(DateTime? inTime, DateTime? outTime, string? remarks = null) =>
        new()
        {
            Id = Guid.NewGuid(),
            CompanyId = Guid.NewGuid(),
            EmployeeId = Guid.NewGuid(),
            AttendanceDate = new DateTime(2026, 5, 27),
            Status = AttendanceStatus.Present,
            InTime = inTime,
            OutTime = outTime,
            Remarks = remarks,
        };

    [Fact]
    public void IsMissingEntry_InNullOutSet_Included()
    {
        var row = Row(null, new DateTime(2026, 5, 27, 18, 0, 0));
        Assert.True(AttendanceReportHelper.IsMissingEntry(row));
        Assert.Equal("InTime", AttendanceReportHelper.ResolveMissingType(row));
    }

    [Fact]
    public void IsMissingEntry_InSetOutNull_Included()
    {
        var row = Row(new DateTime(2026, 5, 27, 9, 0, 0), null);
        Assert.True(AttendanceReportHelper.IsMissingEntry(row));
        Assert.Equal("OutTime", AttendanceReportHelper.ResolveMissingType(row));
    }

    [Fact]
    public void IsMissingEntry_BothNull_Excluded()
    {
        var row = Row(null, null);
        Assert.False(AttendanceReportHelper.IsMissingEntry(row));
        Assert.Equal("Both", AttendanceReportHelper.ResolveMissingType(row));
    }

    [Fact]
    public void IsMissingEntry_BothSet_Excluded()
    {
        var row = Row(
            new DateTime(2026, 5, 27, 9, 0, 0),
            new DateTime(2026, 5, 27, 18, 0, 0));
        Assert.False(AttendanceReportHelper.IsMissingEntry(row));
        Assert.Equal("None", AttendanceReportHelper.ResolveMissingType(row));
    }

    [Fact]
    public void IsMissingEntry_BothSetWithPunchNotRecordedRemarks_Excluded()
    {
        var row = Row(
            new DateTime(2026, 5, 27, 9, 0, 0),
            new DateTime(2026, 5, 27, 18, 0, 0),
            "punch not recorded");
        Assert.False(AttendanceReportHelper.IsMissingEntry(row));
    }

    [Theory]
    [InlineData(AttendanceStatus.Present, "present", true)]
    [InlineData(AttendanceStatus.Late, "late", true)]
    [InlineData(AttendanceStatus.Absent, "present", false)]
    [InlineData(AttendanceStatus.Leave, "leave", true)]
    [InlineData(AttendanceStatus.Present, "all", true)]
    [InlineData(AttendanceStatus.Present, null, true)]
    public void MatchesAttendanceStatusFilter_respects_status(AttendanceStatus status, string? filter, bool expected)
    {
        Assert.Equal(expected, AttendanceReportHelper.MatchesAttendanceStatusFilter(status, filter));
    }
}
