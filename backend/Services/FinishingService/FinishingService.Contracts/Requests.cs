namespace FinishingService.Contracts;

public sealed record FinishingReceiveItemRequest(
    Guid OrderId,
    Guid? BuyerPurchaseOrderId,
    string? ColorName,
    string SizeName,
    int ReceiveQty
);

public sealed record CreateFinishingReceiveRequest(
    Guid CompanyId,
    Guid OrderId,
    Guid? StyleId,
    Guid? ProductionOutputId,
    string ReceiveNo,
    DateOnly ReceiveDate,
    string FromDepartment,
    IReadOnlyList<FinishingReceiveItemRequest> Items,
    Guid? CreatedBy
);

public sealed record UpdateFinishingReceiveRequest(
    Guid? StyleId,
    DateOnly ReceiveDate,
    string FromDepartment,
    Guid? UpdatedBy
);

public sealed record CreateFinishingBatchRequest(
    Guid CompanyId,
    Guid OrderId,
    Guid? StyleId,
    string BatchNo,
    DateOnly BatchDate,
    int TotalInputQty,
    Guid? CreatedBy
);

public sealed record CreateFinishingInputRequest(
    Guid CompanyId,
    Guid FinishingBatchId,
    Guid OrderId,
    DateOnly InputDate,
    string? ColorName,
    string SizeName,
    int InputQty,
    Guid? CreatedBy
);

public sealed record CreateIroningOutputRequest(
    Guid CompanyId,
    Guid FinishingBatchId,
    Guid OrderId,
    DateOnly OutputDate,
    string? ColorName,
    string SizeName,
    int IronQty,
    int ReIronQty,
    Guid? CreatedBy
);

public sealed record FinishingDefectRequest(
    string DefectType,
    int DefectQty,
    string? Remarks
);

public sealed record CreateFinishingQCRequest(
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
    IReadOnlyList<FinishingDefectRequest> Defects,
    Guid? CreatedBy
);

public sealed record CreateFoldingPackingRequest(
    Guid CompanyId,
    Guid FinishingBatchId,
    Guid OrderId,
    DateOnly PackingDate,
    string? ColorName,
    string SizeName,
    int FoldingQty,
    int TaggingQty,
    int PolyQty,
    Guid? CreatedBy
);

public sealed record CartonPackingItemRequest(
    Guid OrderId,
    Guid? BuyerPurchaseOrderId,
    string? ColorName,
    string SizeName,
    int Quantity
);

public sealed record CreateCartonPackingRequest(
    Guid CompanyId,
    Guid OrderId,
    Guid? BuyerPurchaseOrderId,
    string CartonNo,
    DateOnly PackingDate,
    string? CartonType,
    decimal GrossWeight,
    decimal NetWeight,
    decimal CBM,
    IReadOnlyList<CartonPackingItemRequest> Items,
    Guid? CreatedBy
);

public sealed record FinishedGoodsTransferItemRequest(
    Guid? CartonPackingId,
    Guid OrderId,
    Guid? BuyerPurchaseOrderId,
    string? ColorName,
    string SizeName,
    int TransferQty
);

public sealed record CreateFinishedGoodsTransferRequest(
    Guid CompanyId,
    Guid OrderId,
    string TransferNo,
    DateOnly TransferDate,
    Guid? ToWarehouseId,
    string ToDepartment,
    IReadOnlyList<FinishedGoodsTransferItemRequest> Items,
    Guid? CreatedBy
);

public sealed record CreateFinishingWastageRequest(
    Guid CompanyId,
    Guid OrderId,
    Guid? FinishingBatchId,
    DateOnly WastageDate,
    string? ColorName,
    string? SizeName,
    int WastageQty,
    string WastageReason,
    Guid? CreatedBy
);

public sealed record FinishingReportExportRequest(
    Guid CompanyId,
    string ReportType,
    string Format,
    DateOnly? FromDate,
    DateOnly? ToDate,
    Guid? OrderId,
    Guid? RequestedBy
);
