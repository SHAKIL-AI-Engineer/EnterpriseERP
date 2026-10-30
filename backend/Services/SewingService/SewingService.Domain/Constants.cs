namespace SewingService.Domain;

public static class SewingLineStatuses
{
    public const string Active = "Active";
    public const string Inactive = "Inactive";
}

public static class AssignmentStatuses
{
    public const string Draft = "Draft";
    public const string Active = "Active";
    public const string Closed = "Closed";
    public const string Cancelled = "Cancelled";
}

public static class PanelReceiptStatuses
{
    public const string Draft = "Draft";
    public const string Received = "Received";
    public const string Cancelled = "Cancelled";
}

public static class SewingOutputStatuses
{
    public const string Created = "Created";
    public const string ApprovedOverage = "ApprovedOverage";
}

public static class SewingRoles
{
    public const string SuperAdmin = "SuperAdmin";
    public const string GroupAdmin = "GroupAdmin";
    public const string CompanyAdmin = "CompanyAdmin";
    public const string ProductionManager = "ProductionManager";
    public const string SewingManager = "SewingManager";
    public const string SewingOfficer = "SewingOfficer";
    public const string CuttingManager = "CuttingManager";
    public const string Auditor = "Auditor";
    public const string Viewer = "Viewer";
}

public static class SewingPermissions
{
    public const string LineManage = "SEWING_LINE_MANAGE";
    public const string AssignmentManage = "SEWING_ASSIGNMENT_MANAGE";
    public const string TargetManage = "SEWING_TARGET_MANAGE";
    public const string DailyRecordManage = "SEWING_DAILY_RECORD_MANAGE";
    public const string OutputCreate = "SEWING_OUTPUT_CREATE";
    public const string PanelReceive = "SEWING_PANEL_RECEIVE";
    public const string BalanceView = "SEWING_BALANCE_VIEW";
    public const string ReportView = "SEWING_REPORT_VIEW";
}
