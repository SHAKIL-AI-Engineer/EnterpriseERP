namespace SecurityService.Contracts;

public sealed record IntegrationEvent(string EventName, Guid CompanyId, Guid EntityId, DateTime OccurredAt, object Payload);

public sealed record BillEntrySentToAccountsPayload(
    string EventName,
    Guid CompanyId,
    Guid BillEntryId,
    string BillNo,
    Guid? SupplierId,
    decimal Amount,
    decimal TotalAmount,
    DateOnly BillDate);
