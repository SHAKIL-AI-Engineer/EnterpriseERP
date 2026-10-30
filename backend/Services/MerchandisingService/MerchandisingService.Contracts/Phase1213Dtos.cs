namespace MerchandisingService.Contracts;

public sealed record StyleDocumentDto(Guid Id, Guid CompanyId, Guid StyleId, string DocumentType, string FileName, string FileUrl, string? Version, string? Remarks);
public sealed record OrderDocumentDto(Guid Id, Guid CompanyId, Guid OrderId, string DocumentType, string FileName, string FileUrl, string? Version, string? Remarks);
public sealed record CommunicationLogDto(Guid Id, Guid CompanyId, Guid? StyleId, Guid? OrderId, string Direction, string Subject, string Message, string? ContactName, DateTime LoggedAt);
public sealed record ApprovalStepDto(Guid Id, Guid CompanyId, Guid ApprovalRequestId, int ApprovalLevel, Guid? ApproverUserId, string Status, string? Remarks, DateTime? ActionAt);
public sealed record ApprovalRequestDto(Guid Id, Guid CompanyId, string EntityType, Guid EntityId, string RequestType, string Status, string RequestedBy, DateTime RequestedAt, IReadOnlyList<ApprovalStepDto>? Steps = null);

public sealed record ShipmentExecutionDto(Guid Id, Guid CompanyId, Guid ShipmentPlanId, DateOnly? ActualShipmentDate, int ShippedQty, string Status);
public sealed record PackingListDto(Guid Id, Guid CompanyId, Guid ShipmentExecutionId, int CartonCount, decimal GrossWeightKg, decimal NetWeightKg, string? Remarks, IReadOnlyList<CartonBreakdownDto>? CartonBreakdowns = null);
public sealed record CartonBreakdownDto(Guid Id, Guid CompanyId, Guid PackingListId, int CartonNo, string ColorName, string SizeName, int Quantity);

public sealed record TnaDelayReportRowDto(Guid OrderId, string OrderNo, Guid MilestoneId, string MilestoneName, DateOnly PlannedDate, DateOnly? ActualDate, int DelayDays, string Status);
public sealed record BookingStatusReportRowDto(Guid OrderId, string OrderNo, Guid BookingId, string BookingNo, string BookingType, string Status, decimal TotalQty, decimal BookedQty);
public sealed record OrderPipelineReportRowDto(string OrderStatus, int OrderCount, int TotalQuantity, decimal TotalValue);
