using MediatR;
using MerchandisingService.Contracts;

namespace MerchandisingService.Application;

public sealed record CreateStyleDocumentCommand(CreateStyleDocumentRequest Request) : IRequest<StyleDocumentDto>;
public sealed record CreateOrderDocumentCommand(CreateOrderDocumentRequest Request) : IRequest<OrderDocumentDto>;
public sealed record GetStyleDocumentsQuery(Guid CompanyId, Guid StyleId) : IRequest<IReadOnlyList<StyleDocumentDto>>;
public sealed record GetOrderDocumentsQuery(Guid CompanyId, Guid OrderId) : IRequest<IReadOnlyList<OrderDocumentDto>>;

public sealed record CreateCommunicationLogCommand(CreateCommunicationLogRequest Request) : IRequest<CommunicationLogDto>;
public sealed record GetCommunicationLogsQuery(Guid CompanyId, Guid? StyleId, Guid? OrderId) : IRequest<IReadOnlyList<CommunicationLogDto>>;

public sealed record CreateApprovalRequestCommand(CreateApprovalRequestRequest Request) : IRequest<ApprovalRequestDto>;
public sealed record ApproveStepCommand(Guid RequestId, Guid StepId, ApproveStepRequest Request) : IRequest<ApprovalRequestDto>;
public sealed record RejectStepCommand(Guid RequestId, Guid StepId, RejectStepRequest Request) : IRequest<ApprovalRequestDto>;
public sealed record GetApprovalRequestQuery(Guid CompanyId, Guid Id) : IRequest<ApprovalRequestDto>;
public sealed record GetPendingApprovalsQuery(Guid CompanyId) : IRequest<IReadOnlyList<ApprovalRequestDto>>;

public sealed record CreateShipmentExecutionCommand(CreateShipmentExecutionRequest Request) : IRequest<ShipmentExecutionDto>;
public sealed record CreatePackingListCommand(CreatePackingListRequest Request) : IRequest<PackingListDto>;
public sealed record GetShipmentExecutionQuery(Guid CompanyId, Guid ShipmentPlanId) : IRequest<ShipmentExecutionDto?>;

public sealed record GetTnaDelayReportQuery(Guid CompanyId) : IRequest<IReadOnlyList<TnaDelayReportRowDto>>;
public sealed record GetBookingStatusReportQuery(Guid CompanyId, Guid? OrderId) : IRequest<IReadOnlyList<BookingStatusReportRowDto>>;
public sealed record GetOrderPipelineReportQuery(Guid CompanyId) : IRequest<IReadOnlyList<OrderPipelineReportRowDto>>;
