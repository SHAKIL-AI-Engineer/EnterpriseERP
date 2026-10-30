using FinishingService.Contracts;
using MediatR;

namespace FinishingService.Application;

public sealed record GetFinishingReceivesQuery(Guid CompanyId, Guid? OrderId, string? Status) : IRequest<IReadOnlyList<FinishingReceiveDto>>;
public sealed record GetFinishingReceiveByIdQuery(Guid Id) : IRequest<FinishingReceiveDto>;
public sealed record GetFinishingReceiveQuantityQuery(Guid CompanyId, Guid OrderId, string? Color, string Size) : IRequest<int>;

public sealed record GetFinishingBatchesQuery(Guid CompanyId, Guid? OrderId, string? Status) : IRequest<IReadOnlyList<FinishingBatchDto>>;
public sealed record GetFinishingBatchByIdQuery(Guid Id) : IRequest<FinishingBatchDto>;

public sealed record GetFinishingInputsQuery(Guid CompanyId, Guid? OrderId, Guid? BatchId) : IRequest<IReadOnlyList<FinishingInputDto>>;
public sealed record GetIroningOutputsQuery(Guid CompanyId, Guid? OrderId, Guid? BatchId) : IRequest<IReadOnlyList<IroningOutputDto>>;
public sealed record GetFinishingQCsQuery(Guid CompanyId, Guid? OrderId, Guid? BatchId) : IRequest<IReadOnlyList<FinishingQCDto>>;
public sealed record GetFoldingPackingsQuery(Guid CompanyId, Guid? OrderId, Guid? BatchId) : IRequest<IReadOnlyList<FoldingPackingDto>>;

public sealed record GetCartonPackingsQuery(Guid CompanyId, Guid? OrderId, Guid? BuyerPurchaseOrderId, string? Status) : IRequest<IReadOnlyList<CartonPackingDto>>;
public sealed record GetCartonPackingByIdQuery(Guid Id) : IRequest<CartonPackingDto>;

public sealed record GetFinishedGoodsTransfersQuery(Guid CompanyId, Guid? OrderId, string? Status) : IRequest<IReadOnlyList<FinishedGoodsTransferDto>>;
public sealed record GetFinishedGoodsTransferByIdQuery(Guid Id) : IRequest<FinishedGoodsTransferDto>;

public sealed record GetFinishingWastagesQuery(Guid CompanyId, Guid? OrderId, Guid? BatchId) : IRequest<IReadOnlyList<FinishingWastageDto>>;
public sealed record GetFinishingBalancesQuery(Guid CompanyId, Guid? OrderId) : IRequest<IReadOnlyList<FinishingBalanceDto>>;

public sealed record GetDailyFinishingProductionReportQuery(Guid CompanyId, DateOnly Date) : IRequest<IReadOnlyList<FinishingReportRowDto>>;
public sealed record GetOrderFinishingSummaryReportQuery(Guid CompanyId, Guid OrderId) : IRequest<IReadOnlyList<FinishingReportRowDto>>;
public sealed record GetFinishingReportQuery(Guid CompanyId, Guid? OrderId, string ReportType, DateOnly? FromDate, DateOnly? ToDate) : IRequest<IReadOnlyList<FinishingReportRowDto>>;
