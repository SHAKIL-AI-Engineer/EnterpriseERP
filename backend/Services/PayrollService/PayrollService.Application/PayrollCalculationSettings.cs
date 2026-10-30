namespace PayrollService.Application;

public sealed record PayrollCalculationSettings(
    bool UseApprovedAttendanceOnly,
    bool AllowAbsentDeduction,
    bool AllowLateDeduction,
    bool AllowOvertime,
    string OvertimeCalculationType,
    decimal OvertimeMultiplier,
    decimal OvertimeDivisor,
    string MonthDayCalculationType,
    int? FixedMonthDays,
    bool AllowTiffinBill,
    bool AllowNightBill,
    bool AllowAttendanceBonus,
    bool AllowEarnLeaveEncashment,
    decimal? FixedOvertimeRate = null,
    string AbsentDeductionBase = "Basic",
    string AbsentDayDivisor = "FixedDays",
    int? FixedAbsentDays = 30,
    string? PolicyCode = null);
