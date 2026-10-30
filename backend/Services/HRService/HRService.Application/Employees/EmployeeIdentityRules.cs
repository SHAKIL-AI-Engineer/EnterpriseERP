namespace HRService.Application.Employees;



public static class EmployeeIdentityRules

{

    public const int EmployeeIdMaxLength = 32;



    /// <summary>

    /// User-supplied codes: any non-whitespace text up to 32 chars (e.g. 2514, Lo-0001, Cle-0025).

    /// Auto-generated codes use EMP-#### via <see cref="FormatEmployeeId"/>.

    /// </summary>

    public static void ValidatePunchNumber(int punchNumber)

    {

        if (punchNumber <= 0)

        {

            throw new InvalidOperationException("PunchNumber must be a positive integer.");

        }

    }



    public static void ValidateEmployeeId(string employeeId)

    {

        var trimmed = employeeId.Trim();

        if (trimmed.Length == 0)

        {

            throw new InvalidOperationException("EmployeeID is required.");

        }



        if (trimmed.Length > EmployeeIdMaxLength)

        {

            throw new InvalidOperationException($"EmployeeID cannot exceed {EmployeeIdMaxLength} characters.");

        }



        if (trimmed.Any(char.IsWhiteSpace))

        {

            throw new InvalidOperationException(

                "EmployeeID cannot contain spaces. Use letters, digits, or symbols (e.g. 2514, Lo-0001).");

        }

    }



    public static string NormalizeEmployeeId(string employeeId) => employeeId.Trim();



    public static string FormatEmployeeId(int sequence) => $"EMP-{sequence:D4}";



    public static bool TryParseAutoSequence(string employeeId, out int sequence)

    {

        sequence = 0;

        var trimmed = employeeId.Trim();

        if (!trimmed.StartsWith("EMP-", StringComparison.OrdinalIgnoreCase))

        {

            return false;

        }



        var suffix = trimmed[4..];

        return int.TryParse(suffix, out sequence) && sequence > 0;

    }

}


