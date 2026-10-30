namespace Erp.BuildingBlocks.EventBus;

/// <summary>
/// Stable routing keys / event type names for RabbitMQ (payload schemas version separately).
/// </summary>
public static class EventTypes
{
    public const string CompanyUpserted = "erp.company.upserted.v1";

    public const string EmployeeUpserted = "erp.hr.employee.upserted.v1";

    public const string EmployeeTransferred = "erp.hr.employee.transferred.v1";

    public const string ShiftPublished = "erp.shift.roster.published.v1";

    public const string AttendanceDayFinalized = "erp.attendance.day.finalized.v1";

    public const string LeaveBalanceAdjusted = "erp.leave.balance.adjusted.v1";

    public const string LeaveApplied = "erp.leave.applied.v1";

    public const string LeaveApproved = "erp.leave.approved.v1";

    public const string LeaveRejected = "erp.leave.rejected.v1";

    public const string LeaveCancelled = "erp.leave.cancelled.v1";

    public const string LeaveBalanceUpdated = "erp.leave.balance.updated.v1";

    public const string HolidayCreated = "erp.leave.holiday.created.v1";

    public const string WeeklyOffCreated = "erp.leave.weeklyoff.created.v1";

    public const string EarnLeaveGenerated = "erp.leave.earn.generated.v1";

    public const string LeaveEncashmentApproved = "erp.leave.encashment.approved.v1";

    public const string EmployeeCreated = "erp.hr.employee.created.v1";

    public const string EmployeeResigned = "erp.hr.employee.resigned.v1";

    public const string PayrollLocked = "erp.payroll.locked.v1";

    public const string PayrollUnlocked = "erp.payroll.unlocked.v1";

    public const string MonthlyAttendanceSummaryGenerated = "erp.attendance.monthly.summary.v1";

    public const string PayrollRunPosted = "erp.payroll.run.posted.v1";

    public const string PunchLogCollected = "erp.punch.log.collected.v1";

    public const string MerchandisingBuyerCreated = "erp.merchandising.buyer.created.v1";

    public const string MerchandisingStyleCreated = "erp.merchandising.style.created.v1";

    public const string MerchandisingOrderConfirmed = "erp.merchandising.order.confirmed.v1";

    public const string MerchandisingOrderCancelled = "erp.merchandising.order.cancelled.v1";

    public const string MerchandisingBomCreated = "erp.merchandising.bom.created.v1";

    public const string MerchandisingCostingCreated = "erp.merchandising.costing.created.v1";

    public const string MerchandisingSampleApproved = "erp.merchandising.sample.approved.v1";

    public const string MerchandisingShipmentPlanCreated = "erp.merchandising.shipment-plan.created.v1";

    public const string MerchandisingSampleSubmitted = "erp.merchandising.sample.submitted.v1";

    public const string MerchandisingQuotationCreated = "erp.merchandising.quotation.created.v1";

    public const string MerchandisingQuotationConverted = "erp.merchandising.quotation.converted.v1";

    public const string MerchandisingCostingSubmitted = "erp.merchandising.costing.submitted.v1";

    public const string MerchandisingTnaGenerated = "erp.merchandising.tna.generated.v1";

    public const string MerchandisingMaterialBookingCreated = "erp.merchandising.booking.created.v1";

    public const string MerchandisingRequisitionCreated = "erp.merchandising.requisition.created.v1";

    public const string MerchandisingRequisitionSubmitted = "erp.merchandising.requisition.submitted.v1";

    public const string MerchandisingCuttingStarted = "CuttingStarted";

    public const string MerchandisingProductionStarted = "ProductionStarted";

    public const string MerchandisingProductionCompleted = "ProductionCompleted";

    public const string MerchandisingShipmentCompleted = "ShipmentCompleted";
}
