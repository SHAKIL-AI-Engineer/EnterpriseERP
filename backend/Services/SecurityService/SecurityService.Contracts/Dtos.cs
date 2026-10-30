namespace SecurityService.Contracts;

public sealed record GateDto(Guid Id, Guid CompanyId, string GateCode, string GateName, string? LocationName, bool IsActive);
public sealed record VisitorDto(Guid Id, Guid CompanyId, string VisitorName, string? Phone, string? NIDNo, string? CompanyName, string? Address, string? PhotoUrl, bool IsBlacklisted);
public sealed record VisitorEntryDto(Guid Id, Guid CompanyId, Guid GateId, Guid VisitorId, string EntryNo, DateOnly VisitDate, DateTime InTime, DateTime? OutTime, string Purpose, Guid? PersonToMeetEmployeeId, Guid? DepartmentId, string? VisitorCardNo, string Status);
public sealed record EmployeeOutPassDto(Guid Id, Guid CompanyId, Guid GateId, Guid EmployeeId, string PassNo, DateOnly PassDate, DateTime OutTime, DateTime? ExpectedReturnTime, DateTime? ActualReturnTime, string Reason, string ApprovalStatus, Guid? ApprovedBy, DateTime? ApprovedAt, string Status);
public sealed record VehicleDto(Guid Id, Guid CompanyId, string VehicleNo, string? VehicleType, string? DriverName, string? DriverPhone, bool IsActive);
public sealed record VehicleEntryDto(Guid Id, Guid CompanyId, Guid GateId, Guid VehicleId, string EntryNo, DateOnly EntryDate, DateTime InTime, DateTime? OutTime, string? Purpose, string? DriverName, string? DriverPhone, string Status);
public sealed record GatePassItemDto(Guid Id, Guid CompanyId, Guid GatePassId, string ItemName, string? ItemDescription, string? UnitName, decimal Quantity, string? Remarks, decimal ReturnedQty);
public sealed record GatePassDto(Guid Id, Guid CompanyId, Guid GateId, string GatePassNo, DateOnly GatePassDate, string GatePassType, string Direction, string? ReferenceType, Guid? ReferenceId, Guid? DepartmentId, Guid? SupplierId, Guid? BuyerId, string? VehicleNo, string? DriverName, string? Purpose, bool IsReturnable, DateOnly? ExpectedReturnDate, string ApprovalStatus, Guid? ApprovedBy, DateTime? ApprovedAt, string Status, IReadOnlyList<GatePassItemDto> Items);
public sealed record ReturnableGatePassReturnItemDto(Guid Id, Guid CompanyId, Guid ReturnId, Guid GatePassItemId, decimal ReturnQty);
public sealed record ReturnableGatePassReturnDto(Guid Id, Guid CompanyId, Guid GatePassId, DateOnly ReturnDate, string? ReturnedBy, Guid? ReceivedBy, string? Remarks, IReadOnlyList<ReturnableGatePassReturnItemDto> Items);
public sealed record ChalanItemDto(Guid Id, Guid CompanyId, Guid ChalanId, string ItemName, string? UnitName, decimal Quantity, string? Remarks);
public sealed record ChalanDto(Guid Id, Guid CompanyId, string ChalanNo, DateOnly ChalanDate, string ChalanType, Guid? SupplierId, Guid? BuyerId, Guid? OrderId, string? VehicleNo, string? DriverName, string? Remarks, string Status, Guid? GatePassId, IReadOnlyList<ChalanItemDto> Items);
public sealed record BillEntryDto(Guid Id, Guid CompanyId, string BillNo, DateOnly BillDate, string BillType, Guid? SupplierId, Guid? ChalanId, Guid? GatePassId, decimal Amount, decimal VATAmount, decimal TotalAmount, string? Description, string Status, Guid? ApprovedBy, DateTime? ApprovedAt);
public sealed record SecurityCheckLogDto(Guid Id, Guid CompanyId, Guid GateId, string ReferenceType, Guid ReferenceId, DateTime CheckTime, Guid? CheckedBy, string CheckResult, string? Remarks);
public sealed record GateActionLogDto(Guid Id, Guid CompanyId, Guid? GateId, string ReferenceType, Guid ReferenceId, string ActionName, Guid? ActorUserId, DateTime ActionAt, string? Remarks);

public sealed record DailyGateRegisterDto(DateOnly Date, IReadOnlyList<VisitorEntryDto> Visitors, IReadOnlyList<VehicleEntryDto> Vehicles, IReadOnlyList<GatePassDto> GatePasses);
public sealed record MaterialInOutReportDto(DateOnly FromDate, DateOnly ToDate, IReadOnlyList<GatePassDto> MaterialIn, IReadOnlyList<GatePassDto> MaterialOut);
public sealed record ReturnablePendingDto(Guid GatePassId, string GatePassNo, DateOnly GatePassDate, DateOnly? ExpectedReturnDate, string ItemName, decimal Quantity, decimal ReturnedQty, decimal PendingQty);
public sealed record SecurityReportDto(string ReportName, object Data);
