using MediatR;
using SewingService.Contracts;

namespace SewingService.Application;

public sealed record GetSewingLinesQuery(Guid CompanyId, int Page = 1, int PageSize = 50) : IRequest<IReadOnlyList<SewingLineDto>>;
public sealed record GetSewingLineByIdQuery(Guid Id) : IRequest<SewingLineDto>;

public sealed record GetProductionAssignmentsQuery(Guid CompanyId, Guid? OrderId, int Page = 1, int PageSize = 50) : IRequest<IReadOnlyList<ProductionAssignmentDto>>;
public sealed record GetProductionAssignmentByIdQuery(Guid Id) : IRequest<ProductionAssignmentDto>;

public sealed record GetProductionTargetsQuery(Guid CompanyId, Guid? AssignmentId, DateOnly? Date) : IRequest<IReadOnlyList<ProductionTargetDto>>;

public sealed record GetDailyProductionRecordQuery(Guid AssignmentId, DateOnly RecordDate) : IRequest<DailyProductionRecordDto?>;
public sealed record GetDailyReportQuery(Guid CompanyId, DateOnly Date, Guid? LineId) : IRequest<IReadOnlyList<DailyReportRowDto>>;
public sealed record GetMonthlyReportQuery(Guid CompanyId, int Year, int Month, Guid? LineId) : IRequest<IReadOnlyList<MonthlyReportRowDto>>;

public sealed record GetSewingOutputsQuery(Guid CompanyId, Guid? OrderId, int Page = 1, int PageSize = 50) : IRequest<IReadOnlyList<SewingOutputDto>>;
public sealed record GetSewingOutputByIdQuery(Guid Id, Guid CompanyId) : IRequest<SewingOutputSnapshotDto>;
public sealed record GetSewingOutputQuantityQuery(Guid CompanyId, Guid OrderId, string? Color, string Size) : IRequest<int>;
public sealed record GetOrderSewingBalanceQuery(Guid CompanyId, Guid OrderId) : IRequest<int>;
public sealed record GetSewingBalancesQuery(Guid CompanyId, Guid? OrderId) : IRequest<IReadOnlyList<SewingBalanceDto>>;
