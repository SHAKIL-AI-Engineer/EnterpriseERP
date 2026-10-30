using Erp.BuildingBlocks.SharedKernel;

namespace QualityService.Domain;

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

public sealed class QualityCheckpoint : AuditableEntity
{
    public string CheckpointCode { get; set; } = string.Empty;
    public string CheckpointName { get; set; } = string.Empty;
    public string CheckpointType { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
}

public sealed class DefectCategory : AuditableEntity
{
    public string CategoryCode { get; set; } = string.Empty;
    public string CategoryName { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
    public ICollection<DefectType> DefectTypes { get; set; } = [];
}

public sealed class DefectType : AuditableEntity
{
    public Guid DefectCategoryId { get; set; }
    public string DefectCode { get; set; } = string.Empty;
    public string DefectName { get; set; } = string.Empty;
    public string Severity { get; set; } = DefectSeverities.Major;
    public bool IsActive { get; set; } = true;
    public DefectCategory? DefectCategory { get; set; }
}

public sealed class QualityInspection : AuditableEntity
{
    public Guid OrderId { get; set; }
    public Guid? StyleId { get; set; }
    public Guid? BuyerPurchaseOrderId { get; set; }
    public Guid CheckpointId { get; set; }
    public string InspectionNo { get; set; } = string.Empty;
    public DateOnly InspectionDate { get; set; }
    public string InspectionType { get; set; } = string.Empty;
    public string? ColorName { get; set; }
    public string? SizeName { get; set; }
    public int InspectedQty { get; set; }
    public int PassedQty { get; set; }
    public int DefectQty { get; set; }
    public int ReworkQty { get; set; }
    public int RejectQty { get; set; }
    public string Result { get; set; } = QualityInspectionResults.Pending;
    public string Status { get; set; } = QualityInspectionStatuses.Draft;
    public string? Remarks { get; set; }
    public Guid? ApprovedBy { get; set; }
    public DateTime? ApprovedAt { get; set; }
    public QualityCheckpoint? Checkpoint { get; set; }
    public ICollection<QualityInspectionDefect> Defects { get; set; } = [];
}

public sealed class QualityInspectionDefect : AuditableEntity
{
    public Guid QualityInspectionId { get; set; }
    public Guid DefectTypeId { get; set; }
    public int DefectQty { get; set; }
    public string? DefectLocation { get; set; }
    public string? ResponsibleDepartment { get; set; }
    public string? Remarks { get; set; }
    public QualityInspection? QualityInspection { get; set; }
    public DefectType? DefectType { get; set; }
}

public sealed class QualityRework : AuditableEntity
{
    public Guid QualityInspectionId { get; set; }
    public Guid OrderId { get; set; }
    public string ReworkNo { get; set; } = string.Empty;
    public DateOnly ReworkDate { get; set; }
    public int ReworkQty { get; set; }
    public string ReworkReason { get; set; } = string.Empty;
    public string SentToDepartment { get; set; } = string.Empty;
    public string Status { get; set; } = QualityReworkStatuses.Pending;
    public DateTime? CompletedAt { get; set; }
}

public sealed class QualityReject : AuditableEntity
{
    public Guid QualityInspectionId { get; set; }
    public Guid OrderId { get; set; }
    public string RejectNo { get; set; } = string.Empty;
    public DateOnly RejectDate { get; set; }
    public int RejectQty { get; set; }
    public string RejectReason { get; set; } = string.Empty;
    public string Status { get; set; } = QualityRejectStatuses.Created;
}

public sealed class AQLStandard : AuditableEntity
{
    public string AQLCode { get; set; } = string.Empty;
    public string AQLLevel { get; set; } = string.Empty;
    public int LotSizeFrom { get; set; }
    public int LotSizeTo { get; set; }
    public int SampleSize { get; set; }
    public int AcceptQty { get; set; }
    public int RejectQty { get; set; }
    public bool IsActive { get; set; } = true;
}

public sealed class FinalInspection : AuditableEntity
{
    public Guid OrderId { get; set; }
    public Guid? BuyerPurchaseOrderId { get; set; }
    public string InspectionNo { get; set; } = string.Empty;
    public DateOnly InspectionDate { get; set; }
    public int LotSize { get; set; }
    public int SampleSize { get; set; }
    public Guid? AQLStandardId { get; set; }
    public int CriticalDefects { get; set; }
    public int MajorDefects { get; set; }
    public int MinorDefects { get; set; }
    public string Result { get; set; } = QualityInspectionResults.Pending;
    public string Status { get; set; } = QualityInspectionStatuses.Draft;
    public string? Remarks { get; set; }
    public Guid? ApprovedBy { get; set; }
    public DateTime? ApprovedAt { get; set; }
    public AQLStandard? AQLStandard { get; set; }
}

public sealed class QualityAuditLog
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid CompanyId { get; set; }
    public string ReferenceType { get; set; } = string.Empty;
    public Guid ReferenceId { get; set; }
    public string ActionName { get; set; } = string.Empty;
    public string? OldValue { get; set; }
    public string? NewValue { get; set; }
    public Guid? ActionBy { get; set; }
    public DateTime ActionAt { get; set; } = BusinessTime.Now;
}
