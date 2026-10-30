using Erp.BuildingBlocks.Contracts.Pagination;

namespace ShiftService.Application.Shifts;

public interface IShiftManager
{
    // Shift Setup
    Task<Guid> CreateShiftAsync(CreateShiftDto dto);
    Task UpdateShiftAsync(Guid id, UpdateShiftDto dto);
    Task DeleteShiftAsync(Guid id);
    Task ToggleShiftStatusAsync(Guid id);
    Task<IEnumerable<ShiftDto>> GetCompanyShiftsAsync(Guid companyId);
    Task<ShiftDto?> GetShiftByIdAsync(Guid id);
    
    // Shift Assignment
    Task AssignShiftToEmployeeAsync(EmployeeShiftAssignmentDto dto);
    Task UnassignShiftAsync(Guid assignmentId);
    Task<ShiftAssignmentDto?> GetActiveShiftForEmployeeAsync(Guid employeeId, DateTime date);
    Task<IEnumerable<ShiftAssignmentDto>> GetEmployeeShiftHistoryAsync(Guid employeeId);
    
    // Holiday Management
    Task<Guid> CreateHolidayAsync(CreateHolidayDto dto);
    Task UpdateHolidayAsync(Guid id, CreateHolidayDto dto);
    Task DeleteHolidayAsync(Guid id);
    Task<IEnumerable<HolidayDto>> GetHolidaysAsync(Guid companyId, DateTime fromDate, DateTime toDate);
    
    // Rotation
    Task<Guid> CreateRotationAsync(CreateRotationDto dto);
}

public record ShiftDto(
    Guid Id, string Name, string NameBn, string Code,
    TimeSpan StartTime, TimeSpan EndTime, 
    bool IsNightShift, bool IsCrossDay,
    TimeSpan? BreakStartTime, int BreakDurationMinutes, bool IsBreakPaid,
    int LateGracePeriodMinutes, int MaxLateAllowedMinutes,
    int EarlyLeaveGraceMinutes, 
    bool IsOTEnabled, int OTStartAfterMinutes, int MinimumOTMinutes, int MaxOTAllowedMinutes,
    string ShiftType, string? ColorCode, bool IsActive, string? Remarks);

public record CreateShiftDto(
    Guid CompanyId, string Name, string NameBn, string Code,
    TimeSpan StartTime, TimeSpan EndTime, 
    bool IsNightShift, bool IsCrossDay,
    TimeSpan? BreakStartTime, int BreakDurationMinutes, bool IsBreakPaid,
    int LateGracePeriodMinutes, int MaxLateAllowedMinutes,
    int EarlyLeaveGraceMinutes, 
    bool IsOTEnabled, int OTStartAfterMinutes, int MinimumOTMinutes, int MaxOTAllowedMinutes,
    string ShiftType, string? ColorCode, string? Remarks);

public record UpdateShiftDto(
    string Name, string NameBn, string Code,
    TimeSpan StartTime, TimeSpan EndTime, 
    bool IsNightShift, bool IsCrossDay,
    TimeSpan? BreakStartTime, int BreakDurationMinutes, bool IsBreakPaid,
    int LateGracePeriodMinutes, int MaxLateAllowedMinutes,
    int EarlyLeaveGraceMinutes, 
    bool IsOTEnabled, int OTStartAfterMinutes, int MinimumOTMinutes, int MaxOTAllowedMinutes,
    string ShiftType, string? ColorCode, bool IsActive, string? Remarks);

public record EmployeeShiftAssignmentDto(
    Guid EmployeeId, Guid ShiftId,
    DateTime FromDate, DateTime? ToDate,
    bool IsTemporary, string? Remarks);

public record ShiftAssignmentDto(
    Guid Id, Guid EmployeeId, Guid ShiftId, string ShiftName,
    DateTime FromDate, DateTime? ToDate,
    bool IsTemporary, string? Remarks);

public record CreateHolidayDto(
    Guid CompanyId, string Name, string NameBn, 
    DateTime Date, string Type, bool IsRecurring, string? Remarks);

public record HolidayDto(
    Guid Id, string Name, string NameBn, 
    DateTime Date, string Type, bool IsRecurring, string? Remarks);

public record CreateRotationDto(
    Guid CompanyId, string Name, string NameBn, 
    List<RotationRuleDto> Rules);

public record RotationRuleDto(Guid ShiftId, int Sequence, int DurationDays);
