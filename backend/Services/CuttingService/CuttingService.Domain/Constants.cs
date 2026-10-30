namespace CuttingService.Domain;

public static class CuttingPlanStatuses
{
    public const string Draft = "Draft";
    public const string Approved = "Approved";
    public const string Running = "Running";
    public const string Completed = "Completed";
    public const string Cancelled = "Cancelled";
}

public static class FabricIssueStatuses
{
    public const string Received = "Received";
    public const string Consumed = "Consumed";
}

public static class CuttingLayStatuses
{
    public const string Open = "Open";
    public const string Closed = "Closed";
}

public static class CuttingOutputStatuses
{
    public const string Created = "Created";
    public const string ApprovedOverage = "ApprovedOverage";
}

public static class PanelTransferStatuses
{
    public const string Draft = "Draft";
    public const string Confirmed = "Confirmed";
    public const string Cancelled = "Cancelled";
}

public static class BundleStatuses
{
    public const string Ready = "Ready";
    public const string Sent = "Sent";
    public const string Review = "Review";
    public const string Cancelled = "Cancelled";
}

public static class CuttingRoles
{
    public const string SuperAdmin = "SuperAdmin";
    public const string GroupAdmin = "GroupAdmin";
    public const string CompanyAdmin = "CompanyAdmin";
    public const string CuttingManager = "CuttingManager";
    public const string CuttingOfficer = "CuttingOfficer";
    public const string StoreManager = "StoreManager";
    public const string ProductionManager = "ProductionManager";
    public const string Auditor = "Auditor";
    public const string Viewer = "Viewer";
}

public static class CuttingPermissions
{
    public const string PlanCreate = "CUTTING_PLAN_CREATE";
    public const string PlanApprove = "CUTTING_PLAN_APPROVE";
    public const string PlanUpdate = "CUTTING_PLAN_UPDATE";
    public const string OutputCreate = "CUTTING_OUTPUT_CREATE";
    public const string WastageCreate = "CUTTING_WASTAGE_CREATE";
    public const string TransferCreate = "CUTTING_TRANSFER_CREATE";
    public const string TransferConfirm = "CUTTING_TRANSFER_CONFIRM";
    public const string BalanceView = "CUTTING_BALANCE_VIEW";
    public const string ReportView = "CUTTING_REPORT_VIEW";
    public const string BundleManage = "CUTTING_BUNDLE_MANAGE";
}
