using Erp.BuildingBlocks.SharedKernel;

namespace ShipmentService.Domain;

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

public sealed class ShipmentReadiness : AuditableEntity
{
    public Guid OrderId { get; set; }
    public Guid? FinishedGoodsTransferId { get; set; }
    public int ReadyQty { get; set; }
    public DateOnly ReadyDate { get; set; }
    public string Status { get; set; } = ShipmentExecutionStatuses.Ready;
}

public sealed class ShipmentExecution : AuditableEntity
{
    public Guid OrderId { get; set; }
    public Guid? MerchandisingShipmentPlanId { get; set; }
    public DateOnly? ActualShipmentDate { get; set; }
    public int ShippedQty { get; set; }
    public string Status { get; set; } = ShipmentExecutionStatuses.Planned;
    public string? Destination { get; set; }
}
