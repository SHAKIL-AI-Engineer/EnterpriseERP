namespace Erp.BuildingBlocks.EventBus;

/// <summary>
/// Base type for messages published to the integration bus (outbox → broker).
/// </summary>
public abstract record IntegrationEvent
{
    public Guid EventId { get; init; } = Guid.NewGuid();

    public DateTimeOffset OccurredOn { get; init; } = DateTimeOffset.UtcNow;

    public string EventType { get; init; } = string.Empty;
}
