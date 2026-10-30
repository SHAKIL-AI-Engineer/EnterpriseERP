namespace ProductionPlanningService.Domain;

public static class LinePlanStatuses
{
    public const string Planned = "Planned";
    public const string Approved = "Approved";
    public const string Cancelled = "Cancelled";
}

public static class PlanningRoles
{
    public const string SuperAdmin = "SuperAdmin";
    public const string CompanyAdmin = "CompanyAdmin";
    public const string ProductionManager = "ProductionManager";
    public const string SewingManager = "SewingManager";
    public const string Viewer = "Viewer";
}

public static class PlanningPermissions
{
    public const string PlanManage = "PRODUCTION_PLAN_MANAGE";
    public const string PlanApprove = "PRODUCTION_PLAN_APPROVE";
    public const string BalanceView = "PRODUCTION_PLAN_BALANCE_VIEW";
    public const string ReportView = "PRODUCTION_PLAN_REPORT_VIEW";
}
