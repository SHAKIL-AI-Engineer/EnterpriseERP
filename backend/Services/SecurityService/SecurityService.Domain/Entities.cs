using Erp.BuildingBlocks.SharedKernel;

namespace SecurityService.Domain;

public abstract class CompanyEntity
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid CompanyId { get; set; }
    public DateTime CreatedAt { get; set; } = BusinessTime.Now;
    public Guid? CreatedBy { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public Guid? UpdatedBy { get; set; }
    public bool IsDeleted { get; set; }
    public byte[] RowVersion { get; set; } = [];
}

public sealed class Gate : CompanyEntity
{
    public string GateCode { get; set; } = string.Empty;
    public string GateName { get; set; } = string.Empty;
    public string? LocationName { get; set; }
    public bool IsActive { get; set; } = true;
}

public sealed class Visitor : CompanyEntity
{
    public string VisitorName { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string? NIDNo { get; set; }
    public string? CompanyName { get; set; }
    public string? Address { get; set; }
    public string? PhotoUrl { get; set; }
    public bool IsBlacklisted { get; set; }
}

public sealed class VisitorEntry : CompanyEntity
{
    public Guid GateId { get; set; }
    public Guid VisitorId { get; set; }
    public string EntryNo { get; set; } = string.Empty;
    public DateOnly VisitDate { get; set; }
    public DateTime InTime { get; set; } = BusinessTime.Now;
    public DateTime? OutTime { get; set; }
    public string Purpose { get; set; } = string.Empty;
    public Guid? PersonToMeetEmployeeId { get; set; }
    public Guid? DepartmentId { get; set; }
    public string? VisitorCardNo { get; set; }
    public string Status { get; set; } = VisitorEntryStatuses.CheckedIn;
    public Gate? Gate { get; set; }
    public Visitor? Visitor { get; set; }
}

public sealed class EmployeeOutPass : CompanyEntity
{
    public Guid GateId { get; set; }
    public Guid EmployeeId { get; set; }
    public string PassNo { get; set; } = string.Empty;
    public DateOnly PassDate { get; set; }
    public DateTime OutTime { get; set; }
    public DateTime? ExpectedReturnTime { get; set; }
    public DateTime? ActualReturnTime { get; set; }
    public string Reason { get; set; } = string.Empty;
    public string ApprovalStatus { get; set; } = ApprovalStatuses.Pending;
    public Guid? ApprovedBy { get; set; }
    public DateTime? ApprovedAt { get; set; }
    public string Status { get; set; } = EmployeeOutPassStatuses.Pending;
    public Gate? Gate { get; set; }
}

public sealed class Vehicle : CompanyEntity
{
    public string VehicleNo { get; set; } = string.Empty;
    public string? VehicleType { get; set; }
    public string? DriverName { get; set; }
    public string? DriverPhone { get; set; }
    public bool IsActive { get; set; } = true;
}

public sealed class VehicleEntry : CompanyEntity
{
    public Guid GateId { get; set; }
    public Guid VehicleId { get; set; }
    public string EntryNo { get; set; } = string.Empty;
    public DateOnly EntryDate { get; set; }
    public DateTime InTime { get; set; } = BusinessTime.Now;
    public DateTime? OutTime { get; set; }
    public string? Purpose { get; set; }
    public string? DriverName { get; set; }
    public string? DriverPhone { get; set; }
    public string Status { get; set; } = VehicleEntryStatuses.In;
    public Gate? Gate { get; set; }
    public Vehicle? Vehicle { get; set; }
}

public sealed class GatePass : CompanyEntity
{
    public Guid GateId { get; set; }
    public string GatePassNo { get; set; } = string.Empty;
    public DateOnly GatePassDate { get; set; }
    public string GatePassType { get; set; } = string.Empty;
    public string Direction { get; set; } = GatePassDirections.Out;
    public string? ReferenceType { get; set; }
    public Guid? ReferenceId { get; set; }
    public Guid? DepartmentId { get; set; }
    public Guid? SupplierId { get; set; }
    public Guid? BuyerId { get; set; }
    public string? VehicleNo { get; set; }
    public string? DriverName { get; set; }
    public string? Purpose { get; set; }
    public bool IsReturnable { get; set; }
    public DateOnly? ExpectedReturnDate { get; set; }
    public string ApprovalStatus { get; set; } = ApprovalStatuses.Pending;
    public Guid? ApprovedBy { get; set; }
    public DateTime? ApprovedAt { get; set; }
    public string Status { get; set; } = GatePassStatuses.Draft;
    public Gate? Gate { get; set; }
    public ICollection<GatePassItem> Items { get; set; } = [];
}

public sealed class GatePassItem : CompanyEntity
{
    public Guid GatePassId { get; set; }
    public string ItemName { get; set; } = string.Empty;
    public string? ItemDescription { get; set; }
    public string? UnitName { get; set; }
    public decimal Quantity { get; set; }
    public string? Remarks { get; set; }
    public decimal ReturnedQty { get; set; }
    public GatePass? GatePass { get; set; }
}

public sealed class ReturnableGatePassReturn : CompanyEntity
{
    public Guid GatePassId { get; set; }
    public DateOnly ReturnDate { get; set; }
    public string? ReturnedBy { get; set; }
    public Guid? ReceivedBy { get; set; }
    public string? Remarks { get; set; }
    public GatePass? GatePass { get; set; }
    public ICollection<ReturnableGatePassReturnItem> Items { get; set; } = [];
}

public sealed class ReturnableGatePassReturnItem : CompanyEntity
{
    public Guid ReturnId { get; set; }
    public Guid GatePassItemId { get; set; }
    public decimal ReturnQty { get; set; }
    public ReturnableGatePassReturn? Return { get; set; }
    public GatePassItem? GatePassItem { get; set; }
}

public sealed class Chalan : CompanyEntity
{
    public string ChalanNo { get; set; } = string.Empty;
    public DateOnly ChalanDate { get; set; }
    public string ChalanType { get; set; } = string.Empty;
    public Guid? SupplierId { get; set; }
    public Guid? BuyerId { get; set; }
    public Guid? OrderId { get; set; }
    public string? VehicleNo { get; set; }
    public string? DriverName { get; set; }
    public string? Remarks { get; set; }
    public string Status { get; set; } = WorkflowStatuses.Draft;
    public Guid? GatePassId { get; set; }
    public GatePass? GatePass { get; set; }
    public ICollection<ChalanItem> Items { get; set; } = [];
}

public sealed class ChalanItem : CompanyEntity
{
    public Guid ChalanId { get; set; }
    public string ItemName { get; set; } = string.Empty;
    public string? UnitName { get; set; }
    public decimal Quantity { get; set; }
    public string? Remarks { get; set; }
    public Chalan? Chalan { get; set; }
}

public sealed class BillEntry : CompanyEntity
{
    public string BillNo { get; set; } = string.Empty;
    public DateOnly BillDate { get; set; }
    public string BillType { get; set; } = string.Empty;
    public Guid? SupplierId { get; set; }
    public Guid? ChalanId { get; set; }
    public Guid? GatePassId { get; set; }
    public decimal Amount { get; set; }
    public decimal VATAmount { get; set; }
    public decimal TotalAmount { get; set; }
    public string? Description { get; set; }
    public string Status { get; set; } = WorkflowStatuses.Pending;
    public Guid? ApprovedBy { get; set; }
    public DateTime? ApprovedAt { get; set; }
    public Chalan? Chalan { get; set; }
    public GatePass? GatePass { get; set; }
}

public sealed class SecurityCheckLog : CompanyEntity
{
    public Guid GateId { get; set; }
    public string ReferenceType { get; set; } = string.Empty;
    public Guid ReferenceId { get; set; }
    public DateTime CheckTime { get; set; } = BusinessTime.Now;
    public Guid? CheckedBy { get; set; }
    public string CheckResult { get; set; } = CheckResults.Passed;
    public string? Remarks { get; set; }
    public Gate? Gate { get; set; }
}

public sealed class GateActionLog
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid CompanyId { get; set; }
    public Guid? GateId { get; set; }
    public string ReferenceType { get; set; } = string.Empty;
    public Guid ReferenceId { get; set; }
    public string ActionName { get; set; } = string.Empty;
    public Guid? ActorUserId { get; set; }
    public DateTime ActionAt { get; set; } = BusinessTime.Now;
    public string? Remarks { get; set; }
}

public sealed class ExternalReferenceSnapshot : CompanyEntity
{
    public string ReferenceType { get; set; } = string.Empty;
    public Guid ReferenceId { get; set; }
    public string EventName { get; set; } = string.Empty;
    public string PayloadJson { get; set; } = "{}";
}
