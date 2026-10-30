using MediatR;
using MerchandisingService.Contracts;

namespace MerchandisingService.Application;

public sealed record CreateBuyerContactCommand(CreateBuyerContactRequest Request) : IRequest<BuyerContactDto>;
public sealed record CreateBuyerPaymentTermCommand(CreateBuyerPaymentTermRequest Request) : IRequest<BuyerPaymentTermDto>;
public sealed record CreateBuyerComplianceRuleCommand(CreateBuyerComplianceRuleRequest Request) : IRequest<BuyerComplianceRuleDto>;
public sealed record CreateStyleVersionCommand(CreateStyleVersionRequest Request) : IRequest<StyleVersionDto>;
public sealed record CreateStyleBomItemCommand(CreateStyleBomItemRequest Request) : IRequest<StyleBomItemDto>;
public sealed record SubmitSampleCommand(Guid Id, SubmitSampleRequest Request) : IRequest<SampleDto>;
public sealed record ReviseSampleCommand(Guid Id, ReviseSampleRequest Request) : IRequest<SampleDto>;
public sealed record CreateSampleCostingCommand(Guid SampleId, CreateSampleCostingRequest Request) : IRequest<SampleCostingDto>;

public sealed record CreateQuotationCommand(CreateQuotationRequest Request) : IRequest<QuotationDto>;
public sealed record UpdateQuotationCommand(Guid Id, UpdateQuotationRequest Request) : IRequest<QuotationDto>;
public sealed record AddQuotationNegotiationCommand(Guid Id, AddQuotationNegotiationRequest Request) : IRequest<QuotationNegotiationDto>;
public sealed record ConvertQuotationToOrderCommand(Guid Id, ConvertQuotationToOrderRequest Request) : IRequest<OrderDto>;

public sealed record ConfirmOrderWithOptionsCommand(Guid Id, ConfirmOrderOptions Options) : IRequest<OrderDto>;
public sealed record CreateOrderAssignmentCommand(Guid OrderId, CreateOrderAssignmentRequest Request) : IRequest<OrderAssignmentDto>;
public sealed record CreateOrderCommercialTermsCommand(Guid OrderId, CreateOrderCommercialTermsRequest Request) : IRequest<OrderCommercialTermsDto>;
public sealed record CopyStyleBomToOrderCommand(Guid OrderId, CopyStyleBomToOrderRequest Request) : IRequest<IReadOnlyList<BomItemDto>>;
public sealed record SubmitCostingApprovalCommand(Guid OrderId, SubmitCostingApprovalRequest Request) : IRequest<OrderCostingDto>;
public sealed record CreateOrderTrimsMatrixCommand(Guid OrderId, CreateOrderTrimsMatrixRequest Request) : IRequest<OrderTrimsMatrixDto>;

public sealed record CreateTnaTemplateCommand(CreateTnaTemplateRequest Request) : IRequest<TnaTemplateDto>;
public sealed record GenerateTnaForOrderCommand(Guid OrderId) : IRequest<TnaCalendarDto>;
public sealed record UpdateTnaMilestoneCommand(Guid Id, UpdateTnaMilestoneRequest Request) : IRequest<TnaMilestoneDto>;
public sealed record LogTnaDelayCommand(Guid MilestoneId, LogTnaDelayRequest Request) : IRequest<TnaDelayLogDto>;

public sealed record CreateMaterialBookingCommand(CreateMaterialBookingRequest Request) : IRequest<MaterialBookingDto>;
public sealed record AutoCalculateBookingCommand(Guid BookingId, AutoCalculateBookingRequest Request) : IRequest<MaterialBookingDto>;
public sealed record CreateFabricBookingDetailCommand(Guid BookingId, CreateFabricBookingDetailRequest Request) : IRequest<FabricBookingDetailDto>;
public sealed record CreateTrimsBookingDetailCommand(Guid BookingId, CreateTrimsBookingDetailRequest Request) : IRequest<TrimsBookingDetailDto>;
public sealed record CreateBookingAllocationCommand(Guid BookingId, CreateBookingAllocationRequest Request) : IRequest<BookingAllocationDto>;

public sealed record CreatePurchaseRequisitionCommand(CreatePurchaseRequisitionRequest Request) : IRequest<PurchaseRequisitionDto>;
public sealed record SubmitPurchaseRequisitionCommand(Guid Id) : IRequest<PurchaseRequisitionDto>;
public sealed record GenerateRequisitionFromOrderCommand(Guid OrderId, CreatePurchaseRequisitionRequest Request) : IRequest<PurchaseRequisitionDto>;

public sealed record GetBuyerContactsQuery(Guid BuyerId) : IRequest<IReadOnlyList<BuyerContactDto>>;
public sealed record GetBuyerPaymentTermsQuery(Guid BuyerId) : IRequest<IReadOnlyList<BuyerPaymentTermDto>>;
public sealed record GetBuyerComplianceRulesQuery(Guid BuyerId) : IRequest<IReadOnlyList<BuyerComplianceRuleDto>>;
public sealed record GetQuotationNegotiationsQuery(Guid CompanyId, Guid QuotationId) : IRequest<IReadOnlyList<QuotationNegotiationDto>>;
public sealed record GetStyleVersionsQuery(Guid StyleId) : IRequest<IReadOnlyList<StyleVersionDto>>;
public sealed record GetStyleBomItemsQuery(Guid StyleId) : IRequest<IReadOnlyList<StyleBomItemDto>>;
public sealed record GetQuotationsQuery(Guid CompanyId, Guid? BuyerId) : IRequest<IReadOnlyList<QuotationDto>>;
public sealed record GetQuotationByIdQuery(Guid CompanyId, Guid Id) : IRequest<QuotationDto>;
public sealed record GetOrderWorksheetQuery(Guid OrderId) : IRequest<ProgramOrderWorksheetDto>;
public sealed record GetTnaCalendarByOrderQuery(Guid OrderId) : IRequest<TnaCalendarDto?>;
public sealed record GetMaterialBookingsQuery(Guid CompanyId, Guid? OrderId) : IRequest<IReadOnlyList<MaterialBookingDto>>;
public sealed record GetPurchaseRequisitionsQuery(Guid CompanyId, Guid? OrderId) : IRequest<IReadOnlyList<PurchaseRequisitionDto>>;
