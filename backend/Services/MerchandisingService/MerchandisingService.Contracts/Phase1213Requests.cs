namespace MerchandisingService.Contracts;

public sealed record CreateStyleDocumentRequest(Guid CompanyId, Guid StyleId, string DocumentType, string FileName, string FileUrl, string? Version, string? Remarks);
public sealed record CreateOrderDocumentRequest(Guid CompanyId, Guid OrderId, string DocumentType, string FileName, string FileUrl, string? Version, string? Remarks);
public sealed record CreateCommunicationLogRequest(Guid CompanyId, Guid? StyleId, Guid? OrderId, string Direction, string Subject, string Message, string? ContactName);
public sealed record CreateApprovalRequestRequest(Guid CompanyId, string EntityType, Guid EntityId, string RequestType, string RequestedBy, IReadOnlyList<CreateApprovalStepRequest> Steps);
public sealed record CreateApprovalStepRequest(int ApprovalLevel, Guid? ApproverUserId);
public sealed record ApproveStepRequest(Guid ApproverUserId, string? Remarks);
public sealed record RejectStepRequest(Guid ApproverUserId, string? Remarks);

public sealed record CreateShipmentExecutionRequest(Guid CompanyId, Guid ShipmentPlanId, DateOnly? ActualShipmentDate, int ShippedQty, string? Status);
public sealed record CreatePackingListRequest(Guid CompanyId, Guid ShipmentExecutionId, int CartonCount, decimal GrossWeightKg, decimal NetWeightKg, string? Remarks, IReadOnlyList<CreateCartonBreakdownRequest>? Cartons);
public sealed record CreateCartonBreakdownRequest(int CartonNo, string ColorName, string SizeName, int Quantity);
