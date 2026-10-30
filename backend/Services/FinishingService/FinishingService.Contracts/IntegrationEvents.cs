namespace FinishingService.Contracts;

public abstract record IntegrationEvent(string EventName, Guid CompanyId)
{
    public Guid EventId { get; init; } = Guid.NewGuid();
    public DateTime OccurredAtUtc { get; init; } = DateTime.UtcNow;
}

public sealed record FinishingReceiveConfirmed(
    Guid CompanyId,
    Guid OrderId,
    Guid ReceiveId,
    string ReceiveNo,
    int TotalReceiveQty,
    DateOnly ReceiveDate
) : IntegrationEvent(nameof(FinishingReceiveConfirmed), CompanyId);

public sealed record FinishingInputCreated(
    Guid CompanyId,
    Guid OrderId,
    Guid BatchId,
    string? ColorName,
    string SizeName,
    int InputQty,
    DateOnly InputDate
) : IntegrationEvent(nameof(FinishingInputCreated), CompanyId);

public sealed record IroningOutputCreated(
    Guid CompanyId,
    Guid OrderId,
    Guid BatchId,
    string? ColorName,
    string SizeName,
    int IronQty,
    DateOnly OutputDate
) : IntegrationEvent(nameof(IroningOutputCreated), CompanyId);

public sealed record FinishingQCCreated(
    Guid CompanyId,
    Guid OrderId,
    Guid BatchId,
    string? ColorName,
    string SizeName,
    int PassedQty,
    int AlterQty,
    int RejectQty,
    DateOnly QCDate
) : IntegrationEvent(nameof(FinishingQCCreated), CompanyId);

public sealed record CartonPacked(
    Guid CompanyId,
    Guid OrderId,
    Guid CartonId,
    string CartonNo,
    int Quantity,
    DateOnly PackingDate
) : IntegrationEvent(nameof(CartonPacked), CompanyId);

public sealed record FinishedGoodsTransferred(
    Guid CompanyId,
    Guid OrderId,
    Guid TransferId,
    string TransferNo,
    int TotalTransferQty,
    DateOnly TransferDate
) : IntegrationEvent(nameof(FinishedGoodsTransferred), CompanyId);

public sealed record FinishingCompleted(
    Guid CompanyId,
    Guid OrderId,
    Guid BatchId,
    DateTime CompletedAt
) : IntegrationEvent(nameof(FinishingCompleted), CompanyId);

public sealed record FinishingWastageCreated(
    Guid CompanyId,
    Guid OrderId,
    Guid? BatchId,
    int WastageQty,
    string WastageReason,
    DateOnly WastageDate
) : IntegrationEvent(nameof(FinishingWastageCreated), CompanyId);

// External Consumed Events
public sealed record SewingOutputCreated(
    Guid CompanyId,
    Guid OrderId,
    Guid ProductionOutputId,
    string? ColorName,
    string SizeName,
    int OutputQty,
    DateOnly OutputDate
);

public sealed record ProductionOutputCreated(
    Guid CompanyId,
    Guid OrderId,
    Guid ProductionOutputId,
    string? ColorName,
    string SizeName,
    int OutputQty,
    DateOnly OutputDate
);

public sealed record CuttingPanelTransferred(
    Guid CompanyId,
    Guid OrderId,
    Guid TransferId,
    string TransferNo,
    int TotalTransferQty,
    DateOnly TransferDate
);

public sealed record ShipmentPlanCreated(
    Guid CompanyId,
    Guid OrderId,
    DateOnly ShipmentDate,
    int PlanQty
);

public sealed record FinishedGoodsShipped(
    Guid CompanyId,
    Guid OrderId,
    Guid ShipmentId,
    int ShippedQty
);
