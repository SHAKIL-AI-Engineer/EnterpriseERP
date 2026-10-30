namespace MerchandisingService.Contracts;

public sealed record MasterDataDto(Guid Id, Guid CompanyId, string Code, string Name, bool IsActive, string? Extra = null);

public sealed record BuyerContactDto(Guid Id, Guid CompanyId, Guid BuyerId, string Name, string? Email, string? Phone, string? Role);
public sealed record BuyerPaymentTermDto(Guid Id, Guid CompanyId, Guid BuyerId, string TermName, int Days, string? Description);
public sealed record BuyerComplianceRuleDto(Guid Id, Guid CompanyId, Guid BuyerId, string RuleName, string RuleType, string? Description, bool IsMandatory);
public sealed record StyleVersionDto(Guid Id, Guid CompanyId, Guid StyleId, int VersionNo, string? Description, DateOnly EffectiveDate);
public sealed record StyleBomItemDto(Guid Id, Guid CompanyId, Guid StyleId, string ItemType, string? ItemCode, string ItemName, string UnitName, decimal Consumption, decimal WastagePercent, decimal UnitPrice);

public sealed record SampleCostingDto(Guid Id, Guid CompanyId, Guid SampleId, decimal FabricCost, decimal TrimsCost, decimal CMCost, decimal TotalCost);
public sealed record QuotationLineDto(Guid Id, Guid CompanyId, Guid QuotationId, string ItemDescription, int Quantity, decimal UnitPrice, decimal LineTotal);
public sealed record QuotationNegotiationDto(Guid Id, Guid CompanyId, Guid QuotationId, int RoundNo, decimal ProposedAmount, decimal? CounterAmount, string? Notes, DateTime NegotiatedAt);
public sealed record QuotationDto(Guid Id, Guid CompanyId, Guid BuyerId, Guid StyleId, string QuotationNo, DateOnly QuotationDate, DateOnly? ValidUntil, string Status, decimal TotalAmount, IReadOnlyList<QuotationLineDto>? Lines = null);

public sealed record OrderAssignmentDto(Guid Id, Guid CompanyId, Guid OrderId, string AssignedTo, string Role, DateTime AssignedAt);
public sealed record OrderCommercialTermsDto(Guid Id, Guid CompanyId, Guid OrderId, string? PaymentTerms, string? Incoterms, string? LCBank, decimal Commission);
public sealed record OrderTrimsMatrixDto(Guid Id, Guid CompanyId, Guid OrderId, string TrimsType, string ColorName, string SizeName, int Quantity);

public sealed record ProgramSizeBreakdownWorksheetDto(string SizeName, int Quantity, string BuyerPackingNumber = "");
public sealed record ProgramColorWorksheetDto(string ColorName, IReadOnlyList<ProgramSizeBreakdownWorksheetDto> SizeBreakdowns);
public sealed record ProgramArticleWorksheetDto(string StyleNo, string? StyleName, int TotalQty, IReadOnlyList<ProgramColorWorksheetDto> Colors);
public sealed record ProgramOrderWorksheetDto(
    Guid Id,
    Guid CompanyId,
    string ProgramNumber,
    string BuyerName,
    string? CustomerName,
    string? FabricDescription,
    string? ProgramName,
    DateOnly OrderDate,
    string OrderStatus,
    IReadOnlyList<ProgramArticleWorksheetDto> Articles);

public sealed record TnaTemplateDto(Guid Id, Guid CompanyId, string TemplateName, string? Description, bool IsDefault);
public sealed record TnaMilestoneDto(Guid Id, Guid CompanyId, Guid? TnaCalendarId, string MilestoneName, int SequenceNo, DateOnly PlannedDate, DateOnly? ActualDate, string Status);
public sealed record TnaDelayLogDto(Guid Id, Guid CompanyId, Guid TnaMilestoneId, int DelayDays, string Reason, DateTime LoggedAt);
public sealed record TnaCalendarDto(Guid Id, Guid CompanyId, Guid OrderId, Guid? TemplateId, DateOnly StartDate, DateOnly? EndDate, string Status, IReadOnlyList<TnaMilestoneDto>? Milestones = null);

public sealed record FabricBookingDetailDto(Guid Id, Guid CompanyId, Guid MaterialBookingId, Guid? FabricTypeId, string ColorName, decimal RequiredQty, decimal BookedQty, Guid? SupplierId);
public sealed record TrimsBookingDetailDto(Guid Id, Guid CompanyId, Guid MaterialBookingId, Guid? TrimsTypeId, string ItemName, decimal RequiredQty, decimal BookedQty, Guid? SupplierId);
public sealed record BookingAllocationDto(Guid Id, Guid CompanyId, Guid MaterialBookingId, Guid DetailId, string DetailType, decimal AllocatedQty, DateOnly AllocationDate);
public sealed record MaterialBookingDto(Guid Id, Guid CompanyId, Guid OrderId, string BookingNo, string BookingType, string Status, decimal TotalQty);

public sealed record RequisitionLineDto(Guid Id, Guid CompanyId, Guid RequisitionId, string ItemType, string? ItemCode, string ItemName, decimal RequiredQty, string UnitName, string Status);
public sealed record PurchaseRequisitionDto(Guid Id, Guid CompanyId, Guid? OrderId, string RequisitionNo, string Status, DateOnly RequestedDate, IReadOnlyList<RequisitionLineDto>? Lines = null);
