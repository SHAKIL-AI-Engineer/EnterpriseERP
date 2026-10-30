namespace AttendanceService.Application.DTOs;

public sealed record AttendanceFilterDto(
    Guid CompanyId,
    DateTime FromDate,
    DateTime ToDate,
    Guid? DepartmentId = null,
    Guid? SectionId = null,
    Guid? DesignationId = null,
    Guid? GroupId = null,
    string? LineName = null,
    string? AttendanceStatus = null,
    string? EmployeeID = null,
    string? SearchTerm = null,
    DateTime? Date = null);

public sealed record DailyReportRowDto(
    int Id,
    int EmployeeCard,
    string EmployeeId,
    int CompanyId,
    string EmployeeName,
    string Department,
    string Section,
    string Designation,
    string Line,
    string Shift,
    string Date,
    string? InTime,
    string? OutTime,
    string Status,
    decimal OtHours);

public sealed record AttendanceSummaryTotalsDto(
    int TotalHeadcount,
    int PresentCount,
    int AbsentCount,
    int LateCount,
    int LeaveCount,
    decimal AttendanceRate);

public sealed record NamedSummaryBucketDto(
    int Id,
    int TotalEmployees,
    int Present,
    int Absent,
    int Late,
    int OnLeave,
    decimal AttendanceRate,
    string Name,
    int? DepartmentId = null,
    int? SectionId = null,
    int? DesignationId = null,
    int? LineId = null,
    int? GroupId = null);

public sealed record DailySummaryReportDto(
    AttendanceSummaryTotalsDto OverallSummary,
    IReadOnlyList<NamedSummaryBucketDto> DepartmentSummaries,
    IReadOnlyList<NamedSummaryBucketDto> SectionSummaries,
    IReadOnlyList<NamedSummaryBucketDto> DeptSectionSummaries,
    IReadOnlyList<NamedSummaryBucketDto> DesignationSummaries,
    IReadOnlyList<NamedSummaryBucketDto> LineSummaries,
    IReadOnlyList<NamedSummaryBucketDto> GroupSummaries);

public sealed record JobCardEmployeeDto(
    int EmployeeCard,
    string EmployeeId,
    string EmployeeName,
    string Department,
    string Designation,
    string Section,
    string? JoiningDate,
    string? Grade,
    string? Shift);

public sealed record JobCardDayRowDto(
    string Date,
    string Day,
    string Status,
    string? InTime,
    string? OutTime,
    int LateMinutes,
    int EarlyMinutes,
    decimal OtHours,
    decimal TotalHours,
    string? Shift,
    int? ShiftId,
    bool IsOffDay,
    string? Remarks);

public sealed record JobCardSummaryDto(
    int PresentDays,
    int AbsentDays,
    int WeekendDays,
    int HolidayDays,
    decimal TotalOTHours,
    int TotalLateMinutes,
    int TotalEarlyMinutes);

public sealed record JobCardReportDto(
    JobCardEmployeeDto Employee,
    JobCardSummaryDto Summary,
    IReadOnlyList<JobCardDayRowDto> AttendanceRecords,
    string FromDate,
    string ToDate);

public sealed record JobCardRosterItemDto(
    int EmployeeCard,
    string EmployeeId,
    string EmployeeName,
    string Department,
    string Section,
    string Designation);

public sealed record PagedJobCardRosterDto(
    IReadOnlyList<JobCardRosterItemDto> Items,
    int Page,
    int PageSize,
    int TotalCount);

public sealed record MissingEntryRowDto(
    int Id,
    int EmployeeCard,
    string EmployeeId,
    string EmployeeName,
    int? CompanyId,
    string Department,
    string Designation,
    string? Shift,
    string Date,
    string? InTime,
    string? OutTime,
    string MissingType,
    string Status);

public sealed record MissingEntrySummaryDto(
    int TotalMissing,
    int MissingInTime,
    int MissingOutTime,
    int MissingBoth,
    int CriticalCount);

public sealed record MissingEntriesReportDto(
    MissingEntrySummaryDto Summary,
    IReadOnlyList<MissingEntryRowDto> Entries);

public sealed record AbsenteeismRowDto(
    int Id,
    int EmployeeCard,
    string EmployeeId,
    string EmployeeName,
    string Department,
    string Designation,
    string Date,
    string Status,
    int ConsecutiveDays,
    string? Remarks);

public sealed record AbsenteeismSummaryDto(
    int TotalAbsent,
    int AbsentWithoutLeave,
    int OnLeave,
    int CriticalCases);

public sealed record AbsenteeismReportDto(
    AbsenteeismSummaryDto Summary,
    IReadOnlyList<AbsenteeismRowDto> Records);

public sealed record DailyOtSheetRowDto(
    int Id,
    int EmployeeCard,
    string EmployeeId,
    string EmployeeName,
    string Department,
    string Section,
    string Designation,
    string Shift,
    string Date,
    string? InTime,
    string? OutTime,
    decimal OtHours,
    string Status);

public sealed record DailyOtSummaryRowDto(
    int Id,
    string Name,
    int EmployeeCount,
    decimal TotalOtHours,
    string? DepartmentName = null,
    string? SectionName = null);

public sealed record ProcessRangeResult(
    int DaysProcessed,
    int RecordsProcessed,
    int PresentCount,
    int AbsentCount,
    int LateCount,
    int CreatedCount,
    int UpdatedCount,
    int SkippedLockedCount,
    Guid BatchId,
    IReadOnlyList<ProcessRangeDayError> Errors);

public sealed record ProcessRangeDayError(string Date, string Message);

public sealed record BulkAdjustEntryDto(
    Guid? DailyAttendanceId,
    string? EmployeeID,
    DateTime? Date,
    DateTime? InTime,
    DateTime? OutTime,
    string? Remarks);

public sealed record BulkAdjustResult(int SuccessCount, int FailedCount, IReadOnlyList<string> Errors);
