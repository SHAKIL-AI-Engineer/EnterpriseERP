namespace CuttingService.Contracts;

public abstract record IntegrationEvent(string EventName, Guid CompanyId)
{
    public Guid EventId { get; init; } = Guid.NewGuid();
    public DateTime OccurredAtUtc { get; init; } = DateTime.UtcNow;
}

public sealed record CuttingPlanApproved(Guid CompanyId, Guid OrderId, Guid CuttingPlanId, string PlanNo) : IntegrationEvent(nameof(CuttingPlanApproved), CompanyId);
public sealed record CuttingStarted(Guid CompanyId, Guid OrderId, Guid CuttingPlanId, DateOnly StartDate) : IntegrationEvent(nameof(CuttingStarted), CompanyId);
public sealed record CuttingOutputCreated(Guid CompanyId, Guid OrderId, Guid CuttingPlanId, string? ColorName, string SizeName, int OutputQty, DateOnly OutputDate) : IntegrationEvent(nameof(CuttingOutputCreated), CompanyId);
public sealed record CuttingCompleted(Guid CompanyId, Guid OrderId, Guid CuttingPlanId, DateTime CompletedAt) : IntegrationEvent(nameof(CuttingCompleted), CompanyId);
public sealed record CuttingPanelTransferred(Guid CompanyId, Guid OrderId, Guid TransferId, string TransferNo, int TotalTransferQty, DateOnly TransferDate) : IntegrationEvent(nameof(CuttingPanelTransferred), CompanyId);
public sealed record CuttingWastageCreated(Guid CompanyId, Guid OrderId, Guid CuttingPlanId, decimal WastageQty, string WastageReason) : IntegrationEvent(nameof(CuttingWastageCreated), CompanyId);
