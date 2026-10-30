namespace ProductionPlanningService.Contracts;

public sealed record CreateSewingLineRequest(Guid CompanyId, int SerialNo, string LineName, string? Status = null);
public sealed record UpdateSewingLineRequest(int SerialNo, string LineName, string Status);

public sealed record CreateProductionAssignmentRequest(
    Guid CompanyId, Guid OrderId, Guid SewingLineId, int TotalTarget, DateOnly AssignDate,
    string? StyleNo, string? BuyerName, string? Status = null);
public sealed record UpdateProductionAssignmentRequest(
    Guid SewingLineId, int TotalTarget, DateOnly AssignDate, string? StyleNo, string? BuyerName, string Status);

public sealed record SaveProductionTargetRequest(
    Guid CompanyId, Guid AssignmentId, DateOnly TargetDate, int DailyTarget, int HourlyTarget, string? Remarks);

public sealed record SaveDailyProductionRecordRequest(
    Guid CompanyId, Guid AssignmentId, DateOnly RecordDate, int DailyTarget, int HourlyTarget,
    int H1, int H2, int H3, int H4, int H5, int H6, int H7, int H8, int H9, int H10,
    int H11, int H12, int H13, int H14, int H15, int H16, int H17, int H18, int H19);

public sealed record CreateSewingOutputRequest(
    Guid CompanyId, Guid OrderId, Guid? AssignmentId, DateOnly OutputDate,
    string? ColorName, string SizeName, int OutputQty, bool ApproveOverage = false);

public sealed record ReceivePanelTransferRequest(Guid CompanyId, Guid OrderId, Guid TransferId, DateOnly? ReceiptDate, int TotalQty);

public sealed record PanelTransferReceiveLegacyRequest(Guid CompanyId, Guid OrderId, Guid TransferId);
