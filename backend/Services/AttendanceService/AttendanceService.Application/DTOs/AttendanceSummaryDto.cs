namespace AttendanceService.Application.DTOs;



public record AttendanceSummaryDto(

    string EmployeeID,

    int PunchNumber,

    int TotalPresent,

    int TotalAbsent,

    int TotalLate,

    int TotalEarlyOut,

    int TotalOTMinutes,

    int TotalWorkingMinutes,

    int TotalHolidays,

    int TotalWeeklyOffs);

