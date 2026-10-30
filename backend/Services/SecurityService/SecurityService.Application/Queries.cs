using MediatR;
using SecurityService.Contracts;

namespace SecurityService.Application;

public sealed record GetGatesQuery(Guid CompanyId) : IRequest<IReadOnlyList<GateDto>>;
public sealed record GetVisitorsQuery(Guid CompanyId, string? Phone) : IRequest<IReadOnlyList<VisitorDto>>;
public sealed record GetVisitorByIdQuery(Guid Id) : IRequest<VisitorDto?>;
public sealed record GetVisitorEntriesQuery(Guid CompanyId, DateOnly? Date) : IRequest<IReadOnlyList<VisitorEntryDto>>;
public sealed record GetVisitorEntryByIdQuery(Guid Id) : IRequest<VisitorEntryDto?>;
public sealed record GetEmployeeOutPassesQuery(Guid CompanyId, Guid? EmployeeId, DateOnly? Date) : IRequest<IReadOnlyList<EmployeeOutPassDto>>;
public sealed record GetVehiclesQuery(Guid CompanyId) : IRequest<IReadOnlyList<VehicleDto>>;
public sealed record GetVehicleEntriesQuery(Guid CompanyId, DateOnly? Date) : IRequest<IReadOnlyList<VehicleEntryDto>>;
public sealed record GetGatePassesQuery(Guid CompanyId, string? Type, string? Status, DateOnly? FromDate, DateOnly? ToDate) : IRequest<IReadOnlyList<GatePassDto>>;
public sealed record GetGatePassByIdQuery(Guid Id) : IRequest<GatePassDto?>;
public sealed record GetReturnableGatePassReturnsQuery(Guid CompanyId, Guid? GatePassId) : IRequest<IReadOnlyList<ReturnableGatePassReturnDto>>;
public sealed record GetChalansQuery(Guid CompanyId, string? Type, DateOnly? FromDate, DateOnly? ToDate) : IRequest<IReadOnlyList<ChalanDto>>;
public sealed record GetChalanByIdQuery(Guid Id) : IRequest<ChalanDto?>;
public sealed record GetBillEntriesQuery(Guid CompanyId, DateOnly? FromDate, DateOnly? ToDate) : IRequest<IReadOnlyList<BillEntryDto>>;
public sealed record GetBillEntryByIdQuery(Guid Id) : IRequest<BillEntryDto?>;
public sealed record GetSecurityChecksQuery(Guid CompanyId, string? ReferenceType, Guid? ReferenceId) : IRequest<IReadOnlyList<SecurityCheckLogDto>>;

public sealed record GetDailyGateRegisterQuery(Guid CompanyId, DateOnly Date) : IRequest<DailyGateRegisterDto>;
public sealed record GetVisitorReportQuery(Guid CompanyId, DateOnly FromDate, DateOnly ToDate) : IRequest<IReadOnlyList<VisitorEntryDto>>;
public sealed record GetMaterialInOutReportQuery(Guid CompanyId, DateOnly FromDate, DateOnly ToDate) : IRequest<MaterialInOutReportDto>;
public sealed record GetVehicleReportQuery(Guid CompanyId, DateOnly FromDate, DateOnly ToDate) : IRequest<IReadOnlyList<VehicleEntryDto>>;
public sealed record GetReturnablePendingReportQuery(Guid CompanyId) : IRequest<IReadOnlyList<ReturnablePendingDto>>;
