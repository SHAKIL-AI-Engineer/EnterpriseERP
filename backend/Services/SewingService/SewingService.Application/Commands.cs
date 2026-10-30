using MediatR;
using SewingService.Contracts;

namespace SewingService.Application;

public sealed record CreateSewingLineCommand(CreateSewingLineRequest Request) : IRequest<SewingLineDto>;
public sealed record UpdateSewingLineCommand(Guid Id, UpdateSewingLineRequest Request) : IRequest<SewingLineDto>;
public sealed record DeleteSewingLineCommand(Guid Id) : IRequest<Unit>;

public sealed record CreateProductionAssignmentCommand(CreateProductionAssignmentRequest Request) : IRequest<ProductionAssignmentDto>;
public sealed record UpdateProductionAssignmentCommand(Guid Id, UpdateProductionAssignmentRequest Request) : IRequest<ProductionAssignmentDto>;
public sealed record DeleteProductionAssignmentCommand(Guid Id) : IRequest<Unit>;
public sealed record ActivateProductionAssignmentCommand(Guid Id) : IRequest<ProductionAssignmentDto>;

public sealed record SaveProductionTargetCommand(SaveProductionTargetRequest Request) : IRequest<ProductionTargetDto>;
public sealed record DeleteProductionTargetCommand(Guid Id) : IRequest<Unit>;

public sealed record SaveDailyProductionRecordCommand(SaveDailyProductionRecordRequest Request) : IRequest<DailyProductionRecordDto>;
public sealed record DeleteDailyProductionRecordCommand(Guid AssignmentId, DateOnly RecordDate) : IRequest<Unit>;

public sealed record CreateSewingOutputCommand(CreateSewingOutputRequest Request) : IRequest<SewingOutputDto>;
public sealed record ReceivePanelTransferCommand(ReceivePanelTransferRequest Request) : IRequest<PanelTransferReceiptDto>;
public sealed record ReceivePanelTransferLegacyCommand(PanelTransferReceiveLegacyRequest Request) : IRequest<PanelTransferReceiptDto>;
