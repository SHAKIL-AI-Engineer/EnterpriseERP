using AttendanceService.Application.Common;
using AttendanceService.Application.Common.Interfaces;
using Xunit;

namespace AttendanceService.Tests;

public sealed class EmployeeFilterMatcherTests
{
    private static EmployeeDirectoryEntry Employee(int punchNumber, string employeeId) =>
        new(Guid.NewGuid(), punchNumber, employeeId);

    [Theory]
    [InlineData("1733", true)]
    [InlineData("EMP-1733", true)]
    [InlineData("emp-1733", true)]
    [InlineData("1734", false)]
    [InlineData("EMP-1734", false)]
    [InlineData("Lo-1733", false)]
    public void Matches_NumericEmployeeId_AcceptsPlainAndEmpFormats(string filterToken, bool expected)
    {
        var employee = Employee(1733, "1733");

        Assert.Equal(expected, EmployeeFilterMatcher.Matches(employee, filterToken));
    }

    [Theory]
    [InlineData("EMP-0001", true)]
    [InlineData("1", true)]
    [InlineData("9999", false)]
    public void Matches_FormattedEmployeeId_AcceptsEmpAndPunchFormats(string filterToken, bool expected)
    {
        var employee = Employee(1, "EMP-0001");

        Assert.Equal(expected, EmployeeFilterMatcher.Matches(employee, filterToken));
    }
}
