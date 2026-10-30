using Erp.BuildingBlocks.SharedKernel;

namespace MerchandisingService.Domain;

public abstract class AuditableEntity
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid CompanyId { get; set; }
    public DateTime CreatedAt { get; set; } = BusinessTime.Now;
    public DateTime? UpdatedAt { get; set; }
    public string? CreatedBy { get; set; }
    public string? UpdatedBy { get; set; }
    public byte[] RowVersion { get; set; } = [];
}

public sealed class Buyer : AuditableEntity
{
    public string BuyerCode { get; set; } = string.Empty;
    public string BuyerName { get; set; } = string.Empty;
    public string? Country { get; set; }
    public string? ContactPerson { get; set; }
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public string? Address { get; set; }
    public string? PaymentTerms { get; set; }
    public string? Currency { get; set; }
    public int? LeadTimeDays { get; set; }
    public bool IsActive { get; set; } = true;
    public ICollection<Style> Styles { get; set; } = [];
    public ICollection<Order> Orders { get; set; } = [];
    public ICollection<BuyerContact> Contacts { get; set; } = [];
    public ICollection<BuyerPaymentTerm> PaymentTermDetails { get; set; } = [];
    public ICollection<BuyerComplianceRule> ComplianceRules { get; set; } = [];
}

public sealed class Season : AuditableEntity
{
    public string SeasonCode { get; set; } = string.Empty;
    public string SeasonName { get; set; } = string.Empty;
    public int? YearNo { get; set; }
    public bool IsActive { get; set; } = true;
}

public sealed class GarmentItem : AuditableEntity
{
    public string ItemCode { get; set; } = string.Empty;
    public string ItemName { get; set; } = string.Empty;
    public string? Category { get; set; }
    public bool IsActive { get; set; } = true;
}

public sealed class Style : AuditableEntity
{
    public Guid BuyerId { get; set; }
    public Guid? SeasonId { get; set; }
    public Guid? GarmentItemId { get; set; }
    public Guid? BrandId { get; set; }
    public string StyleNo { get; set; } = string.Empty;
    public string? StyleName { get; set; }
    public string? Description { get; set; }
    public string? FabricDescription { get; set; }
    public Buyer? Buyer { get; set; }
    public Season? Season { get; set; }
    public GarmentItem? GarmentItem { get; set; }
    public Brand? Brand { get; set; }
    public ICollection<StyleVersion> Versions { get; set; } = [];
    public ICollection<StyleBomItem> BomItems { get; set; } = [];
}

