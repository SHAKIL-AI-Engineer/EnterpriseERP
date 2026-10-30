using PayrollService.Domain.Enums;

namespace PayrollService.Application;

public static class SalaryProcessingModeProfiles
{
    public static PayrollCalculationSettings ForMode(
        SalaryProcessingMode mode,
        string? overtimeCalculationType = null,
        decimal? fixedOvertimeRate = null)
    {
        var ot = string.IsNullOrWhiteSpace(overtimeCalculationType) ? "BasicSalaryBased" : overtimeCalculationType;

        return mode switch
        {
            SalaryProcessingMode.NonCompliance => new PayrollCalculationSettings(
                UseApprovedAttendanceOnly: false,
                AllowAbsentDeduction: false,
                AllowLateDeduction: false,
                AllowOvertime: !string.Equals(ot, "None", StringComparison.OrdinalIgnoreCase),
                OvertimeCalculationType: string.Equals(ot, "None", StringComparison.OrdinalIgnoreCase) ? "None" : ot,
                OvertimeMultiplier: 2,
                OvertimeDivisor: 208,
                MonthDayCalculationType: "FixedDays",
                FixedMonthDays: 30,
                AllowTiffinBill: false,
                AllowNightBill: false,
                AllowAttendanceBonus: false,
                AllowEarnLeaveEncashment: false,
                FixedOvertimeRate: fixedOvertimeRate),

            SalaryProcessingMode.MultiSalaryOt => new PayrollCalculationSettings(
                UseApprovedAttendanceOnly: true,
                AllowAbsentDeduction: true,
                AllowLateDeduction: true,
                AllowOvertime: !string.Equals(ot, "None", StringComparison.OrdinalIgnoreCase),
                OvertimeCalculationType: string.Equals(ot, "None", StringComparison.OrdinalIgnoreCase) ? "None" : ot,
                OvertimeMultiplier: 2,
                OvertimeDivisor: 208,
                MonthDayCalculationType: "FixedDays",
                FixedMonthDays: 30,
                AllowTiffinBill: true,
                AllowNightBill: true,
                AllowAttendanceBonus: false,
                AllowEarnLeaveEncashment: true,
                FixedOvertimeRate: fixedOvertimeRate),

            _ => new PayrollCalculationSettings(
                UseApprovedAttendanceOnly: true,
                AllowAbsentDeduction: true,
                AllowLateDeduction: true,
                AllowOvertime: !string.Equals(ot, "None", StringComparison.OrdinalIgnoreCase),
                OvertimeCalculationType: string.Equals(ot, "None", StringComparison.OrdinalIgnoreCase) ? "BasicSalaryBased" : ot,
                OvertimeMultiplier: 2,
                OvertimeDivisor: 208,
                MonthDayCalculationType: "FixedDays",
                FixedMonthDays: 30,
                AllowTiffinBill: false,
                AllowNightBill: false,
                AllowAttendanceBonus: false,
                AllowEarnLeaveEncashment: true,
                FixedOvertimeRate: fixedOvertimeRate),
        };
    }

    public static bool RequiresMonthlyAttendanceApproval(SalaryProcessingMode mode) =>
        mode is SalaryProcessingMode.FullCompliance or SalaryProcessingMode.MultiSalaryOt;

    public static bool RequiresPerEmployeeAttendance(SalaryProcessingMode mode) =>
        mode is SalaryProcessingMode.FullCompliance or SalaryProcessingMode.MultiSalaryOt;

    public static AttendanceSummary SyntheticFullMonthAttendance(Guid companyId, Guid employeeId, int year, int month, decimal totalDays = 30)
    {
        return new AttendanceSummary(
            companyId,
            employeeId,
            year,
            month,
            IsApproved: true,
            TotalDays: totalDays,
            WorkingDays: totalDays,
            PresentDays: totalDays,
            AbsentDays: 0,
            LeaveDays: 0,
            LeaveWithoutPayDays: 0,
            LateDays: 0,
            HolidayPresentDays: 0,
            WeeklyOffPresentDays: 0,
            OvertimeMinutes: 0,
            OvertimeHours: 0,
            ApprovedTiffinDays: 0,
            ApprovedNightDutyDays: 0,
            MissingPunchDays: 0);
    }

    public static (DateOnly Start, DateOnly End) MonthRange(int yearNo, int monthNo)
    {
        var start = new DateOnly(yearNo, monthNo, 1);
        var end = start.AddMonths(1).AddDays(-1);
        return (start, end);
    }
}
