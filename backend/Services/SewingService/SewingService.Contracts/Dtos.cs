namespace SewingService.Contracts;

public sealed record SewingLineDto(Guid Id, Guid CompanyId, int SerialNo, string LineName, string Status);
public sealed record ProductionAssignmentDto(
    Guid Id, Guid CompanyId, Guid OrderId, Guid SewingLineId, string? StyleNo, string? BuyerName,
    int TotalTarget, DateOnly AssignDate, string Status, string? LineName);
public sealed record ProductionTargetDto(
    Guid Id, Guid CompanyId, Guid AssignmentId, DateOnly TargetDate, int DailyTarget, int HourlyTarget, string? Remarks);
public sealed record DailyProductionRecordDto(
    Guid Id, Guid CompanyId, Guid AssignmentId, DateOnly RecordDate, int DailyTarget, int HourlyTarget,
    int H1, int H2, int H3, int H4, int H5, int H6, int H7, int H8, int H9, int H10,
    int H11, int H12, int H13, int H14, int H15, int H16, int H17, int H18, int H19,
    int TotalCompleted);
public sealed record SewingOutputDto(
    Guid Id, Guid CompanyId, Guid OrderId, Guid? AssignmentId, string OutputNo, DateOnly OutputDate,
    string? ColorName, string SizeName, int OutputQty, string Status);
public sealed record PanelTransferReceiptDto(
    Guid Id, Guid CompanyId, Guid OrderId, Guid CuttingTransferId, string ReceiptNo, DateOnly ReceiptDate, int TotalQty, string Status);
public sealed record SewingBalanceDto(
    Guid Id, Guid CompanyId, Guid OrderId, string? ColorName, string SizeName,
    int PanelReceivedQty, int SewnOutputQty, int WipQty);
public sealed record SewingOutputSnapshotDto(
    Guid ProductionOutputId, Guid CompanyId, Guid OrderId, string? ColorName, string SizeName, int OutputQty);
public sealed record DailyReportRowDto(
    Guid AssignmentId, string LineName, string? StyleNo, string? BuyerName,
    int DailyTarget, int HourlyTarget, int Completed, decimal Achievement);
public sealed record MonthlyReportRowDto(
    string Month, int Year, string LineName, int TotalTarget, int TotalCompleted,
    decimal AvgAchievement, int WorkingDays, string? TopStyle);
