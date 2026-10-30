namespace MerchandisingService.Contracts;

public sealed record CreateMasterDataRequest(Guid CompanyId, string Code, string Name, string? Extra = null);
public sealed record UpdateMasterDataRequest(string Name, bool IsActive, string? Extra = null);

public sealed record CreateBuyerContactRequest(Guid CompanyId, Guid BuyerId, string Name, string? Email, string? Phone, string? Role);
public sealed record UpdateBuyerContactRequest(string Name, string? Email, string? Phone, string? Role);
public sealed record CreateBuyerPaymentTermRequest(Guid CompanyId, Guid BuyerId, string TermName, int Days, string? Description);
public sealed record CreateBuyerComplianceRuleRequest(Guid CompanyId, Guid BuyerId, string RuleName, string RuleType, string? Description, bool IsMandatory);

public sealed record CreateStyleVersionRequest(Guid CompanyId, Guid StyleId, int VersionNo, string? Description, DateOnly EffectiveDate);
public sealed record CreateStyleBomItemRequest(Guid CompanyId, Guid StyleId, string ItemType, string? ItemCode, string ItemName, string UnitName, decimal Consumption, decimal WastagePercent, decimal UnitPrice);

public sealed record SubmitSampleRequest(DateOnly SubmitDate, string? Remarks);
public sealed record ReviseSampleRequest(string? Remarks);
public sealed record CreateSampleCostingRequest(Guid CompanyId, decimal FabricCost, decimal TrimsCost, decimal CMCost);

public sealed record CreateQuotationRequest(Guid CompanyId, Guid BuyerId, Guid StyleId, string QuotationNo, DateOnly QuotationDate, DateOnly? ValidUntil, IReadOnlyList<CreateQuotationLineRequest> Lines);
public sealed record CreateQuotationLineRequest(string ItemDescription, int Quantity, decimal UnitPrice);
public sealed record UpdateQuotationRequest(DateOnly? ValidUntil, string Status);
public sealed record AddQuotationNegotiationRequest(decimal ProposedAmount, decimal? CounterAmount, string? Notes);
public sealed record ConvertQuotationToOrderRequest(string OrderNo, DateOnly OrderDate, int TotalOrderQty, decimal UnitPrice, string CurrencyCode = "USD");

public sealed record CreateOrderAssignmentRequest(Guid CompanyId, string AssignedTo, string Role);
public sealed record CreateOrderCommercialTermsRequest(Guid CompanyId, string? PaymentTerms, string? Incoterms, string? LCBank, decimal Commission);

public sealed record CopyStyleBomToOrderRequest(Guid CompanyId);
public sealed record SubmitCostingApprovalRequest(string? Notes);
public sealed record CreateOrderTrimsMatrixRequest(Guid CompanyId, string TrimsType, string ColorName, string SizeName, int Quantity);

public sealed record CreateTnaTemplateRequest(Guid CompanyId, string TemplateName, string? Description, bool IsDefault, IReadOnlyList<CreateTnaMilestoneTemplateRequest>? Milestones);
public sealed record CreateTnaMilestoneTemplateRequest(string MilestoneName, int SequenceNo, int DaysFromStart);
public sealed record UpdateTnaMilestoneRequest(DateOnly? ActualDate, string Status);
public sealed record LogTnaDelayRequest(Guid CompanyId, int DelayDays, string Reason);

public sealed record CreateMaterialBookingRequest(Guid CompanyId, Guid OrderId, string BookingNo, string BookingType);
public sealed record AutoCalculateBookingRequest(Guid CompanyId);
public sealed record CreateFabricBookingDetailRequest(Guid CompanyId, Guid? FabricTypeId, string ColorName, decimal RequiredQty, Guid? SupplierId);
public sealed record CreateTrimsBookingDetailRequest(Guid CompanyId, Guid? TrimsTypeId, string ItemName, decimal RequiredQty, Guid? SupplierId);
public sealed record CreateBookingAllocationRequest(Guid CompanyId, Guid DetailId, string DetailType, decimal AllocatedQty, DateOnly AllocationDate);

public sealed record CreatePurchaseRequisitionRequest(Guid CompanyId, Guid? OrderId, string RequisitionNo, DateOnly RequestedDate, IReadOnlyList<CreateRequisitionLineRequest>? Lines);
public sealed record CreateRequisitionLineRequest(string ItemType, string? ItemCode, string ItemName, decimal RequiredQty, string UnitName);
public sealed record SubmitRequisitionRequest();

public sealed record ConfirmOrderOptions(bool GenerateTna = true, bool CreateRequisition = false);
