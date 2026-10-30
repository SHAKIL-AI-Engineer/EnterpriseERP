namespace ShipmentService.Domain;

public static class ShipmentExecutionStatuses
{
    public const string Planned = "Planned";
    public const string Ready = "Ready";
    public const string Shipped = "Shipped";
    public const string Cancelled = "Cancelled";
}

public static class ShipmentRoles
{
    public const string SuperAdmin = "SuperAdmin";
    public const string CompanyAdmin = "CompanyAdmin";
    public const string ShipmentManager = "ShipmentManager";
    public const string Merchandiser = "Merchandiser";
    public const string Viewer = "Viewer";
}

public static class ShipmentPermissions
{
    public const string ExecutionManage = "SHIPMENT_EXECUTION_MANAGE";
    public const string ReportView = "SHIPMENT_REPORT_VIEW";
}
