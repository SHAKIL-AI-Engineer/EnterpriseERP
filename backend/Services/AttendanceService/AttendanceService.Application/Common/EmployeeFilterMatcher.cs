using AttendanceService.Application.Common.Interfaces;

namespace AttendanceService.Application.Common;

public static class EmployeeFilterMatcher
{
    public static bool Matches(EmployeeDirectoryEntry employee, string filterToken)
    {
        var token = filterToken.Trim();
        if (token.Length == 0)
        {
            return false;
        }

        if (string.Equals(employee.EmployeeID, token, StringComparison.OrdinalIgnoreCase))
        {
            return true;
        }

        if (employee.PunchNumber > 0
            && string.Equals(token, FormatEmpSequence(employee.PunchNumber), StringComparison.OrdinalIgnoreCase))
        {
            return true;
        }

        if (!TryParseFilterPunchNumber(token, out var punchNumber))
        {
            return false;
        }

        return employee.PunchNumber > 0 && employee.PunchNumber == punchNumber;
    }

    public static bool TryParseFilterPunchNumber(string filterToken, out int punchNumber)
    {
        punchNumber = 0;
        var token = filterToken.Trim();
        if (token.Length == 0)
        {
            return false;
        }

        if (int.TryParse(token, out punchNumber) && punchNumber > 0)
        {
            return true;
        }

        if (!token.StartsWith("EMP-", StringComparison.OrdinalIgnoreCase))
        {
            return false;
        }

        return int.TryParse(token[4..], out punchNumber) && punchNumber > 0;
    }

    private static string FormatEmpSequence(int punchNumber) => $"EMP-{punchNumber:D4}";
}
