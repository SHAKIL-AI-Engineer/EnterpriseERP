namespace SecurityService.Domain;

public static class SecurityRoles
{
    public const string SuperAdmin = "SuperAdmin";
    public const string GroupAdmin = "GroupAdmin";
    public const string CompanyAdmin = "CompanyAdmin";
    public const string SecurityManager = "SecurityManager";
    public const string SecurityOfficer = "SecurityOfficer";
    public const string GateOfficer = "GateOfficer";
    public const string HRManager = "HRManager";
    public const string StoreManager = "StoreManager";
    public const string AccountsOfficer = "AccountsOfficer";
    public const string Auditor = "Auditor";
    public const string Viewer = "Viewer";
}

public static class SecurityPermissions
{
    public const string GateManage = "GATE_MANAGE";
    public const string VisitorEntryCreate = "VISITOR_ENTRY_CREATE";
    public const string VisitorCheckout = "VISITOR_CHECKOUT";
    public const string EmployeeOutPassCreate = "EMPLOYEE_OUT_PASS_CREATE";
    public const string EmployeeOutPassApprove = "EMPLOYEE_OUT_PASS_APPROVE";
    public const string VehicleEntryCreate = "VEHICLE_ENTRY_CREATE";
    public const string VehicleExit = "VEHICLE_EXIT";
    public const string GatePassCreate = "GATE_PASS_CREATE";
    public const string GatePassApprove = "GATE_PASS_APPROVE";
    public const string GatePassIssue = "GATE_PASS_ISSUE";
    public const string ChalanCreate = "CHALAN_CREATE";
    public const string ChalanApprove = "CHALAN_APPROVE";
    public const string BillEntryCreate = "BILL_ENTRY_CREATE";
    public const string BillEntryApprove = "BILL_ENTRY_APPROVE";
    public const string BillSendToAccounts = "BILL_SEND_TO_ACCOUNTS";
    public const string SecurityCheckCreate = "SECURITY_CHECK_CREATE";
    public const string GateReportView = "GATE_REPORT_VIEW";
    public const string GateReportExport = "GATE_REPORT_EXPORT";
}

public static class VisitorEntryStatuses
{
    public const string CheckedIn = "CheckedIn";
    public const string CheckedOut = "CheckedOut";
    public const string Cancelled = "Cancelled";
}

public static class EmployeeOutPassStatuses
{
    public const string Pending = "Pending";
    public const string Approved = "Approved";
    public const string Out = "Out";
    public const string Returned = "Returned";
    public const string Cancelled = "Cancelled";
}

public static class ApprovalStatuses
{
    public const string Pending = "Pending";
    public const string Approved = "Approved";
    public const string Rejected = "Rejected";
}

public static class VehicleEntryStatuses
{
    public const string In = "In";
    public const string Out = "Out";
}

public static class GatePassTypes
{
    public const string MaterialIn = "MaterialIn";
    public const string MaterialOut = "MaterialOut";
    public const string Returnable = "Returnable";
    public const string NonReturnable = "NonReturnable";
    public const string Delivery = "Delivery";
    public const string Sample = "Sample";
    public const string Machine = "Machine";
    public const string Scrap = "Scrap";
    public const string Others = "Others";

    public static readonly string[] All =
    [
        MaterialIn, MaterialOut, Returnable, NonReturnable, Delivery, Sample, Machine, Scrap, Others
    ];
}

public static class GatePassDirections
{
    public const string In = "IN";
    public const string Out = "OUT";
}

public static class GatePassStatuses
{
    public const string Draft = "Draft";
    public const string Submitted = "Submitted";
    public const string Approved = "Approved";
    public const string Issued = "Issued";
    public const string Completed = "Completed";
    public const string Cancelled = "Cancelled";
    public const string Hold = "Hold";
}

public static class ChalanTypes
{
    public const string Delivery = "Delivery";
    public const string Receive = "Receive";
    public const string Return = "Return";
    public const string Sample = "Sample";
    public const string Fabric = "Fabric";
    public const string Accessories = "Accessories";
    public const string FinishedGoods = "FinishedGoods";
    public const string Others = "Others";
}

public static class WorkflowStatuses
{
    public const string Draft = "Draft";
    public const string Pending = "Pending";
    public const string Approved = "Approved";
    public const string Rejected = "Rejected";
    public const string SentToAccounts = "SentToAccounts";
    public const string Cancelled = "Cancelled";
    public const string Hold = "Hold";
}

public static class BillTypes
{
    public const string Transport = "Transport";
    public const string Delivery = "Delivery";
    public const string Supplier = "Supplier";
    public const string Contractor = "Contractor";
    public const string Utility = "Utility";
    public const string Others = "Others";
}

public static class SecurityReferenceTypes
{
    public const string VisitorEntry = "VisitorEntry";
    public const string VehicleEntry = "VehicleEntry";
    public const string GatePass = "GatePass";
    public const string Chalan = "Chalan";
    public const string BillEntry = "BillEntry";
}

public static class CheckResults
{
    public const string Passed = "Passed";
    public const string Failed = "Failed";
    public const string Hold = "Hold";
}

public static class SecurityEventNames
{
    public const string VisitorCheckedIn = "VisitorCheckedIn";
    public const string VisitorCheckedOut = "VisitorCheckedOut";
    public const string EmployeeOutPassApproved = "EmployeeOutPassApproved";
    public const string GatePassApproved = "GatePassApproved";
    public const string GatePassIssued = "GatePassIssued";
    public const string GatePassCompleted = "GatePassCompleted";
    public const string ChalanApproved = "ChalanApproved";
    public const string BillEntryApproved = "BillEntryApproved";
    public const string BillEntrySentToAccounts = "BillEntrySentToAccounts";
    public const string VehicleEntered = "VehicleEntered";
    public const string VehicleExited = "VehicleExited";
}
