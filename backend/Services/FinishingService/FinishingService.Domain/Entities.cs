using Erp.BuildingBlocks.SharedKernel;

namespace FinishingService.Domain;

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

public sealed class FinishingReceive : AuditableEntity
{
    public Guid OrderId { get; set; }
    public Guid? StyleId { get; set; }
    public Guid? ProductionOutputId { get; set; }
    public string ReceiveNo { get; set; } = string.Empty;
    public DateOnly ReceiveDate { get; set; }
    public string FromDepartment { get; set; } = "Sewing";
    public int TotalReceiveQty { get; set; }
    public string Status { get; set; } = FinishingReceiveStatuses.Draft;
    public DateTime? ConfirmedAt { get; set; }
    public Guid? ConfirmedBy { get; set; }
    public ICollection<FinishingReceiveItem> Items { get; set; } = [];
}

public sealed class FinishingReceiveItem : AuditableEntity
{
    public Guid FinishingReceiveId { get; set; }
    public Guid OrderId { get; set; }
    public Guid? BuyerPurchaseOrderId { get; set; }
    public string? ColorName { get; set; }
    public string SizeName { get; set; } = string.Empty;
    public int ReceiveQty { get; set; }
    public FinishingReceive? FinishingReceive { get; set; }
}

public sealed class FinishingBatch : AuditableEntity
{
    public Guid OrderId { get; set; }
    public Guid? StyleId { get; set; }
    public string BatchNo { get; set; } = string.Empty;
    public DateOnly BatchDate { get; set; }
    public int TotalInputQty { get; set; }
    public string Status { get; set; } = FinishingBatchStatuses.Draft;
    public DateTime? StartedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public ICollection<FinishingInput> Inputs { get; set; } = [];
    public ICollection<IroningOutput> Ironings { get; set; } = [];
    public ICollection<FinishingQC> QCs { get; set; } = [];
    public ICollection<FoldingPacking> Foldings { get; set; } = [];
}

public sealed class FinishingInput : AuditableEntity
{
    public Guid FinishingBatchId { get; set; }
    public Guid OrderId { get; set; }
    public DateOnly InputDate { get; set; }
    public string? ColorName { get; set; }
    public string SizeName { get; set; } = string.Empty;
    public int InputQty { get; set; }
    public FinishingBatch? FinishingBatch { get; set; }
}

public sealed class IroningOutput : AuditableEntity
{
    public Guid FinishingBatchId { get; set; }
    public Guid OrderId { get; set; }
    public DateOnly OutputDate { get; set; }
    public string? ColorName { get; set; }
    public string SizeName { get; set; } = string.Empty;
    public int IronQty { get; set; }
    public int ReIronQty { get; set; }
    public FinishingBatch? FinishingBatch { get; set; }
}

public sealed class FinishingQC : AuditableEntity
{
    public Guid FinishingBatchId { get; set; }
    public Guid OrderId { get; set; }
    public DateOnly QCDate { get; set; }
    public string? ColorName { get; set; }
    public string SizeName { get; set; } = string.Empty;
    public int CheckedQty { get; set; }
    public int PassedQty { get; set; }
    public int AlterQty { get; set; }
    public int RejectQty { get; set; }
    public int DefectQty { get; set; }
    public FinishingBatch? FinishingBatch { get; set; }
    public ICollection<FinishingDefect> Defects { get; set; } = [];
}

public sealed class FinishingDefect : AuditableEntity
{
    public Guid FinishingQCId { get; set; }
    public string DefectType { get; set; } = string.Empty; // e.g. Oil Spot, Broken Stitch
    public int DefectQty { get; set; }
    public string? Remarks { get; set; }
    public FinishingQC? FinishingQC { get; set; }
}