public sealed class Order : AuditableEntity
{
    public Guid BuyerId { get; set; }
    public Guid StyleId { get; set; }
    public string OrderNo { get; set; } = string.Empty;
    public DateOnly OrderDate { get; set; }
    public DateOnly? ShipmentDate { get; set; }
    public int TotalOrderQty { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal TotalValue { get; set; }
    public string CurrencyCode { get; set; } = "USD";
    public string OrderStatus { get; set; } = OrderStatuses.Draft;
    public Buyer? Buyer { get; set; }
    public Style? Style { get; set; }
    public ICollection<BuyerPurchaseOrder> BuyerPurchaseOrders { get; set; } = [];
    public ICollection<OrderColorSizeBreakdown> ColorSizeBreakdowns { get; set; } = [];
    public ICollection<BomItem> BomItems { get; set; } = [];
    public OrderCosting? Costing { get; set; }
    public ICollection<ShipmentPlan> ShipmentPlans { get; set; } = [];
    public OrderAssignment? Assignment { get; set; }
    public OrderCommercialTerms? CommercialTerms { get; set; }
    public ICollection<OrderTrimsMatrix> TrimsMatrix { get; set; } = [];
    public TnaCalendar? TnaCalendar { get; set; }
    public ICollection<MaterialBooking> MaterialBookings { get; set; } = [];
    public ICollection<PurchaseRequisition> Requisitions { get; set; } = [];
}

public sealed class BuyerPurchaseOrder : AuditableEntity
{
    public Guid OrderId { get; set; }
    public string PONo { get; set; } = string.Empty;
    public DateOnly? PODate { get; set; }
    public DateOnly? ShipmentDate { get; set; }
    public int OrderQty { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal TotalValue { get; set; }
    public string Status { get; set; } = BuyerPoStatuses.Open;
    public Order? Order { get; set; }
}

public sealed class OrderColorSizeBreakdown : AuditableEntity
{
    public Guid OrderId { get; set; }
    public Guid? BuyerPurchaseOrderId { get; set; }
    public string ColorName { get; set; } = string.Empty;
    public string SizeName { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public Order? Order { get; set; }
    public BuyerPurchaseOrder? BuyerPurchaseOrder { get; set; }
}

public sealed class BomItem : AuditableEntity
{
    public Guid OrderId { get; set; }
    public string ItemType { get; set; } = string.Empty;
    public string? ItemCode { get; set; }
    public string ItemName { get; set; } = string.Empty;
    public string UnitName { get; set; } = string.Empty;
    public decimal Consumption { get; set; }
    public decimal WastagePercent { get; set; }
    public decimal RequiredQty { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal TotalCost { get; set; }
    public Order? Order { get; set; }
}

public sealed class OrderCosting : AuditableEntity
{
    public Guid OrderId { get; set; }
    public decimal FabricCost { get; set; }
    public decimal AccessoriesCost { get; set; }
    public decimal CM { get; set; }
    public decimal WashingCost { get; set; }
    public decimal EmbroideryCost { get; set; }
    public decimal PrintingCost { get; set; }
    public decimal OtherCost { get; set; }
    public decimal TotalCost { get; set; }
    public decimal SellingPrice { get; set; }
    public decimal ProfitAmount { get; set; }
    public decimal ProfitPercent { get; set; }
    public decimal FreightCost { get; set; }
    public decimal CommercialCost { get; set; }
    public decimal BankCharges { get; set; }
    public decimal Commission { get; set; }
    public decimal FinalFob { get; set; }
    public string ApprovalStatus { get; set; } = CostingApprovalStatuses.Draft;
    public Order? Order { get; set; }
}

public sealed class Sample : AuditableEntity
{
    public Guid BuyerId { get; set; }
    public Guid StyleId { get; set; }
    public string SampleType { get; set; } = string.Empty;
    public DateOnly RequestDate { get; set; }
    public DateOnly? SubmitDate { get; set; }
    public DateOnly? ApprovalDate { get; set; }
    public string Status { get; set; } = SampleStatuses.Pending;
    public string? Remarks { get; set; }
    public Buyer? Buyer { get; set; }
    public Style? Style { get; set; }
    public SampleCosting? Costing { get; set; }
}

public sealed class ShipmentPlan : AuditableEntity
{
    public Guid OrderId { get; set; }
    public Guid? BuyerPurchaseOrderId { get; set; }
    public DateOnly PlannedShipmentDate { get; set; }
    public int PlannedQty { get; set; }
    public string? ShipmentMode { get; set; }
    public string? Destination { get; set; }
    public string Status { get; set; } = ShipmentPlanStatuses.Planned;
    public Order? Order { get; set; }
    public BuyerPurchaseOrder? BuyerPurchaseOrder { get; set; }
}

public sealed class OrderStatusHistory
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid CompanyId { get; set; }
    public Guid OrderId { get; set; }
    public string FromStatus { get; set; } = string.Empty;
    public string ToStatus { get; set; } = string.Empty;
    public string Reason { get; set; } = string.Empty;
    public DateTime ChangedAt { get; set; } = BusinessTime.Now;
    public string? ChangedBy { get; set; }
}

public sealed class MerchandisingAuditLog
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid CompanyId { get; set; }
    public string EntityName { get; set; } = string.Empty;
    public Guid EntityId { get; set; }
    public string Action { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = BusinessTime.Now;
    public string? UserName { get; set; }
    public string? ChangesJson { get; set; }
}
