using PayrollService.Domain.Entities;

namespace PayrollService.Application;

public sealed class OvertimeCalculationService : IOvertimeCalculationService
{
    public (decimal RatePerHour, decimal Amount) Calculate(
        PayrollCalculationSettings settings,
        EmployeeSalary salary,
        decimal overtimeHours,
        decimal fixedRate = 0)
    {
        if (!settings.AllowOvertime || overtimeHours <= 0 ||
            string.Equals(settings.OvertimeCalculationType, "None", StringComparison.OrdinalIgnoreCase))
        {
            return (0, 0);
        }

        var divisor = settings.OvertimeDivisor <= 0 ? 208 : settings.OvertimeDivisor;
        var multiplier = settings.OvertimeMultiplier <= 0 ? 2 : settings.OvertimeMultiplier;
        var rate = settings.OvertimeCalculationType switch
        {
            "GrossSalaryBased" => salary.GrossSalary / divisor * multiplier,
            "FixedRate" => settings.FixedOvertimeRate ?? fixedRate,
            _ => salary.BasicSalary / divisor * multiplier,
        };

        var roundedRate = decimal.Round(rate, 2, MidpointRounding.AwayFromZero);
        return (roundedRate, decimal.Round(roundedRate * overtimeHours, 2, MidpointRounding.AwayFromZero));
    }
}

public sealed class BonusCalculationService : IBonusCalculationService
{
    public decimal CalculateAttendanceBonus(
        PayrollCalculationSettings settings,
        AttendanceSummary attendance,
        decimal configuredAmount,
        decimal allowedLateLimit)
    {
        if (!settings.AllowAttendanceBonus || !attendance.IsApproved)
        {
            return 0;
        }

        if (attendance.AbsentDays > 0 || attendance.LeaveWithoutPayDays > 0 || attendance.MissingPunchDays > 0 ||
            attendance.LateDays > allowedLateLimit)
        {
            return 0;
        }

        return configuredAmount;
    }

    public decimal CalculateFestivalBonus(decimal grossSalary, DateOnly joinDate, DateOnly bonusDate)
    {
        var months = ((bonusDate.Year - joinDate.Year) * 12) + bonusDate.Month - joinDate.Month;
        if (bonusDate.Day < joinDate.Day)
        {
            months--;
        }

        return months switch
        {
            >= 12 => decimal.Round(grossSalary / 2, 2, MidpointRounding.AwayFromZero),
            >= 6 => decimal.Round(grossSalary / 4, 2, MidpointRounding.AwayFromZero),
            _ => 0,
        };
    }
}

