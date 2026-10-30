namespace MerchandisingService.Domain;

public sealed class ColorMaster : AuditableEntity
{
    public string ColorCode { get; set; } = string.Empty;
    public string ColorName { get; set; } = string.Empty;
    public string? PantoneCode { get; set; }
    public bool IsActive { get; set; } = true;
}

public sealed class SizeMaster : AuditableEntity
{
    public string SizeCode { get; set; } = string.Empty;
    public string SizeName { get; set; } = string.Empty;
    public int SortOrder { get; set; }
    public bool IsActive { get; set; } = true;
}

public sealed class SizeRatioTemplate : AuditableEntity
{
    public string TemplateCode { get; set; } = string.Empty;
    public string TemplateName { get; set; } = string.Empty;
    public string? RatioJson { get; set; }
    public bool IsActive { get; set; } = true;
}

public sealed class UnitMaster : AuditableEntity
{
    public string UnitCode { get; set; } = string.Empty;
    public string UnitName { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
}

public sealed class CurrencyMaster : AuditableEntity
{
    public string CurrencyCode { get; set; } = string.Empty;
    public string CurrencyName { get; set; } = string.Empty;
    public string? Symbol { get; set; }
    public bool IsActive { get; set; } = true;
}

public sealed class FabricTypeMaster : AuditableEntity
{
    public string FabricTypeCode { get; set; } = string.Empty;
    public string FabricTypeName { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
}

public sealed class TrimsTypeMaster : AuditableEntity
{
    public string TrimsTypeCode { get; set; } = string.Empty;
    public string TrimsTypeName { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
}

public sealed class SupplierMaster : AuditableEntity
{
    public string SupplierCode { get; set; } = string.Empty;
    public string SupplierName { get; set; } = string.Empty;
    public string? ContactPerson { get; set; }
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public string? Address { get; set; }
    public bool IsActive { get; set; } = true;
}

public sealed class Brand : AuditableEntity
{
    public Guid? BuyerId { get; set; }
    public string BrandCode { get; set; } = string.Empty;
    public string BrandName { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
    public Buyer? Buyer { get; set; }
}

public sealed class GarmentCategory : AuditableEntity
{
    public string CategoryCode { get; set; } = string.Empty;
    public string CategoryName { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
}

public sealed class BuyerContact : AuditableEntity
{
    public Guid BuyerId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public string? Role { get; set; }
    public Buyer? Buyer { get; set; }
}

public sealed class BuyerPaymentTerm : AuditableEntity
{
    public Guid BuyerId { get; set; }
    public string TermName { get; set; } = string.Empty;
    public int Days { get; set; }
    public string? Description { get; set; }
    public Buyer? Buyer { get; set; }
}

public sealed class BuyerComplianceRule : AuditableEntity
{
    public Guid BuyerId { get; set; }
    public string RuleName { get; set; } = string.Empty;
    public string RuleType { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool IsMandatory { get; set; }
    public Buyer? Buyer { get; set; }
}

public sealed class StyleVersion : AuditableEntity
{
    public Guid StyleId { get; set; }
    public int VersionNo { get; set; }
    public string? Description { get; set; }
    public DateOnly EffectiveDate { get; set; }
    public Style? Style { get; set; }
}

public sealed class StyleBomItem : AuditableEntity
{
    public Guid StyleId { get; set; }
    public string ItemType { get; set; } = string.Empty;
    public string? ItemCode { get; set; }
    public string ItemName { get; set; } = string.Empty;
    public string UnitName { get; set; } = string.Empty;
    public decimal Consumption { get; set; }
    public decimal WastagePercent { get; set; }
    public decimal UnitPrice { get; set; }
    public Style? Style { get; set; }
}

public sealed class SampleCosting : AuditableEntity
{
    public Guid SampleId { get; set; }
    public decimal FabricCost { get; set; }
    public decimal TrimsCost { get; set; }
    public decimal CMCost { get; set; }
    public decimal TotalCost { get; set; }
    public Sample? Sample { get; set; }
}

public sealed class Quotation : AuditableEntity
{
    public Guid BuyerId { get; set; }
    public Guid StyleId { get; set; }
    public string QuotationNo { get; set; } = string.Empty;
    public DateOnly QuotationDate { get; set; }
    public DateOnly? ValidUntil { get; set; }
    public string Status { get; set; } = QuotationStatuses.Draft;
    public decimal TotalAmount { get; set; }
    public Buyer? Buyer { get; set; }
    public Style? Style { get; set; }
    public ICollection<QuotationLine> Lines { get; set; } = [];
    public ICollection<QuotationNegotiation> Negotiations { get; set; } = [];
}

public sealed class QuotationLine : AuditableEntity
{
    public Guid QuotationId { get; set; }
    public string ItemDescription { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal LineTotal { get; set; }
    public Quotation? Quotation { get; set; }
}

public sealed class QuotationNegotiation : AuditableEntity
{
    public Guid QuotationId { get; set; }
    public int RoundNo { get; set; }
    public decimal ProposedAmount { get; set; }
    public decimal? CounterAmount { get; set; }
    public string? Notes { get; set; }
    public DateTime NegotiatedAt { get; set; }
    public Quotation? Quotation { get; set; }
}

public sealed class OrderAssignment : AuditableEntity
{
    public Guid OrderId { get; set; }
    public string AssignedTo { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public DateTime AssignedAt { get; set; }
    public Order? Order { get; set; }
}

public sealed class OrderCommercialTerms : AuditableEntity
{
    public Guid OrderId { get; set; }
    public string? PaymentTerms { get; set; }
    public string? Incoterms { get; set; }
    public string? LCBank { get; set; }
    public decimal Commission { get; set; }
    public Order? Order { get; set; }
}

public sealed class OrderTrimsMatrix : AuditableEntity
{
    public Guid OrderId { get; set; }
    public string TrimsType { get; set; } = string.Empty;
    public string ColorName { get; set; } = string.Empty;
    public string SizeName { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public Order? Order { get; set; }
}

public sealed class TnaTemplate : AuditableEntity
{
    public string TemplateName { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool IsDefault { get; set; }
    public ICollection<TnaMilestone> Milestones { get; set; } = [];
}

public sealed class TnaCalendar : AuditableEntity
{
    public Guid OrderId { get; set; }
    public Guid? TemplateId { get; set; }
    public DateOnly StartDate { get; set; }
    public DateOnly? EndDate { get; set; }
    public string Status { get; set; } = TnaCalendarStatuses.Active;
    public Order? Order { get; set; }
    public TnaTemplate? Template { get; set; }
    public ICollection<TnaMilestone> Milestones { get; set; } = [];
}

public sealed class TnaMilestone : AuditableEntity
{
    public Guid? TnaCalendarId { get; set; }
    public Guid? TnaTemplateId { get; set; }
    public string MilestoneName { get; set; } = string.Empty;
    public int SequenceNo { get; set; }
    public DateOnly PlannedDate { get; set; }
    public DateOnly? ActualDate { get; set; }
    public string Status { get; set; } = TnaMilestoneStatuses.Pending;
    public TnaCalendar? Calendar { get; set; }
    public TnaTemplate? Template { get; set; }
    public ICollection<TnaDelayLog> DelayLogs { get; set; } = [];
}

public sealed class TnaDelayLog : AuditableEntity
{
    public Guid TnaMilestoneId { get; set; }
    public int DelayDays { get; set; }
    public string Reason { get; set; } = string.Empty;
    public DateTime LoggedAt { get; set; }
    public TnaMilestone? Milestone { get; set; }
}

public sealed class MaterialBooking : AuditableEntity
{
    public Guid OrderId { get; set; }
    public string BookingNo { get; set; } = string.Empty;
    public string BookingType { get; set; } = BookingTypes.Fabric;
    public string Status { get; set; } = BookingStatuses.Draft;
    public decimal TotalQty { get; set; }
    public Order? Order { get; set; }
    public ICollection<FabricBookingDetail> FabricDetails { get; set; } = [];
    public ICollection<TrimsBookingDetail> TrimsDetails { get; set; } = [];
    public ICollection<BookingAllocation> Allocations { get; set; } = [];
}

public sealed class FabricBookingDetail : AuditableEntity
{
    public Guid MaterialBookingId { get; set; }
    public Guid? FabricTypeId { get; set; }
    public string ColorName { get; set; } = string.Empty;
    public decimal RequiredQty { get; set; }
    public decimal BookedQty { get; set; }
    public Guid? SupplierId { get; set; }
    public MaterialBooking? MaterialBooking { get; set; }
}

public sealed class TrimsBookingDetail : AuditableEntity
{
    public Guid MaterialBookingId { get; set; }
    public Guid? TrimsTypeId { get; set; }
    public string ItemName { get; set; } = string.Empty;
    public decimal RequiredQty { get; set; }
    public decimal BookedQty { get; set; }
    public Guid? SupplierId { get; set; }
    public MaterialBooking? MaterialBooking { get; set; }
}

public sealed class BookingAllocation : AuditableEntity
{
    public Guid MaterialBookingId { get; set; }
    public Guid DetailId { get; set; }
    public string DetailType { get; set; } = string.Empty;
    public decimal AllocatedQty { get; set; }
    public DateOnly AllocationDate { get; set; }
    public MaterialBooking? MaterialBooking { get; set; }
}

public sealed class PurchaseRequisition : AuditableEntity
{
    public Guid? OrderId { get; set; }
    public string RequisitionNo { get; set; } = string.Empty;
    public string Status { get; set; } = RequisitionStatuses.Draft;
    public DateOnly RequestedDate { get; set; }
    public Order? Order { get; set; }
    public ICollection<RequisitionLine> Lines { get; set; } = [];
}

public sealed class RequisitionLine : AuditableEntity
{
    public Guid RequisitionId { get; set; }
    public string ItemType { get; set; } = string.Empty;
    public string? ItemCode { get; set; }
    public string ItemName { get; set; } = string.Empty;
    public decimal RequiredQty { get; set; }
    public string UnitName { get; set; } = string.Empty;
    public string Status { get; set; } = RequisitionLineStatuses.Open;
    public PurchaseRequisition? Requisition { get; set; }
}
