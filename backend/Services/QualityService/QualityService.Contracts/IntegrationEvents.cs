namespace QualityService.Contracts;

public abstract record IntegrationEvent
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    public abstract string EventName { get; }
}

// Published Events
public sealed record QualityInspectionApproved(
    Guid CompanyId,
    Guid OrderId,
    Guid CheckpointId,
    Guid InspectionId,
    string InspectionNo,
    int PassedQty,
    int RejectQty
) : IntegrationEvent
{
    public override string EventName => nameof(QualityInspectionApproved);
}

public sealed record QualityInspectionFailed(
    Guid CompanyId,
    Guid OrderId,
    Guid CheckpointId,
    Guid InspectionId,
    string InspectionNo,
    int DefectQty,
    int RejectQty
) : IntegrationEvent
{
    public override string EventName => nameof(QualityInspectionFailed);
}

public sealed record QualityReworkCreated(
    Guid CompanyId,
    Guid OrderId,
    Guid QualityInspectionId,
    Guid ReworkId,
    string ReworkNo,
    int ReworkQty,
    string SentToDepartment
) : IntegrationEvent
{
    public override string EventName => nameof(QualityReworkCreated);
}

public sealed record QualityReworkCompleted(
    Guid CompanyId,
    Guid OrderId,
    Guid ReworkId,
    string ReworkNo,
    int ReworkQty
) : IntegrationEvent
{
    public override string EventName => nameof(QualityReworkCompleted);
}

public sealed record QualityRejectCreated(
    Guid CompanyId,
    Guid OrderId,
    Guid QualityInspectionId,
    Guid RejectId,
    string RejectNo,
    int RejectQty
) : IntegrationEvent
{
    public override string EventName => nameof(QualityRejectCreated);
}

public sealed record FinalInspectionApproved(
    Guid CompanyId,
    Guid OrderId,
    Guid? BuyerPurchaseOrderId,
    Guid InspectionId,
    string Result,
    DateOnly InspectionDate
) : IntegrationEvent
{
    public override string EventName => nameof(FinalInspectionApproved);
}

public sealed record FinalInspectionFailed(
    Guid CompanyId,
    Guid OrderId,
    Guid? BuyerPurchaseOrderId,
    Guid InspectionId,
    string Result,
    DateOnly InspectionDate
) : IntegrationEvent
{
    public override string EventName => nameof(FinalInspectionFailed);
}

// Consumed Events
public sealed record CuttingOutputCreated(
    Guid CompanyId,
    Guid OrderId,
    Guid CuttingPlanId,
    string SizeName,
    int OutputQty
);

public sealed record SewingOutputCreated(
    Guid CompanyId,
    Guid OrderId,
    Guid ProductionOutputId,
    string ColorName,
    string SizeName,
    int Quantity
);

public sealed record FinishingQCCreated(
    Guid CompanyId,
    Guid OrderId,
    Guid FinishingBatchId,
    string ColorName,
    string SizeName,
    int PassedQty,
    int RejectQty
);

public sealed record CartonPacked(
    Guid CompanyId,
    Guid OrderId,
    Guid CartonPackingId,
    string CartonNo,
    int Quantity
);

public sealed record ShipmentPlanCreated(
    Guid CompanyId,
    Guid OrderId,
    Guid ShipmentPlanId,
    DateOnly ShipDate,
    int TotalQty
);
