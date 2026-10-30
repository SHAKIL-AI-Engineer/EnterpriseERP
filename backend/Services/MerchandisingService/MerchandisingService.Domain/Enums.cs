namespace MerchandisingService.Domain;

public static class OrderStatuses
{
    public const string Draft = "Draft";
    public const string Confirmed = "Confirmed";
    public const string InProduction = "InProduction";
    public const string PartiallyShipped = "PartiallyShipped";
    public const string Shipped = "Shipped";
    public const string Cancelled = "Cancelled";
}

public static class BuyerPoStatuses
{
    public const string Open = "Open";
    public const string Closed = "Closed";
    public const string Cancelled = "Cancelled";
}

public static class BomItemTypes
{
    public static readonly string[] Values =
    [
        "Fabric", "Accessories", "Thread", "Button", "Zipper", "Label", "Carton", "Poly", "Chemical"
    ];
}

public static class SampleTypes
{
    public static readonly string[] Values = ["Development", "Fit", "PP", "SizeSet", "Shipment"];
}

public static class SampleStatuses
{
    public const string Pending = "Pending";
    public const string Submitted = "Submitted";
    public const string Approved = "Approved";
    public const string Rejected = "Rejected";
    public const string Revised = "Revised";
}

public static class ShipmentModes
{
    public static readonly string[] Values = ["Sea", "Air", "Road"];
}

public static class ShipmentPlanStatuses
{
    public const string Planned = "Planned";
    public const string Completed = "Completed";
    public const string Cancelled = "Cancelled";
}

public static class MerchandisingRoles
{
    public const string SuperAdmin = "SuperAdmin";
    public const string GroupAdmin = "GroupAdmin";
    public const string CompanyAdmin = "CompanyAdmin";
    public const string MerchandisingManager = "MerchandisingManager";
    public const string Merchandiser = "Merchandiser";
    public const string CostingOfficer = "CostingOfficer";
    public const string ProductionManager = "ProductionManager";
    public const string StoreManager = "StoreManager";
    public const string Auditor = "Auditor";
    public const string Viewer = "Viewer";
}

public static class MerchandisingPermissions
{
    public const string Read = "merchandising.read";
    public const string BuyerManage = "merchandising.buyer.manage";
    public const string StyleManage = "merchandising.style.manage";
    public const string OrderCreate = "merchandising.order.create";
    public const string OrderUpdate = "merchandising.order.update";
    public const string OrderConfirm = "merchandising.order.confirm";
    public const string OrderCancel = "merchandising.order.cancel";
    public const string BomManage = "merchandising.bom.manage";
    public const string CostingManage = "merchandising.costing.manage";
    public const string SampleManage = "merchandising.sample.manage";
    public const string ShipmentPlanManage = "merchandising.shipment.manage";
    public const string ReportView = "merchandising.report.view";
    public const string MasterManage = "merchandising.master.manage";
    public const string QuotationManage = "merchandising.quotation.manage";
    public const string TnaManage = "merchandising.tna.manage";
    public const string BookingManage = "merchandising.booking.manage";
    public const string RequisitionManage = "merchandising.requisition.manage";
    public const string DocumentManage = "merchandising.document.manage";
    public const string CommunicationManage = "merchandising.communication.manage";
    public const string ApprovalManage = "merchandising.approval.manage";
    public const string ShipmentExecutionManage = "merchandising.shipment.execution.manage";

    public const string LegacyBuyerManage = "BUYER_MANAGE";
    public const string LegacyStyleManage = "STYLE_MANAGE";
    public const string LegacyOrderCreate = "ORDER_CREATE";
    public const string LegacyOrderUpdate = "ORDER_UPDATE";
    public const string LegacyOrderConfirm = "ORDER_CONFIRM";
    public const string LegacyOrderCancel = "ORDER_CANCEL";
    public const string LegacyBomManage = "BOM_MANAGE";
    public const string LegacyCostingManage = "COSTING_MANAGE";
    public const string LegacySampleManage = "SAMPLE_MANAGE";
    public const string LegacyShipmentPlanManage = "SHIPMENT_PLAN_MANAGE";
    public const string LegacyReportView = "MERCHANDISING_REPORT_VIEW";
}

public static class MerchandisingPolicies
{
    public const string BuyerManage = "Permission:merchandising.buyer.manage";
    public const string StyleManage = "Permission:merchandising.style.manage";
    public const string OrderCreate = "Permission:merchandising.order.create";
    public const string OrderUpdate = "Permission:merchandising.order.update";
    public const string OrderConfirm = "Permission:merchandising.order.confirm";
    public const string OrderCancel = "Permission:merchandising.order.cancel";
    public const string BomManage = "Permission:merchandising.bom.manage";
    public const string CostingManage = "Permission:merchandising.costing.manage";
    public const string SampleManage = "Permission:merchandising.sample.manage";
    public const string ShipmentPlanManage = "Permission:merchandising.shipment.manage";
    public const string ReportView = "Permission:merchandising.report.view";
    public const string MasterManage = "Permission:merchandising.master.manage";
    public const string QuotationManage = "Permission:merchandising.quotation.manage";
    public const string TnaManage = "Permission:merchandising.tna.manage";
    public const string BookingManage = "Permission:merchandising.booking.manage";
    public const string RequisitionManage = "Permission:merchandising.requisition.manage";
    public const string DocumentManage = "Permission:merchandising.document.manage";
    public const string CommunicationManage = "Permission:merchandising.communication.manage";
    public const string ApprovalManage = "Permission:merchandising.approval.manage";
    public const string ShipmentExecutionManage = "Permission:merchandising.shipment.execution.manage";
}
