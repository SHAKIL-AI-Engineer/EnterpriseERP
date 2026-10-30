using Erp.BuildingBlocks.SharedKernel;

namespace MerchandisingService.Domain;

public static class DocumentTypes
{
    public static readonly string[] Values = ["TechPack", "SpecSheet", "MeasurementChart", "Artwork", "Other"];
}

public static class CommunicationDirections
{
    public static readonly string[] Values = ["Inbound", "Outbound", "Internal"];
}

public static class ApprovalRequestStatuses
{
    public const string Pending = "Pending";
    public const string Approved = "Approved";
    public const string Rejected = "Rejected";
    public const string Cancelled = "Cancelled";
}

public static class ApprovalStepStatuses
{
    public const string Pending = "Pending";
    public const string Approved = "Approved";
    public const string Rejected = "Rejected";
    public const string Skipped = "Skipped";
}

public static class ShipmentExecutionStatuses
{
    public const string Planned = "Planned";
    public const string InProgress = "InProgress";
    public const string Completed = "Completed";
    public const string Cancelled = "Cancelled";
}

public sealed class StyleDocument : AuditableEntity
{
    public Guid StyleId { get; set; }
    public string DocumentType { get; set; } = DocumentTypes.Values[0];
    public string FileName { get; set; } = string.Empty;
    public string FileUrl { get; set; } = string.Empty;
    public string? Version { get; set; }
    public string? Remarks { get; set; }
    public Style? Style { get; set; }
}

public sealed class OrderDocument : AuditableEntity
{
    public Guid OrderId { get; set; }
    public string DocumentType { get; set; } = DocumentTypes.Values[0];
    public string FileName { get; set; } = string.Empty;
    public string FileUrl { get; set; } = string.Empty;
    public string? Version { get; set; }
    public string? Remarks { get; set; }
    public Order? Order { get; set; }
}

public sealed class CommunicationLog : AuditableEntity
{
    public Guid? StyleId { get; set; }
    public Guid? OrderId { get; set; }
    public string Direction { get; set; } = CommunicationDirections.Values[0];
    public string Subject { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string? ContactName { get; set; }
    public DateTime LoggedAt { get; set; } = BusinessTime.Now;
    public Style? Style { get; set; }
    public Order? Order { get; set; }
}

public sealed class ApprovalRequest : AuditableEntity
{
    public string EntityType { get; set; } = string.Empty;
    public Guid EntityId { get; set; }
    public string RequestType { get; set; } = string.Empty;
    public string Status { get; set; } = ApprovalRequestStatuses.Pending;
    public string RequestedBy { get; set; } = string.Empty;
    public DateTime RequestedAt { get; set; } = BusinessTime.Now;
    public ICollection<ApprovalStep> Steps { get; set; } = [];
}

public sealed class ApprovalStep
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid CompanyId { get; set; }
    public Guid ApprovalRequestId { get; set; }
    public int ApprovalLevel { get; set; }
    public Guid? ApproverUserId { get; set; }
    public string Status { get; set; } = ApprovalStepStatuses.Pending;
    public string? Remarks { get; set; }
    public DateTime? ActionAt { get; set; }
    public ApprovalRequest? ApprovalRequest { get; set; }
}

public sealed class ShipmentExecution : AuditableEntity
{
    public Guid ShipmentPlanId { get; set; }
    public DateOnly? ActualShipmentDate { get; set; }
    public int ShippedQty { get; set; }
    public string Status { get; set; } = ShipmentExecutionStatuses.Planned;
    public ShipmentPlan? ShipmentPlan { get; set; }
    public ICollection<PackingList> PackingLists { get; set; } = [];
}

public sealed class PackingList : AuditableEntity
{
    public Guid ShipmentExecutionId { get; set; }
    public int CartonCount { get; set; }
    public decimal GrossWeightKg { get; set; }
    public decimal NetWeightKg { get; set; }
    public string? Remarks { get; set; }
    public ShipmentExecution? ShipmentExecution { get; set; }
    public ICollection<CartonBreakdown> CartonBreakdowns { get; set; } = [];
}

public sealed class CartonBreakdown : AuditableEntity
{
    public Guid PackingListId { get; set; }
    public int CartonNo { get; set; }
    public string ColorName { get; set; } = string.Empty;
    public string SizeName { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public PackingList? PackingList { get; set; }
}
