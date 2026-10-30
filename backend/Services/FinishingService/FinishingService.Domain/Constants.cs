namespace FinishingService.Domain;

public static class FinishingReceiveStatuses
{
    public const string Draft = "Draft";
    public const string Confirmed = "Confirmed";
    public const string Cancelled = "Cancelled";
}

public static class FinishingBatchStatuses
{
    public const string Draft = "Draft";
    public const string Running = "Running";
    public const string Completed = "Completed";
    public const string Cancelled = "Cancelled";
}

public static class CartonPackingStatuses
{
    public const string Open = "Open";
    public const string Closed = "Closed";
    public const string Transferred = "Transferred";
    public const string Cancelled = "Cancelled";
}

public static class FinishedGoodsTransferStatuses
{
    public const string Draft = "Draft";
    public const string Confirmed = "Confirmed";
    public const string Cancelled = "Cancelled";
}

public static class FinishingRoles
{
    public const string SuperAdmin = "SuperAdmin";
    public const string GroupAdmin = "GroupAdmin";
    public const string CompanyAdmin = "CompanyAdmin";
    public const string FinishingManager = "FinishingManager";
    public const string FinishingOfficer = "FinishingOfficer";
    public const string QualityOfficer = "QualityOfficer";
    public const string StoreManager = "StoreManager";
    public const string ShipmentOfficer = "ShipmentOfficer";
    public const string Auditor = "Auditor";
    public const string Viewer = "Viewer";
}

public static class FinishingPermissions
{
    public const string ReceiveCreate = "FINISHING_RECEIVE_CREATE";
    public const string ReceiveConfirm = "FINISHING_RECEIVE_CONFIRM";
    public const string BatchCreate = "FINISHING_BATCH_CREATE";
    public const string InputCreate = "FINISHING_INPUT_CREATE";
    public const string IroningCreate = "IRONING_OUTPUT_CREATE";
    public const string QCCreate = "FINISHING_QC_CREATE";
    public const string CartonCreate = "CARTON_PACKING_CREATE";
    public const string CartonClose = "CARTON_PACKING_CLOSE";
    public const string TransferCreate = "FINISHED_GOODS_TRANSFER_CREATE";
    public const string TransferConfirm = "FINISHED_GOODS_TRANSFER_CONFIRM";
    public const string WastageCreate = "FINISHING_WASTAGE_CREATE";
    public const string BalanceView = "FINISHING_BALANCE_VIEW";
    public const string ReportView = "FINISHING_REPORT_VIEW";
    public const string ReportExport = "FINISHING_REPORT_EXPORT";
}
