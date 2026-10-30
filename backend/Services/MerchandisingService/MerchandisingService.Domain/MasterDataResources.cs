namespace MerchandisingService.Domain;

public static class QuotationStatuses
{
    public const string Draft = "Draft";
    public const string Sent = "Sent";
    public const string Negotiating = "Negotiating";
    public const string Accepted = "Accepted";
    public const string Rejected = "Rejected";
    public const string Converted = "Converted";
}

public static class CostingApprovalStatuses
{
    public const string Draft = "Draft";
    public const string Submitted = "Submitted";
    public const string Approved = "Approved";
    public const string Rejected = "Rejected";
}

public static class TnaCalendarStatuses
{
    public const string Active = "Active";
    public const string Completed = "Completed";
    public const string Cancelled = "Cancelled";
}

public static class TnaMilestoneStatuses
{
    public const string Pending = "Pending";
    public const string InProgress = "InProgress";
    public const string Completed = "Completed";
    public const string Delayed = "Delayed";
}

public static class BookingTypes
{
    public const string Fabric = "Fabric";
    public const string Trims = "Trims";
}

public static class BookingStatuses
{
    public const string Draft = "Draft";
    public const string Confirmed = "Confirmed";
    public const string PartiallyAllocated = "PartiallyAllocated";
    public const string FullyAllocated = "FullyAllocated";
    public const string Cancelled = "Cancelled";
}

public static class RequisitionStatuses
{
    public const string Draft = "Draft";
    public const string Submitted = "Submitted";
    public const string Approved = "Approved";
    public const string Ordered = "Ordered";
    public const string Cancelled = "Cancelled";
}

public static class RequisitionLineStatuses
{
    public const string Open = "Open";
    public const string Ordered = "Ordered";
    public const string Received = "Received";
    public const string Cancelled = "Cancelled";
}

public static class MasterDataResources
{
    public static readonly string[] Values =
    [
        "colors", "sizes", "size-ratios", "units", "currencies",
        "fabric-types", "trims-types", "suppliers", "brands", "garment-categories"
    ];
}
