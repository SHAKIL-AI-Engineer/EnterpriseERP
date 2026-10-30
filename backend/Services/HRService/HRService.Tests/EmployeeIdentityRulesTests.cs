using HRService.Application.Employees;



namespace HRService.Tests;



public class EmployeeIdentityRulesTests

{

    [Theory]

    [InlineData("2514")]

    [InlineData("Lo-0001")]

    [InlineData("Cle-0025")]

    [InlineData("EMP-0001")]

    [InlineData("-001")]

    [InlineData("under_score")]

    [InlineData("ID/2024-001")]

    public void ValidateEmployeeId_accepts_user_codes(string employeeId)

    {

        var ex = Record.Exception(() => EmployeeIdentityRules.ValidateEmployeeId(employeeId));

        Assert.Null(ex);

    }



    [Theory]

    [InlineData("")]

    [InlineData("   ")]

    [InlineData("bad id")]

    public void ValidateEmployeeId_rejects_invalid_codes(string employeeId)

    {

        Assert.Throws<InvalidOperationException>(() => EmployeeIdentityRules.ValidateEmployeeId(employeeId));

    }



    [Fact]

    public void ValidateEmployeeId_rejects_too_long_codes()

    {

        var tooLong = new string('A', EmployeeIdentityRules.EmployeeIdMaxLength + 1);

        Assert.Throws<InvalidOperationException>(() => EmployeeIdentityRules.ValidateEmployeeId(tooLong));

    }



    [Fact]

    public void NormalizeEmployeeId_trims_only()

    {

        Assert.Equal("Lo-0001", EmployeeIdentityRules.NormalizeEmployeeId("  Lo-0001  "));

        Assert.Equal("2514", EmployeeIdentityRules.NormalizeEmployeeId("2514"));

    }



    [Theory]

    [InlineData("EMP-0001", 1)]

    [InlineData("emp-0042", 42)]

    [InlineData("2514", 0)]

    public void TryParseAutoSequence_parses_emp_prefix_only(string employeeId, int expected)

    {

        var ok = EmployeeIdentityRules.TryParseAutoSequence(employeeId, out var sequence);

        if (employeeId.StartsWith("EMP-", StringComparison.OrdinalIgnoreCase))

        {

            Assert.True(ok);

            Assert.Equal(expected, sequence);

        }

        else

        {

            Assert.False(ok);

        }

    }



    [Fact]

    public void FormatEmployeeId_uses_emp_prefix()

    {

        Assert.Equal("EMP-0001", EmployeeIdentityRules.FormatEmployeeId(1));

        Assert.Equal("EMP-0123", EmployeeIdentityRules.FormatEmployeeId(123));

    }

}


