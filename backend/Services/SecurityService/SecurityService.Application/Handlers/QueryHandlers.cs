using AutoMapper;
using MediatR;
using Microsoft.EntityFrameworkCore;
using SecurityService.Contracts;

namespace SecurityService.Application.Handlers;

public sealed class QueryHandlers(ISecurityDbContext db, IMapper mapper, IRedisCacheService cache, IReportDataBuilderService reports)
    : IRequestHandler<GetGatesQuery, IReadOnlyList<GateDto>>,
      IRequestHandler<GetVisitorsQuery, IReadOnlyList<VisitorDto>>,
      IRequestHandler<GetVisitorByIdQuery, VisitorDto?>,
      IRequestHandler<GetVisitorEntriesQuery, IReadOnlyList<VisitorEntryDto>>,
      IRequestHandler<GetVisitorEntryByIdQuery, VisitorEntryDto?>,
      IRequestHandler<GetEmployeeOutPassesQuery, IReadOnlyList<EmployeeOutPassDto>>,
      IRequestHandler<GetVehiclesQuery, IReadOnlyList<VehicleDto>>,
      IRequestHandler<GetVehicleEntriesQuery, IReadOnlyList<VehicleEntryDto>>,
      IRequestHandler<GetGatePassesQuery, IReadOnlyList<GatePassDto>>,
      IRequestHandler<GetGatePassByIdQuery, GatePassDto?>,
      IRequestHandler<GetReturnableGatePassReturnsQuery, IReadOnlyList<ReturnableGatePassReturnDto>>,
      IRequestHandler<GetChalansQuery, IReadOnlyList<ChalanDto>>,
      IRequestHandler<GetChalanByIdQuery, ChalanDto?>,
      IRequestHandler<GetBillEntriesQuery, IReadOnlyList<BillEntryDto>>,
      IRequestHandler<GetBillEntryByIdQuery, BillEntryDto?>,
      IRequestHandler<GetSecurityChecksQuery, IReadOnlyList<SecurityCheckLogDto>>,
      IRequestHandler<GetDailyGateRegisterQuery, DailyGateRegisterDto>,
      IRequestHandler<GetVisitorReportQuery, IReadOnlyList<VisitorEntryDto>>,
      IRequestHandler<GetMaterialInOutReportQuery, MaterialInOutReportDto>,
      IRequestHandler<GetVehicleReportQuery, IReadOnlyList<VehicleEntryDto>>,
      IRequestHandler<GetReturnablePendingReportQuery, IReadOnlyList<ReturnablePendingDto>>
{
    public async Task<IReadOnlyList<GateDto>> Handle(GetGatesQuery request, CancellationToken cancellationToken)
    {
        var cacheKey = $"security:gates:{request.CompanyId}";
        var cached = await cache.GetAsync<IReadOnlyList<GateDto>>(cacheKey, cancellationToken);
        if (cached is not null) return cached;
        var rows = await db.Gates.Where(x => x.CompanyId == request.CompanyId).OrderBy(x => x.GateCode).ToListAsync(cancellationToken);
        var dto = mapper.Map<IReadOnlyList<GateDto>>(rows);
        await cache.SetAsync(cacheKey, dto, TimeSpan.FromMinutes(5), cancellationToken);
        return dto;
    }

    public async Task<IReadOnlyList<VisitorDto>> Handle(GetVisitorsQuery request, CancellationToken cancellationToken)
    {
        var query = db.Visitors.Where(x => x.CompanyId == request.CompanyId);
        if (!string.IsNullOrWhiteSpace(request.Phone)) query = query.Where(x => x.Phone == request.Phone);
        return mapper.Map<IReadOnlyList<VisitorDto>>(await query.OrderBy(x => x.VisitorName).ToListAsync(cancellationToken));
    }

    public async Task<VisitorDto?> Handle(GetVisitorByIdQuery request, CancellationToken cancellationToken) =>
        mapper.Map<VisitorDto?>(await db.Visitors.FirstOrDefaultAsync(x => x.Id == request.Id, cancellationToken));

    public async Task<IReadOnlyList<VisitorEntryDto>> Handle(GetVisitorEntriesQuery request, CancellationToken cancellationToken)
    {
        var query = db.VisitorEntries.Where(x => x.CompanyId == request.CompanyId);
        if (request.Date is not null) query = query.Where(x => x.VisitDate == request.Date);
        return mapper.Map<IReadOnlyList<VisitorEntryDto>>(await query.OrderByDescending(x => x.InTime).ToListAsync(cancellationToken));
    }

    public async Task<VisitorEntryDto?> Handle(GetVisitorEntryByIdQuery request, CancellationToken cancellationToken) =>
        mapper.Map<VisitorEntryDto?>(await db.VisitorEntries.FirstOrDefaultAsync(x => x.Id == request.Id, cancellationToken));

    public async Task<IReadOnlyList<EmployeeOutPassDto>> Handle(GetEmployeeOutPassesQuery request, CancellationToken cancellationToken)
    {
        var query = db.EmployeeOutPasses.Where(x => x.CompanyId == request.CompanyId);
        if (request.EmployeeId is not null) query = query.Where(x => x.EmployeeId == request.EmployeeId);
        if (request.Date is not null) query = query.Where(x => x.PassDate == request.Date);
        return mapper.Map<IReadOnlyList<EmployeeOutPassDto>>(await query.OrderByDescending(x => x.PassDate).ToListAsync(cancellationToken));
    }

    public async Task<IReadOnlyList<VehicleDto>> Handle(GetVehiclesQuery request, CancellationToken cancellationToken) =>
        mapper.Map<IReadOnlyList<VehicleDto>>(await db.Vehicles.Where(x => x.CompanyId == request.CompanyId).OrderBy(x => x.VehicleNo).ToListAsync(cancellationToken));

    public async Task<IReadOnlyList<VehicleEntryDto>> Handle(GetVehicleEntriesQuery request, CancellationToken cancellationToken)
    {
        var query = db.VehicleEntries.Where(x => x.CompanyId == request.CompanyId);
        if (request.Date is not null) query = query.Where(x => x.EntryDate == request.Date);
        return mapper.Map<IReadOnlyList<VehicleEntryDto>>(await query.OrderByDescending(x => x.InTime).ToListAsync(cancellationToken));
    }

    public async Task<IReadOnlyList<GatePassDto>> Handle(GetGatePassesQuery request, CancellationToken cancellationToken)
    {
        var query = db.GatePasses.Include(x => x.Items).Where(x => x.CompanyId == request.CompanyId);
        if (!string.IsNullOrWhiteSpace(request.Type)) query = query.Where(x => x.GatePassType == request.Type);
        if (!string.IsNullOrWhiteSpace(request.Status)) query = query.Where(x => x.Status == request.Status);
        if (request.FromDate is not null) query = query.Where(x => x.GatePassDate >= request.FromDate);
        if (request.ToDate is not null) query = query.Where(x => x.GatePassDate <= request.ToDate);
        return mapper.Map<IReadOnlyList<GatePassDto>>(await query.OrderByDescending(x => x.GatePassDate).ToListAsync(cancellationToken));
    }

    public async Task<GatePassDto?> Handle(GetGatePassByIdQuery request, CancellationToken cancellationToken) =>
        mapper.Map<GatePassDto?>(await db.GatePasses.Include(x => x.Items).FirstOrDefaultAsync(x => x.Id == request.Id, cancellationToken));

    public async Task<IReadOnlyList<ReturnableGatePassReturnDto>> Handle(GetReturnableGatePassReturnsQuery request, CancellationToken cancellationToken)
    {
        var query = db.ReturnableGatePassReturns.Include(x => x.Items).Where(x => x.CompanyId == request.CompanyId);
        if (request.GatePassId is not null) query = query.Where(x => x.GatePassId == request.GatePassId);
        return mapper.Map<IReadOnlyList<ReturnableGatePassReturnDto>>(await query.OrderByDescending(x => x.ReturnDate).ToListAsync(cancellationToken));
    }

    public async Task<IReadOnlyList<ChalanDto>> Handle(GetChalansQuery request, CancellationToken cancellationToken)
    {
        var query = db.Chalans.Include(x => x.Items).Where(x => x.CompanyId == request.CompanyId);
        if (!string.IsNullOrWhiteSpace(request.Type)) query = query.Where(x => x.ChalanType == request.Type);
        if (request.FromDate is not null) query = query.Where(x => x.ChalanDate >= request.FromDate);
        if (request.ToDate is not null) query = query.Where(x => x.ChalanDate <= request.ToDate);
        return mapper.Map<IReadOnlyList<ChalanDto>>(await query.OrderByDescending(x => x.ChalanDate).ToListAsync(cancellationToken));
    }

    public async Task<ChalanDto?> Handle(GetChalanByIdQuery request, CancellationToken cancellationToken) =>
        mapper.Map<ChalanDto?>(await db.Chalans.Include(x => x.Items).FirstOrDefaultAsync(x => x.Id == request.Id, cancellationToken));

    public async Task<IReadOnlyList<BillEntryDto>> Handle(GetBillEntriesQuery request, CancellationToken cancellationToken)
    {
        var query = db.BillEntries.Where(x => x.CompanyId == request.CompanyId);
        if (request.FromDate is not null) query = query.Where(x => x.BillDate >= request.FromDate);
        if (request.ToDate is not null) query = query.Where(x => x.BillDate <= request.ToDate);
        return mapper.Map<IReadOnlyList<BillEntryDto>>(await query.OrderByDescending(x => x.BillDate).ToListAsync(cancellationToken));
    }

    public async Task<BillEntryDto?> Handle(GetBillEntryByIdQuery request, CancellationToken cancellationToken) =>
        mapper.Map<BillEntryDto?>(await db.BillEntries.FirstOrDefaultAsync(x => x.Id == request.Id, cancellationToken));

    public async Task<IReadOnlyList<SecurityCheckLogDto>> Handle(GetSecurityChecksQuery request, CancellationToken cancellationToken)
    {
        var query = db.SecurityCheckLogs.Where(x => x.CompanyId == request.CompanyId);
        if (!string.IsNullOrWhiteSpace(request.ReferenceType)) query = query.Where(x => x.ReferenceType == request.ReferenceType);
        if (request.ReferenceId is not null) query = query.Where(x => x.ReferenceId == request.ReferenceId);
        return mapper.Map<IReadOnlyList<SecurityCheckLogDto>>(await query.OrderByDescending(x => x.CheckTime).ToListAsync(cancellationToken));
    }

    public Task<DailyGateRegisterDto> Handle(GetDailyGateRegisterQuery request, CancellationToken cancellationToken) => reports.BuildDailyRegisterAsync(request.CompanyId, request.Date, cancellationToken);
    public Task<IReadOnlyList<VisitorEntryDto>> Handle(GetVisitorReportQuery request, CancellationToken cancellationToken) => reports.BuildVisitorReportAsync(request.CompanyId, request.FromDate, request.ToDate, cancellationToken);
    public Task<MaterialInOutReportDto> Handle(GetMaterialInOutReportQuery request, CancellationToken cancellationToken) => reports.BuildMaterialInOutAsync(request.CompanyId, request.FromDate, request.ToDate, cancellationToken);
    public Task<IReadOnlyList<VehicleEntryDto>> Handle(GetVehicleReportQuery request, CancellationToken cancellationToken) => reports.BuildVehicleReportAsync(request.CompanyId, request.FromDate, request.ToDate, cancellationToken);
    public Task<IReadOnlyList<ReturnablePendingDto>> Handle(GetReturnablePendingReportQuery request, CancellationToken cancellationToken) => reports.BuildReturnablePendingAsync(request.CompanyId, cancellationToken);
}
