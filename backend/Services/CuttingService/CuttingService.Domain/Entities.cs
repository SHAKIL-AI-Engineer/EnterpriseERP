using Erp.BuildingBlocks.SharedKernel;

namespace CuttingService.Domain;

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

public sealed class CuttingPlan : AuditableEntity
{
    public Guid OrderId { get; set; }
    public Guid? StyleId { get; set; }
    public string PlanNo { get; set; } = string.Empty;
    public DateOnly PlanDate { get; set; }
    public string? ColorName { get; set; }
    public int TotalPlanQty { get; set; }
    public string Status { get; set; } = CuttingPlanStatuses.Draft;
    public Guid? ApprovedBy { get; set; }
    public DateTime? ApprovedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public ICollection<CuttingPlanSizeBreakdown> SizeBreakdowns { get; set; } = [];
    public ICollection<FabricIssueToCutting> FabricIssues { get; set; } = [];
    public ICollection<CuttingLay> Lays { get; set; } = [];
    public ICollection<CuttingOutput> Outputs { get; set; } = [];
}

public sealed class CuttingPlanSizeBreakdown : AuditableEntity
{
    public Guid CuttingPlanId { get; set; }
    public string SizeName { get; set; } = string.Empty;
    public int PlanQty { get; set; }
    public CuttingPlan? CuttingPlan { get; set; }
}

public sealed class FabricIssueToCutting : AuditableEntity
{
    public Guid OrderId { get; set; }
    public Guid? CuttingPlanId { get; set; }
    public Guid? InventoryIssueId { get; set; }
    public string IssueNo { get; set; } = string.Empty;
    public DateOnly IssueDate { get; set; }
    public Guid FabricItemId { get; set; }
    public decimal IssueQty { get; set; }
    public string UnitName { get; set; } = string.Empty;
    public string? LotNo { get; set; }
    public string? BatchNo { get; set; }
    public string? ColorName { get; set; }
    public string Status { get; set; } = FabricIssueStatuses.Received;
    public CuttingPlan? CuttingPlan { get; set; }
}

public sealed class CuttingLay : AuditableEntity
{
    public Guid CuttingPlanId { get; set; }
    public string LayNo { get; set; } = string.Empty;
    public DateOnly LayDate { get; set; }
    public string? MarkerNo { get; set; }
    public decimal FabricLength { get; set; }
    public int PlyQty { get; set; }
    public int LayQty { get; set; }
    public string Status { get; set; } = CuttingLayStatuses.Open;
    public CuttingPlan? CuttingPlan { get; set; }
    public ICollection<CuttingLaySizeDetail> SizeDetails { get; set; } = [];
}

public sealed class CuttingLaySizeDetail : AuditableEntity
{
    public Guid CuttingLayId { get; set; }
    public string SizeName { get; set; } = string.Empty;
    public int RatioQty { get; set; }
    public int PlyQty { get; set; }
    public int CutQty { get; set; }
    public CuttingLay? CuttingLay { get; set; }
}

public sealed class CuttingOutput : AuditableEntity
{
    public Guid CuttingPlanId { get; set; }
    public Guid? CuttingLayId { get; set; }
    public Guid OrderId { get; set; }
    public DateOnly OutputDate { get; set; }
    public string? ColorName { get; set; }
    public string SizeName { get; set; } = string.Empty;
    public int OutputQty { get; set; }
    public string Status { get; set; } = CuttingOutputStatuses.Created;
    public CuttingPlan? CuttingPlan { get; set; }
    public CuttingLay? CuttingLay { get; set; }
}

public sealed class CuttingWastage : AuditableEntity
{
    public Guid CuttingPlanId { get; set; }
    public Guid OrderId { get; set; }
    public DateOnly WastageDate { get; set; }
    public Guid? FabricItemId { get; set; }
    public decimal WastageQty { get; set; }
    public string WastageReason { get; set; } = string.Empty;
}

public sealed class CuttingBalance
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid CompanyId { get; set; }
    public Guid OrderId { get; set; }
    public string? ColorName { get; set; }
    public string SizeName { get; set; } = string.Empty;
    public int OrderQty { get; set; }
    public int PlanQty { get; set; }
    public int CutQty { get; set; }
    public int TransferredQty { get; set; }
    public int BalanceQty { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

public sealed class CuttingPanelTransfer : AuditableEntity
{
    public Guid OrderId { get; set; }
    public Guid CuttingPlanId { get; set; }
    public string TransferNo { get; set; } = string.Empty;
    public DateOnly TransferDate { get; set; }
    public string ToDepartment { get; set; } = "Production";
    public int TotalTransferQty { get; set; }
    public string Status { get; set; } = PanelTransferStatuses.Draft;
    public DateTime? ConfirmedAt { get; set; }
    public ICollection<CuttingPanelTransferItem> Items { get; set; } = [];
}

public sealed class CuttingPanelTransferItem : AuditableEntity
{
    public Guid CuttingPanelTransferId { get; set; }
    public string? ColorName { get; set; }
    public string SizeName { get; set; } = string.Empty;
    public int TransferQty { get; set; }
    public CuttingPanelTransfer? CuttingPanelTransfer { get; set; }
}

public sealed class CuttingAuditLog
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

public sealed class CuttingBundle : AuditableEntity
{
    public Guid OrderId { get; set; }
    public Guid CuttingPlanId { get; set; }
    public Guid? CuttingLayId { get; set; }
    public Guid? CuttingOutputId { get; set; }
    public string BundleTag { get; set; } = string.Empty;
    public string? PlanNo { get; set; }
    public string? StyleName { get; set; }
    public string SizeName { get; set; } = string.Empty;
    public int PieceCount { get; set; }
    public int? SerialFrom { get; set; }
    public int? SerialTo { get; set; }
    public string? SerialRange { get; set; }
    public decimal? WeightKg { get; set; }
    public string? CurrentLocation { get; set; }
    public string Status { get; set; } = BundleStatuses.Ready;
    public CuttingPlan? CuttingPlan { get; set; }
}
