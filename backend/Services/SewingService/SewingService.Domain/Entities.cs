using Erp.BuildingBlocks.SharedKernel;

namespace SewingService.Domain;

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

public sealed class SewingLine : AuditableEntity
{
    public int SerialNo { get; set; }
    public string LineName { get; set; } = string.Empty;
    public string Status { get; set; } = SewingLineStatuses.Active;
}

public sealed class ProductionAssignment : AuditableEntity
{
    public Guid OrderId { get; set; }
    public Guid SewingLineId { get; set; }
    public string? StyleNo { get; set; }
    public string? BuyerName { get; set; }
    public int TotalTarget { get; set; }
    public DateOnly AssignDate { get; set; }
    public string Status { get; set; } = AssignmentStatuses.Draft;
    public SewingLine? SewingLine { get; set; }
    public ICollection<ProductionTarget> Targets { get; set; } = [];
    public ICollection<DailyProductionRecord> DailyRecords { get; set; } = [];
}

public sealed class ProductionTarget : AuditableEntity
{
    public Guid AssignmentId { get; set; }
    public DateOnly TargetDate { get; set; }
    public int DailyTarget { get; set; }
    public int HourlyTarget { get; set; }
    public string? Remarks { get; set; }
    public ProductionAssignment? Assignment { get; set; }
}

public sealed class DailyProductionRecord : AuditableEntity
{
    public Guid AssignmentId { get; set; }
    public DateOnly RecordDate { get; set; }
    public int DailyTarget { get; set; }
    public int HourlyTarget { get; set; }
    public int H1 { get; set; }
    public int H2 { get; set; }
    public int H3 { get; set; }
    public int H4 { get; set; }
    public int H5 { get; set; }
    public int H6 { get; set; }
    public int H7 { get; set; }
    public int H8 { get; set; }
    public int H9 { get; set; }
    public int H10 { get; set; }
    public int H11 { get; set; }
    public int H12 { get; set; }
    public int H13 { get; set; }
    public int H14 { get; set; }
    public int H15 { get; set; }
    public int H16 { get; set; }
    public int H17 { get; set; }
    public int H18 { get; set; }
    public int H19 { get; set; }
    public int TotalCompleted { get; set; }
    public ProductionAssignment? Assignment { get; set; }
}

public sealed class PanelTransferReceipt : AuditableEntity
{
    public Guid OrderId { get; set; }
    public Guid CuttingTransferId { get; set; }
    public string ReceiptNo { get; set; } = string.Empty;
    public DateOnly ReceiptDate { get; set; }
    public int TotalQty { get; set; }
    public string Status { get; set; } = PanelReceiptStatuses.Draft;
}

public sealed class SewingOutput : AuditableEntity
{
    public Guid OrderId { get; set; }
    public Guid? AssignmentId { get; set; }
    public string OutputNo { get; set; } = string.Empty;
    public DateOnly OutputDate { get; set; }
    public string? ColorName { get; set; }
    public string SizeName { get; set; } = string.Empty;
    public int OutputQty { get; set; }
    public string Status { get; set; } = SewingOutputStatuses.Created;
}

public sealed class SewingBalance : AuditableEntity
{
    public Guid OrderId { get; set; }
    public string? ColorName { get; set; }
    public string SizeName { get; set; } = string.Empty;
    public int PanelReceivedQty { get; set; }
    public int SewnOutputQty { get; set; }
    public int WipQty { get; set; }
}
