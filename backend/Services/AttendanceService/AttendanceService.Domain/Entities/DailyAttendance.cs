using Erp.BuildingBlocks.SharedKernel;
using AttendanceService.Domain.Enums;

namespace AttendanceService.Domain.Entities;

public sealed class DailyAttendance : AuditableEntity
{
    public Guid Id { get; set; }
    public Guid CompanyId { get; set; }
    public Guid EmployeeId { get; set; }
    public int PunchNumber { get; set; }
    public string EmployeeID { get; set; } = string.Empty;
    public DateTime AttendanceDate { get; set; }
    public Guid? ShiftId { get; set; }
    public string? ShiftName { get; set; }
    
    public DateTime? InTime { get; set; }
    public DateTime? OutTime { get; set; }
    public Guid? InPunchId { get; set; }
    public Guid? OutPunchId { get; set; }
    
    public AttendanceStatus Status { get; set; }
    public DayType DayType { get; set; }
    
    public int LateMinutes { get; set; }
    public int EarlyOutMinutes { get; set; }
    public int WorkingMinutes { get; set; }
    public int BreakMinutes { get; set; }
    public int OvertimeMinutes { get; set; }
    public int OTMinutes
    {
        get => OvertimeMinutes;
        set => OvertimeMinutes = value;
    }
    
    public bool IsManualIn { get; set; }
    public bool IsManualOut { get; set; }
    public string? Remarks { get; set; }
    public bool IsHoliday => DayType == DayType.Holiday;
    public bool IsWeeklyOff => DayType == DayType.WeeklyOff;
    
    public bool IsManualAdjusted { get; set; }
    public bool IsApproved { get; set; }
    public Guid? ApprovedBy { get; set; }
    public DateTime? ApprovedAt { get; set; }
    public bool IsPayrollLocked { get; set; }
}
