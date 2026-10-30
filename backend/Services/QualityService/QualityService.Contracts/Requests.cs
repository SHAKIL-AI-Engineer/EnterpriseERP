namespace QualityService.Contracts;

public sealed record CreateQualityCheckpointRequest(
    Guid CompanyId,
    string CheckpointCode,
    string CheckpointName,
    string CheckpointType,
    Guid? CreatedBy
);

public sealed record UpdateQualityCheckpointRequest(
    string CheckpointName,
    string CheckpointType,
    Guid? UpdatedBy
);

public sealed record CreateDefectCategoryRequest(
    Guid CompanyId,
    string CategoryCode,
    string CategoryName,
    Guid? CreatedBy
);

public sealed record CreateDefectTypeRequest(
    Guid CompanyId,
    Guid DefectCategoryId,
    string DefectCode,
    string DefectName,
    string Severity,
    Guid? CreatedBy
);

public sealed record UpdateDefectTypeRequest(
    string DefectName,
    string Severity,
    Guid? UpdatedBy
);

public sealed record QualityInspectionDefectRequest(
    Guid DefectTypeId,
    int DefectQty,
    string? DefectLocation,
    string? ResponsibleDepartment,
    string? Remarks
);

public sealed record CreateQualityInspectionRequest(
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
    string? Remarks,
    IReadOnlyList<QualityInspectionDefectRequest> Defects,
    Guid? CreatedBy
);

public sealed record UpdateQualityInspectionRequest(
    DateOnly InspectionDate,
    int InspectedQty,
    int PassedQty,
    int DefectQty,
    int ReworkQty,
    int RejectQty,
    string? Remarks,
    IReadOnlyList<QualityInspectionDefectRequest> Defects,
    Guid? UpdatedBy
);

public sealed record CreateQualityReworkRequest(
    Guid CompanyId,
    Guid QualityInspectionId,
    Guid OrderId,
    string ReworkNo,
    DateOnly ReworkDate,
    int ReworkQty,
    string ReworkReason,
    string SentToDepartment,
    Guid? CreatedBy
);

public sealed record CreateQualityRejectRequest(
    Guid CompanyId,
    Guid QualityInspectionId,
    Guid OrderId,
    string RejectNo,
    DateOnly RejectDate,
    int RejectQty,
    string RejectReason,
    Guid? CreatedBy
);

public sealed record CreateAQLStandardRequest(
    Guid CompanyId,
    string AQLCode,
    string AQLLevel,
    int LotSizeFrom,
    int LotSizeTo,
    int SampleSize,
    int AcceptQty,
    int RejectQty,
    Guid? CreatedBy
);

public sealed record CreateFinalInspectionRequest(
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
    string? Remarks,
    Guid? CreatedBy
);

public sealed record QualityReportExportRequest(
    Guid CompanyId,
    string ReportType,
    string Format,
    DateOnly? FromDate,
    DateOnly? ToDate,
    Guid? OrderId,
    Guid? RequestedBy
);
