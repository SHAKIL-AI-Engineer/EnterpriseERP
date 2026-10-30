namespace ProductionPlanningService.Contracts;

public abstract record IntegrationEvent(string EventName, Guid CompanyId)
{
    public Guid EventId { get; init; } = Guid.NewGuid();
    public DateTime OccurredAtUtc { get; init; } = DateTime.UtcNow;
}

public sealed record SewingOutputCreated(
    Guid CompanyId, Guid OrderId, Guid ProductionOutputId, string? ColorName, string SizeName, int OutputQty, DateOnly OutputDate)
    : IntegrationEvent(nameof(SewingOutputCreated), CompanyId);

public sealed record ProductionOutputCreated(
    Guid CompanyId, Guid OrderId, Guid ProductionOutputId, string? ColorName, string SizeName, int OutputQty, DateOnly OutputDate)
    : IntegrationEvent(nameof(ProductionOutputCreated), CompanyId);

public sealed record ProductionAssignmentCreated(
    Guid CompanyId, Guid OrderId, Guid AssignmentId, Guid SewingLineId, int TotalTarget, DateOnly AssignDate)
    : IntegrationEvent(nameof(ProductionAssignmentCreated), CompanyId);

public sealed record PanelTransferReceived(
    Guid CompanyId, Guid OrderId, Guid CuttingTransferId, int TotalQty, DateOnly ReceiptDate)
    : IntegrationEvent(nameof(PanelTransferReceived), CompanyId);

public sealed record CuttingPanelTransferred(
    Guid CompanyId, Guid OrderId, Guid TransferId, string TransferNo, int TotalTransferQty, DateOnly TransferDate);
