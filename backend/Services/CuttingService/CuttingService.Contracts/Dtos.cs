namespace CuttingService.Contracts;

public sealed record CuttingPlanDto(Guid Id, Guid CompanyId, Guid OrderId, Guid? StyleId, string PlanNo, DateOnly PlanDate, string? ColorName, int TotalPlanQty, string Status);
public sealed record CuttingPlanSizeBreakdownDto(Guid Id, Guid CompanyId, Guid CuttingPlanId, string SizeName, int PlanQty);
public sealed record FabricIssueToCuttingDto(Guid Id, Guid CompanyId, Guid OrderId, Guid? CuttingPlanId, Guid? InventoryIssueId, string IssueNo, DateOnly IssueDate, Guid FabricItemId, decimal IssueQty, string UnitName, string? LotNo, string? BatchNo, string? ColorName, string Status);
public sealed record CuttingLaySizeDetailDto(Guid Id, Guid CompanyId, Guid CuttingLayId, string SizeName, int RatioQty, int PlyQty, int CutQty);
public sealed record CuttingLayDto(Guid Id, Guid CompanyId, Guid CuttingPlanId, string LayNo, DateOnly LayDate, string? MarkerNo, decimal FabricLength, int PlyQty, int LayQty, string Status, IReadOnlyList<CuttingLaySizeDetailDto> SizeDetails);
public sealed record CuttingOutputDto(Guid Id, Guid CompanyId, Guid CuttingPlanId, Guid? CuttingLayId, Guid OrderId, DateOnly OutputDate, string? ColorName, string SizeName, int OutputQty, string Status);
public sealed record CuttingWastageDto(Guid Id, Guid CompanyId, Guid CuttingPlanId, Guid OrderId, DateOnly WastageDate, Guid? FabricItemId, decimal WastageQty, string WastageReason);
public sealed record CuttingBalanceDto(Guid Id, Guid CompanyId, Guid OrderId, string? ColorName, string SizeName, int OrderQty, int PlanQty, int CutQty, int TransferredQty, int BalanceQty);
public sealed record CuttingPanelTransferItemDto(Guid Id, Guid CompanyId, Guid CuttingPanelTransferId, string? ColorName, string SizeName, int TransferQty);
public sealed record CuttingPanelTransferDto(Guid Id, Guid CompanyId, Guid OrderId, Guid CuttingPlanId, string TransferNo, DateOnly TransferDate, string ToDepartment, int TotalTransferQty, string Status, IReadOnlyList<CuttingPanelTransferItemDto> Items);
public sealed record CuttingReportRowDto(string ReportType, Guid CompanyId, Guid OrderId, string? PlanNo, DateOnly Date, string? ColorName, string SizeName, int Quantity, decimal WastageQty, string? Status);
public sealed record ReportExportFile(byte[] Content, string ContentType, string FileName);
public sealed record CuttingBundleDto(
    Guid Id, Guid CompanyId, Guid OrderId, Guid CuttingPlanId, Guid? CuttingLayId, Guid? CuttingOutputId,
    string BundleTag, string? PlanNo, string? StyleName, string SizeName, int PieceCount,
    int? SerialFrom, int? SerialTo, string? SerialRange, decimal? WeightKg, string? CurrentLocation, string Status);

public sealed record CuttingBundleSummaryDto(int BundleCount, int TotalPieces);