public sealed class FoldingPacking : AuditableEntity
{
    public Guid FinishingBatchId { get; set; }
    public Guid OrderId { get; set; }
    public DateOnly PackingDate { get; set; }
    public string? ColorName { get; set; }
    public string SizeName { get; set; } = string.Empty;
    public int FoldingQty { get; set; }
    public int TaggingQty { get; set; }
    public int PolyQty { get; set; }
    public FinishingBatch? FinishingBatch { get; set; }
}

public sealed class CartonPacking : AuditableEntity
{
    public Guid OrderId { get; set; }
    public Guid? BuyerPurchaseOrderId { get; set; }
    public string CartonNo { get; set; } = string.Empty;
    public DateOnly PackingDate { get; set; }
    public string? CartonType { get; set; }
    public decimal GrossWeight { get; set; }
    public decimal NetWeight { get; set; }
    public decimal CBM { get; set; }
    public string Status { get; set; } = CartonPackingStatuses.Open;
    public DateTime? ClosedAt { get; set; }
    public ICollection<CartonPackingItem> Items { get; set; } = [];
}

public sealed class CartonPackingItem : AuditableEntity
{
    public Guid CartonPackingId { get; set; }
    public Guid OrderId { get; set; }
    public Guid? BuyerPurchaseOrderId { get; set; }
    public string? ColorName { get; set; }
    public string SizeName { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public CartonPacking? CartonPacking { get; set; }
}

public sealed class FinishedGoodsTransfer : AuditableEntity
{
    public Guid OrderId { get; set; }
    public string TransferNo { get; set; } = string.Empty;
    public DateOnly TransferDate { get; set; }
    public Guid? ToWarehouseId { get; set; }
    public string ToDepartment { get; set; } = "FinishedGoods";
    public int TotalTransferQty { get; set; }
    public string Status { get; set; } = FinishedGoodsTransferStatuses.Draft;
    public DateTime? ConfirmedAt { get; set; }
    public Guid? ConfirmedBy { get; set; }
    public ICollection<FinishedGoodsTransferItem> Items { get; set; } = [];
}

public sealed class FinishedGoodsTransferItem : AuditableEntity
{
    public Guid FinishedGoodsTransferId { get; set; }
    public Guid? CartonPackingId { get; set; }
    public Guid OrderId { get; set; }
    public Guid? BuyerPurchaseOrderId { get; set; }
    public string? ColorName { get; set; }
    public string SizeName { get; set; } = string.Empty;
    public int TransferQty { get; set; }
    public FinishedGoodsTransfer? FinishedGoodsTransfer { get; set; }
}

public sealed class FinishingWastage : AuditableEntity
{
    public Guid OrderId { get; set; }
    public Guid? FinishingBatchId { get; set; }
    public DateOnly WastageDate { get; set; }
    public string? ColorName { get; set; }
    public string? SizeName { get; set; }
    public int WastageQty { get; set; }
    public string WastageReason { get; set; } = string.Empty;
}

public sealed class FinishingBalance
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid CompanyId { get; set; }
    public Guid OrderId { get; set; }
    public Guid? BuyerPurchaseOrderId { get; set; }
    public string? ColorName { get; set; }
    public string SizeName { get; set; } = string.Empty;
    public int SewingOutputQty { get; set; }
    public int FinishingReceiveQty { get; set; }
    public int FinishingInputQty { get; set; }
    public int IronQty { get; set; }
    public int QCPassQty { get; set; }
    public int AlterQty { get; set; }
    public int RejectQty { get; set; }
    public int FoldingQty { get; set; }
    public int PolyQty { get; set; }
    public int CartonQty { get; set; }
    public int TransferQty { get; set; }
    public int BalanceQty { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

public sealed class FinishingAuditLog
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid CompanyId { get; set; }
    public string EntityName { get; set; } = string.Empty;
    public Guid EntityId { get; set; }
    public string Action { get; set; } = string.Empty;
    public Guid? UserId { get; set; }
    public string? Remarks { get; set; }
    public DateTime CreatedAt { get; set; } = BusinessTime.Now;
}
