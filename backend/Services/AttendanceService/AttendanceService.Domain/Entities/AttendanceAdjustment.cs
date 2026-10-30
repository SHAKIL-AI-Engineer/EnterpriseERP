using AttendanceService.Domain.Enums;

namespace AttendanceService.Domain.Entities;

public sealed class AttendanceAdjustment
{
    public Guid Id { get; set; }
    public Guid CompanyId { get; set; }
    public Guid EmployeeId { get; set; }
    public DateTime AttendanceDate { get; set; }
    public Guid? DailyAttendanceId { get; set; }
    
    public DateTime? OldInTime { get; set; }
    public DateTime? OldOutTime { get; set; }
    public DateTime? NewInTime { get; set; }
    public DateTime? NewOutTime { get; set; }
    
    public AttendanceStatus? OldStatus { get; set; }
    public AttendanceStatus? NewStatus { get; set; }
    
    public string Reason { get; set; } = string.Empty;
    public ApprovalStatus ApprovalStatus { get; set; } = ApprovalStatus.Pending;
    
    public Guid RequestedBy { get; set; }
    public DateTime RequestedAt { get; set; }
    
    public Guid? ApprovedBy { get; set; }
    public DateTime? ApprovedAt { get; set; }
    
    public Guid? RejectedBy { get; set; }
    public DateTime? RejectedAt { get; set; }
    public string? RejectReason { get; set; }
}
