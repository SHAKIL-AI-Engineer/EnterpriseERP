namespace SecurityService.Contracts;

public sealed record CreateGateRequest(Guid CompanyId, string GateCode, string GateName, string? LocationName);
public sealed record UpdateGateRequest(string GateCode, string GateName, string? LocationName, bool IsActive);

public sealed record CreateVisitorRequest(Guid CompanyId, string VisitorName, string? Phone, string? NIDNo, string? CompanyName, string? Address, string? PhotoUrl);

public sealed record CreateVisitorEntryRequest(Guid CompanyId, Guid GateId, Guid VisitorId, string EntryNo, DateOnly VisitDate, DateTime InTime, string Purpose, Guid? PersonToMeetEmployeeId, Guid? DepartmentId, string? VisitorCardNo);
public sealed record CheckoutVisitorEntryRequest(DateTime OutTime);

public sealed record CreateEmployeeOutPassRequest(Guid CompanyId, Guid GateId, Guid EmployeeId, string PassNo, DateOnly PassDate, DateTime OutTime, DateTime? ExpectedReturnTime, string Reason);
public sealed record EmployeeOutPassReturnRequest(DateTime ActualReturnTime);

public sealed record CreateVehicleRequest(Guid CompanyId, string VehicleNo, string? VehicleType, string? DriverName, string? DriverPhone);
public sealed record CreateVehicleEntryRequest(Guid CompanyId, Guid GateId, Guid VehicleId, string EntryNo, DateOnly EntryDate, DateTime InTime, string? Purpose, string? DriverName, string? DriverPhone);
public sealed record VehicleExitRequest(DateTime OutTime);

public sealed record CreateGatePassItemRequest(string ItemName, string? ItemDescription, string? UnitName, decimal Quantity, string? Remarks);
public sealed record CreateGatePassRequest(Guid CompanyId, Guid GateId, string GatePassNo, DateOnly GatePassDate, string GatePassType, string Direction, string? ReferenceType, Guid? ReferenceId, Guid? DepartmentId, Guid? SupplierId, Guid? BuyerId, string? VehicleNo, string? DriverName, string? Purpose, bool IsReturnable, DateOnly? ExpectedReturnDate, IReadOnlyList<CreateGatePassItemRequest> Items);

public sealed record CreateReturnableGatePassReturnItemRequest(Guid GatePassItemId, decimal ReturnQty);
public sealed record CreateReturnableGatePassReturnRequest(Guid CompanyId, Guid GatePassId, DateOnly ReturnDate, string? ReturnedBy, Guid? ReceivedBy, string? Remarks, IReadOnlyList<CreateReturnableGatePassReturnItemRequest> Items);

public sealed record CreateChalanItemRequest(string ItemName, string? UnitName, decimal Quantity, string? Remarks);
public sealed record CreateChalanRequest(Guid CompanyId, string ChalanNo, DateOnly ChalanDate, string ChalanType, Guid? SupplierId, Guid? BuyerId, Guid? OrderId, string? VehicleNo, string? DriverName, string? Remarks, Guid? GatePassId, IReadOnlyList<CreateChalanItemRequest> Items);

public sealed record CreateBillEntryRequest(Guid CompanyId, string BillNo, DateOnly BillDate, string BillType, Guid? SupplierId, Guid? ChalanId, Guid? GatePassId, decimal Amount, decimal VATAmount, decimal TotalAmount, string? Description);

public sealed record CreateSecurityCheckRequest(Guid CompanyId, Guid GateId, string ReferenceType, Guid ReferenceId, DateTime CheckTime, string CheckResult, string? Remarks);

public sealed record ReportExportApiRequest(Guid CompanyId, string ReportName, string Format, DateOnly? Date, DateOnly? FromDate, DateOnly? ToDate);