public sealed class PayrollCalculationService(
    IOvertimeCalculationService overtimeCalculationService,
    IBonusCalculationService bonusCalculationService) : IPayrollCalculationService
{
    private const decimal StandardHoursPerDay = 8m;

    public PayrollCalculationResult Calculate(
        PayrollCalculationSettings settings,
        EmployeeSalary salary,
        AttendanceSummary attendance,
        PayrollCalculationInputs inputs,
        string? salaryCalculationTypeOverride = null)
    {
        if (settings.UseApprovedAttendanceOnly && !attendance.IsApproved)
        {
            throw new InvalidOperationException("Attendance summary must be approved before payroll processing.");
        }

        var calcType = salaryCalculationTypeOverride ?? salary.SalaryCalculationType;
        if (string.IsNullOrWhiteSpace(calcType))
        {
            calcType = "Monthly";
        }

        var totalDays = ResolveTotalDays(settings, attendance);
        var overtimeHours = (decimal)attendance.OvertimeHours;
        var fixedOt = (decimal)(settings.FixedOvertimeRate ?? 0);
        var (otRate, otAmount) = overtimeCalculationService.Calculate(settings, salary, overtimeHours, fixedOt);

        decimal perDaySalary;
        decimal payableSalary;
        decimal absentDeduction;
        decimal lwpDeduction;
        decimal lateDeduction;

        switch (calcType.ToUpperInvariant())
        {
            case "DAILY":
                perDaySalary = totalDays > 0 ? salary.GrossSalary / totalDays : salary.GrossSalary;
                payableSalary = perDaySalary * attendance.PresentDays;
                absentDeduction = 0;
                lwpDeduction = perDaySalary * attendance.LeaveWithoutPayDays;
                lateDeduction = settings.AllowLateDeduction ? perDaySalary * attendance.LateDays : 0;
                break;

            case "HOURLY":
                var hourlyRate = totalDays > 0
                    ? salary.GrossSalary / (totalDays * StandardHoursPerDay)
                    : salary.GrossSalary / (30 * StandardHoursPerDay);
                var regularHours = attendance.PresentDays * StandardHoursPerDay;
                payableSalary = hourlyRate * regularHours;
                perDaySalary = hourlyRate * StandardHoursPerDay;
                absentDeduction = 0;
                lwpDeduction = 0;
                lateDeduction = settings.AllowLateDeduction ? perDaySalary * attendance.LateDays : 0;
                break;

            default:
                var absentPerDay = ResolveAbsentPerDay(settings, salary, totalDays);
                absentDeduction = settings.AllowAbsentDeduction ? absentPerDay * attendance.AbsentDays : 0;
                lwpDeduction = absentPerDay * attendance.LeaveWithoutPayDays;
                lateDeduction = settings.AllowLateDeduction ? absentPerDay * attendance.LateDays : 0;
                perDaySalary = absentPerDay;
                payableSalary = salary.GrossSalary - absentDeduction - lwpDeduction;
                break;
        }

        var tiffin = settings.AllowTiffinBill ? attendance.ApprovedTiffinDays * inputs.TiffinRate : 0;
        var night = settings.AllowNightBill ? attendance.ApprovedNightDutyDays * inputs.NightBillRate : 0;
        var attendanceBonus = bonusCalculationService.CalculateAttendanceBonus(
            settings, attendance, inputs.AttendanceBonusAmount, inputs.AllowedLateLimit);
        var earnLeave = settings.AllowEarnLeaveEncashment ? inputs.EarnLeaveEncashmentAmount : 0;

        var attendanceDeduction = absentDeduction + lwpDeduction;
        var totalEarnings = payableSalary + otAmount + tiffin + night + attendanceBonus + earnLeave;
        var totalDeduction = attendanceDeduction + lateDeduction + inputs.AdvanceDeduction + inputs.LoanDeduction +
                             inputs.TaxDeduction + inputs.ProvidentFundDeduction + inputs.OtherDeduction;
        var netSalary = totalEarnings - totalDeduction;

        return new PayrollCalculationResult(
            totalDays,
            decimal.Round(perDaySalary, 2, MidpointRounding.AwayFromZero),
            decimal.Round(payableSalary, 2, MidpointRounding.AwayFromZero),
            decimal.Round(attendanceDeduction, 2, MidpointRounding.AwayFromZero),
            decimal.Round(lateDeduction, 2, MidpointRounding.AwayFromZero),
            overtimeHours,
            otRate,
            otAmount,
            decimal.Round(tiffin, 2, MidpointRounding.AwayFromZero),
            decimal.Round(night, 2, MidpointRounding.AwayFromZero),
            decimal.Round(attendanceBonus, 2, MidpointRounding.AwayFromZero),
            decimal.Round(earnLeave, 2, MidpointRounding.AwayFromZero),
            decimal.Round(totalEarnings, 2, MidpointRounding.AwayFromZero),
            decimal.Round(totalDeduction, 2, MidpointRounding.AwayFromZero),
            decimal.Round(netSalary, 2, MidpointRounding.AwayFromZero));
    }

    private static decimal ResolveTotalDays(PayrollCalculationSettings settings, AttendanceSummary attendance)
    {
        var days = settings.MonthDayCalculationType switch
        {
            "CalendarDays" => attendance.TotalDays,
            "WorkingDays" => attendance.WorkingDays,
            "FixedDays" => settings.FixedMonthDays ?? 30,
            _ => attendance.TotalDays > 0 ? attendance.TotalDays : 30,
        };
        return days <= 0 ? 30 : days;
    }

    private static decimal ResolveAbsentPerDay(PayrollCalculationSettings settings, EmployeeSalary salary, decimal totalDays)
    {
        if (string.Equals(settings.AbsentDeductionBase, "Basic", StringComparison.OrdinalIgnoreCase))
        {
            var divisor = string.Equals(settings.AbsentDayDivisor, "CalendarDays", StringComparison.OrdinalIgnoreCase)
                ? totalDays
                : settings.FixedAbsentDays ?? 30;
            if (divisor <= 0)
            {
                return 0;
            }

            // Compliance spec uses whole-number basic for absent (e.g. 13033.00 / 30 = 434.43).
            var basicBase = decimal.Floor(salary.BasicSalary);
            return decimal.Round(basicBase / divisor, 2, MidpointRounding.AwayFromZero);
        }

        var grossDivisor = string.Equals(settings.AbsentDayDivisor, "FixedDays", StringComparison.OrdinalIgnoreCase)
            ? settings.FixedAbsentDays ?? totalDays
            : totalDays;
        if (grossDivisor <= 0)
        {
            grossDivisor = totalDays > 0 ? totalDays : 30;
        }

        return decimal.Round(salary.GrossSalary / grossDivisor, 2, MidpointRounding.AwayFromZero);
    }
}
