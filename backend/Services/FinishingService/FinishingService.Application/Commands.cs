using FinishingService.Contracts;
using MediatR;

namespace FinishingService.Application;

public sealed record CreateFinishingReceiveCommand(CreateFinishingReceiveRequest Request) : IRequest<FinishingReceiveDto>;
public sealed record ConfirmFinishingReceiveCommand(Guid Id, Guid? ConfirmedBy) : IRequest<FinishingReceiveDto>;
public sealed record CancelFinishingReceiveCommand(Guid Id, Guid? CancelledBy) : IRequest<FinishingReceiveDto>;

public sealed record CreateFinishingBatchCommand(CreateFinishingBatchRequest Request) : IRequest<FinishingBatchDto>;
public sealed record StartFinishingBatchCommand(Guid Id, Guid? StartedBy) : IRequest<FinishingBatchDto>;
public sealed record CompleteFinishingBatchCommand(Guid Id, Guid? CompletedBy) : IRequest<FinishingBatchDto>;
public sealed record CancelFinishingBatchCommand(Guid Id, Guid? CancelledBy) : IRequest<FinishingBatchDto>;

public sealed record CreateFinishingInputCommand(CreateFinishingInputRequest Request) : IRequest<FinishingInputDto>;
public sealed record CreateIroningOutputCommand(CreateIroningOutputRequest Request) : IRequest<IroningOutputDto>;
public sealed record CreateFinishingQCCommand(CreateFinishingQCRequest Request) : IRequest<FinishingQCDto>;
public sealed record CreateFoldingPackingCommand(CreateFoldingPackingRequest Request) : IRequest<FoldingPackingDto>;

public sealed record CreateCartonPackingCommand(CreateCartonPackingRequest Request) : IRequest<CartonPackingDto>;
public sealed record CloseCartonPackingCommand(Guid Id, Guid? ClosedBy) : IRequest<CartonPackingDto>;
public sealed record CancelCartonPackingCommand(Guid Id, Guid? CancelledBy) : IRequest<CartonPackingDto>;

public sealed record CreateFinishedGoodsTransferCommand(CreateFinishedGoodsTransferRequest Request) : IRequest<FinishedGoodsTransferDto>;
public sealed record ConfirmFinishedGoodsTransferCommand(Guid Id, Guid? ConfirmedBy) : IRequest<FinishedGoodsTransferDto>;
public sealed record CancelFinishedGoodsTransferCommand(Guid Id, Guid? CancelledBy) : IRequest<FinishedGoodsTransferDto>;

public sealed record CreateFinishingWastageCommand(CreateFinishingWastageRequest Request) : IRequest<FinishingWastageDto>;
public sealed record ExportFinishingReportCommand(FinishingReportExportRequest Request, string? BearerToken) : IRequest<ReportExportFile>;
