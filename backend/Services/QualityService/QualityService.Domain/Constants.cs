namespace QualityService.Domain;

public static class QualityCheckpointTypes
{
    public const string FabricInspection = "FabricInspection";
    public const string CuttingQC = "CuttingQC";
    public const string InlineQC = "InlineQC";
    public const string EndlineQC = "EndlineQC";
    public const string FinishingQC = "FinishingQC";
    public const string FinalInspection = "FinalInspection";
    public const string ShipmentInspection = "ShipmentInspection";
}

public static class DefectSeverities
{
    public const string Critical = "Critical";
    public const string Major = "Major";
    public const string Minor = "Minor";
}

public static class QualityInspectionTypes
{
    public const string Fabric = "Fabric";
    public const string Cutting = "Cutting";
    public const string Inline = "Inline";
    public const string Endline = "Endline";
    public const string Finishing = "Finishing";
    public const string Final = "Final";
    public const string Shipment = "Shipment";
}

public static class QualityInspectionResults
{
    public const string Pending = "Pending";
    public const string Passed = "Passed";
    public const string Failed = "Failed";
    public const string Hold = "Hold";
    public const string RecheckRequired = "RecheckRequired";
}

public static class QualityInspectionStatuses
{
    public const string Draft = "Draft";
    public const string Submitted = "Submitted";
    public const string Approved = "Approved";
    public const string Cancelled = "Cancelled";
}

public static class QualityReworkStatuses
{
    public const string Pending = "Pending";
    public const string Sent = "Sent";
    public const string Completed = "Completed";
    public const string Cancelled = "Cancelled";
}

public static class QualityRejectStatuses
{
    public const string Created = "Created";
    public const string Cancelled = "Cancelled";
}

public static class QualityRoles
{
    public const string SuperAdmin = "SuperAdmin";
    public const string GroupAdmin = "GroupAdmin";
    public const string CompanyAdmin = "CompanyAdmin";
    public const string QualityManager = "QualityManager";
    public const string QualityOfficer = "QualityOfficer";
    public const string ProductionManager = "ProductionManager";
    public const string FinishingManager = "FinishingManager";
    public const string ShipmentOfficer = "ShipmentOfficer";
    public const string Auditor = "Auditor";
    public const string Viewer = "Viewer";
}

public static class QualityPermissions
{
    public const string CheckpointManage = "QUALITY_CHECKPOINT_MANAGE";
    public const string DefectManage = "DEFECT_MANAGE";
    public const string InspectionCreate = "QUALITY_INSPECTION_CREATE";
    public const string InspectionApprove = "QUALITY_INSPECTION_APPROVE";
    public const string ReworkCreate = "QUALITY_REWORK_CREATE";
    public const string RejectCreate = "QUALITY_REJECT_CREATE";
    public const string FinalInspectionCreate = "FINAL_INSPECTION_CREATE";
    public const string FinalInspectionApprove = "FINAL_INSPECTION_APPROVE";
    public const string ReportView = "QUALITY_REPORT_VIEW";
    public const string ReportExport = "QUALITY_REPORT_EXPORT";
}

public static class CacheKeys
{
    public static string Checkpoint(Guid companyId, Guid checkpointId) => $"quality:checkpoints:{companyId}:{checkpointId}";
    public static string AqlStandard(Guid companyId, int lotSize) => $"quality:aql:{companyId}:{lotSize}";
    public static string Inspection(Guid companyId, Guid inspectionId) => $"quality:inspections:{companyId}:{inspectionId}";
}
