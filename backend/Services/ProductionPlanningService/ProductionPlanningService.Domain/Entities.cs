using Erp.BuildingBlocks.SharedKernel;

namespace ProductionPlanningService.Domain;

public abstract class AuditableEntity
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid CompanyId { get; set; }
    public DateTime CreatedAt { get; set; } = BusinessTime.Now;
    public Guid? CreatedBy { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public Guid? UpdatedBy { get; set; }
    public byte[] RowVersion { get; set; } = [];
}

public sealed class LineCapacityPlan : AuditableEntity
{
    public Guid OrderId { get; set; }
    public string LineCode { get; set; } = string.Empty;
    public string LineName { get; set; } = string.Empty;
    public DateOnly PlanDate { get; set; }
    public int PlannedQty { get; set; }
    public int DailyCapacity { get; set; }
    public string Status { get; set; } = LinePlanStatuses.Planned;
}

public sealed class PlanningBalance : AuditableEntity
{
    public Guid OrderId { get; set; }
    public Guid? LineCapacityPlanId { get; set; }
    public int PlannedQty { get; set; }
    public int AssignedQty { get; set; }
    public int ActualQty { get; set; }
}
