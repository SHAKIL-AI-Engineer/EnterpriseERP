namespace AttendanceService.Application.DTOs;

/// <summary>Shape expected by PayrollService <c>AttendanceServiceClient</c>.</summary>
public sealed record PayrollMonthlyAttendanceSummaryDto(
    Guid CompanyId,
    Guid EmployeeId,
    int YearNo,
    int MonthNo,
    bool IsApproved,
    decimal TotalDays,
    decimal WorkingDays,
    decimal PresentDays,
    decimal AbsentDays,
    decimal LeaveDays,
    decimal LeaveWithoutPayDays,
    decimal LateDays,
    decimal HolidayPresentDays,
    decimal WeeklyOffPresentDays,
    int OvertimeMinutes,
    int OvertimeHours,
    decimal ApprovedTiffinDays,
    decimal ApprovedNightDutyDays,
    decimal MissingPunchDays);
