using Erp.BuildingBlocks.SharedKernel;
using ShiftService.Domain.Enums;

namespace ShiftService.Domain.Entities;

public sealed class Shift : AuditableEntity
{
    public Guid Id { get; set; }
    public Guid CompanyId { get; set; }
    public string ShiftName { get; set; } = string.Empty;
    public string ShiftType { get; set; } = string.Empty;
    public ShiftCategory ShiftCategory { get; set; } = ShiftCategory.GeneralDuty;
    public int PunchWindowBeforeMinutes { get; set; } = 60;
    public TimeSpan StartTime { get; set; }
    public TimeSpan EndTime { get; set; }
    public bool IsCrossDay { get; set; }
    public bool IsGeneralDuty { get; set; }
    public bool IsDefault { get; set; }
    public bool IsActive { get; set; } = true;
    public int? WeeklyOffDayOfWeek { get; set; }

    // Navigation properties
    public ShiftRule? Rule { get; set; }
    public ICollection<ShiftBreak> Breaks { get; set; } = new List<ShiftBreak>();
}
