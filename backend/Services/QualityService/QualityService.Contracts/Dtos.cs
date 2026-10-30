namespace QualityService.Contracts;

public sealed record QualityCheckpointDto(
    Guid Id,
    Guid CompanyId,
    string CheckpointCode,
    string CheckpointName,
    string CheckpointType,
    bool IsActive,
    DateTime CreatedAt
);

public sealed record DefectCategoryDto(
    Guid Id,
    Guid CompanyId,
    string CategoryCode,
    string CategoryName,
    bool IsActive
);

public sealed record DefectTypeDto(
    Guid Id,
    Guid CompanyId,
    Guid DefectCategoryId,
    string DefectCode,
    string DefectName,
    string Severity,
    bool IsActive
);

public sealed record QualityInspectionDefectDto(
    Guid Id,
    Guid CompanyId,
    Guid QualityInspectionId,
    Guid DefectTypeId,
    int DefectQty,
    string? DefectLocation,
    string? ResponsibleDepartment,
    string? Remarks
);

public sealed record QualityInspectionDto(
    Guid Id,
    Guid CompanyId,
    Guid OrderId,
    Guid? StyleId,
    Guid? BuyerPurchaseOrderId,
    Guid CheckpointId,
    string InspectionNo,
    DateOnly InspectionDate,
    string InspectionType,
    string? ColorName,
    string? SizeName,
    int InspectedQty,
    int PassedQty,
    int DefectQty,
    int ReworkQty,
    int RejectQty,
    string Result,
    string Status,
    string? Remarks,
    Guid? ApprovedBy,
    DateTime? ApprovedAt,
    IReadOnlyList<QualityInspectionDefectDto> Defects
);

public sealed record QualityReworkDto(
    Guid Id,
    Guid CompanyId,
    Guid QualityInspectionId,
    Guid OrderId,
    string ReworkNo,
    DateOnly ReworkDate,
    int ReworkQty,
    string ReworkReason,
    string SentToDepartment,
    string Status,
    DateTime CreatedAt,
    Guid? CreatedBy,
    DateTime? CompletedAt
);

public sealed record QualityRejectDto(
    Guid Id,
    Guid CompanyId,
    Guid QualityInspectionId,
    Guid OrderId,
    string RejectNo,
    DateOnly RejectDate,
    int RejectQty,
    string RejectReason,
    string Status,
    DateTime CreatedAt,
    Guid? CreatedBy
);

public sealed record AQLStandardDto(
    Guid Id,
    Guid CompanyId,
    string AQLCode,
    string AQLLevel,
    int LotSizeFrom,
    int LotSizeTo,
    int SampleSize,
    int AcceptQty,
    int RejectQty,
    bool IsActive
);

public sealed record FinalInspectionDto(
    Guid Id,
    Guid CompanyId,
    Guid OrderId,
    Guid? BuyerPurchaseOrderId,
    string InspectionNo,
    DateOnly InspectionDate,
    int LotSize,
    int SampleSize,
    Guid? AQLStandardId,
    int CriticalDefects,
    int MajorDefects,
    int MinorDefects,
    string Result,
    string Status,
    string? Remarks,
    Guid? ApprovedBy,
    DateTime? ApprovedAt
);

public sealed record QualityReportRowDto(
    string ReportType,
    Guid CompanyId,
    Guid OrderId,
    string? ReferenceNo,
    DateOnly Date,
    string? ColorName,
    string? SizeName,
    int InspectedQty,
    int PassedQty,
    int DefectQty,
    int ReworkQty,
    int RejectQty,
    string? Result,
    string? Details
);

public sealed record ReportExportFile(
    byte[] Content,
    string ContentType,
    string FileName
);
