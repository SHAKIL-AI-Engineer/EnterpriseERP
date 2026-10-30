namespace FinishingService.Contracts;

public sealed record FinishingReceiveItemDto(
    Guid Id,
    Guid CompanyId,
    Guid FinishingReceiveId,
    Guid OrderId,
    Guid? BuyerPurchaseOrderId,
    string? ColorName,
    string SizeName,
    int ReceiveQty
);

public sealed record FinishingReceiveDto(
    Guid Id,
    Guid CompanyId,
    Guid OrderId,
    Guid? StyleId,
    Guid? ProductionOutputId,
    string ReceiveNo,
    DateOnly ReceiveDate,
    string FromDepartment,
    int TotalReceiveQty,
    string Status,
    DateTime CreatedAt,
    Guid? CreatedBy,
    DateTime? ConfirmedAt,
    Guid? ConfirmedBy,
    IReadOnlyList<FinishingReceiveItemDto> Items
);

public sealed record FinishingInputDto(
    Guid Id,
    Guid CompanyId,
    Guid FinishingBatchId,
    Guid OrderId,
    DateOnly InputDate,
    string? ColorName,
    string SizeName,
    int InputQty,
    DateTime CreatedAt,
    Guid? CreatedBy
);

public sealed record IroningOutputDto(
    Guid Id,
    Guid CompanyId,
    Guid FinishingBatchId,
    Guid OrderId,
    DateOnly OutputDate,
    string? ColorName,
    string SizeName,
    int IronQty,
    int ReIronQty,
    DateTime CreatedAt,
    Guid? CreatedBy
);

public sealed record FinishingDefectDto(
    Guid Id,
    Guid CompanyId,
    Guid FinishingQCId,
    string DefectType,
    int DefectQty,
    string? Remarks
);

public sealed record FinishingQCDto(
    Guid Id,
    Guid CompanyId,
    Guid FinishingBatchId,
    Guid OrderId,
    DateOnly QCDate,
    string? ColorName,
    string SizeName,
    int CheckedQty,
    int PassedQty,
    int AlterQty,
    int RejectQty,
    int DefectQty,
    DateTime CreatedAt,
    Guid? CreatedBy,
    IReadOnlyList<FinishingDefectDto> Defects
);

public sealed record FoldingPackingDto(
    Guid Id,
    Guid CompanyId,
    Guid FinishingBatchId,
    Guid OrderId,
    DateOnly PackingDate,
    string? ColorName,
    string SizeName,
    int FoldingQty,
    int TaggingQty,
    int PolyQty,
    DateTime CreatedAt,
    Guid? CreatedBy
);

public sealed record FinishingBatchDto(
    Guid Id,
    Guid CompanyId,
    Guid OrderId,
    Guid? StyleId,
    string BatchNo,
    DateOnly BatchDate,
    int TotalInputQty,
    string Status,
    DateTime CreatedAt,
    Guid? CreatedBy,
    DateTime? StartedAt,
    DateTime? CompletedAt,
    IReadOnlyList<FinishingInputDto> Inputs,
    IReadOnlyList<IroningOutputDto> Ironings,
    IReadOnlyList<FinishingQCDto> QCs,
    IReadOnlyList<FoldingPackingDto> Foldings
);

public sealed record CartonPackingItemDto(
    Guid Id,
    Guid CompanyId,
    Guid CartonPackingId,
    Guid OrderId,
    Guid? BuyerPurchaseOrderId,
    string? ColorName,
    string SizeName,
    int Quantity
);

public sealed record CartonPackingDto(
    Guid Id,
    Guid CompanyId,
    Guid OrderId,
    Guid? BuyerPurchaseOrderId,
    string CartonNo,
    DateOnly PackingDate,
    string? CartonType,
    decimal GrossWeight,
    decimal NetWeight,
    decimal CBM,
    string Status,
    DateTime CreatedAt,
    Guid? CreatedBy,
    DateTime? ClosedAt,
    IReadOnlyList<CartonPackingItemDto> Items
);

public sealed record FinishedGoodsTransferItemDto(
    Guid Id,
    Guid CompanyId,
    Guid FinishedGoodsTransferId,
    Guid? CartonPackingId,
    Guid OrderId,
    Guid? BuyerPurchaseOrderId,
    string? ColorName,
    string SizeName,
    int TransferQty
);

public sealed record FinishedGoodsTransferDto(
    Guid Id,
    Guid CompanyId,
    Guid OrderId,
    string TransferNo,
    DateOnly TransferDate,
    Guid? ToWarehouseId,
    string ToDepartment,
    int TotalTransferQty,
    string Status,
    DateTime CreatedAt,
    Guid? CreatedBy,
    DateTime? ConfirmedAt,
    Guid? ConfirmedBy,
    IReadOnlyList<FinishedGoodsTransferItemDto> Items
);

public sealed record FinishingWastageDto(
    Guid Id,
    Guid CompanyId,
    Guid OrderId,
    Guid? FinishingBatchId,
    DateOnly WastageDate,
    string? ColorName,
    string? SizeName,
    int WastageQty,
    string WastageReason,
    DateTime CreatedAt,
    Guid? CreatedBy
);

public sealed record FinishingBalanceDto(
    Guid Id,
    Guid CompanyId,
    Guid OrderId,
    Guid? BuyerPurchaseOrderId,
    string? ColorName,
    string SizeName,
    int SewingOutputQty,
    int FinishingReceiveQty,
    int FinishingInputQty,
    int IronQty,
    int QCPassQty,
    int AlterQty,
    int RejectQty,
    int FoldingQty,
    int PolyQty,
    int CartonQty,
    int TransferQty,
    int BalanceQty,
    DateTime? UpdatedAt
);

public sealed record FinishingReportRowDto(
    string ReportType,
    Guid CompanyId,
    Guid OrderId,
    string? ReferenceNo,
    DateOnly Date,
    string? ColorName,
    string? SizeName,
    int Quantity,
    int WastageQty,
    string? Status
);

public sealed record ReportExportFile(
    byte[] Content,
    string ContentType,
    string FileName
);
