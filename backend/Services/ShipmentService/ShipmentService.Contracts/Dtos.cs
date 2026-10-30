namespace ShipmentService.Contracts;

public sealed record ShipmentReadinessDto(Guid Id, Guid CompanyId, Guid OrderId, Guid? FinishedGoodsTransferId, int ReadyQty, DateOnly ReadyDate, string Status);
public sealed record ShipmentExecutionDto(Guid Id, Guid CompanyId, Guid OrderId, Guid? MerchandisingShipmentPlanId, DateOnly? ActualShipmentDate, int ShippedQty, string Status, string? Destination);
public sealed record ShipmentPlanSnapshotDto(Guid OrderId, Guid CompanyId, DateOnly ShipmentDate, int PlanQty);
public sealed record ShipmentReportRowDto(string ReportType, Guid OrderId, int Quantity, string Status, DateOnly? Date);
public sealed record FinishedGoodsReadyRequest(Guid CompanyId, Guid OrderId, Guid TransferId, int? ReadyQty);
public sealed record NotifyInspectionPassedRequest(Guid CompanyId, Guid OrderId);
public sealed record CreateShipmentExecutionRequest(Guid CompanyId, Guid OrderId, Guid? MerchandisingShipmentPlanId, DateOnly? ActualShipmentDate, int ShippedQty, string? Destination);
