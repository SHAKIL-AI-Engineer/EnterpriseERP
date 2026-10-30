using AutoMapper;
using Microsoft.EntityFrameworkCore;
using SecurityService.Contracts;
using SecurityService.Domain;

using Erp.BuildingBlocks.SharedKernel;

namespace SecurityService.Application.Services;

public sealed class ReportDataBuilderService(ISecurityDbContext db, IMapper mapper, IImportExportServiceClient exporter) : IReportDataBuilderService
{
    public async Task<DailyGateRegisterDto> BuildDailyRegisterAsync(Guid companyId, DateOnly date, CancellationToken cancellationToken = default)
    {
        var visitors = await db.VisitorEntries.Where(x => x.CompanyId == companyId && x.VisitDate == date).OrderBy(x => x.InTime).ToListAsync(cancellationToken);
        var vehicles = await db.VehicleEntries.Where(x => x.CompanyId == companyId && x.EntryDate == date).OrderBy(x => x.InTime).ToListAsync(cancellationToken);
        var gatePasses = await db.GatePasses.Include(x => x.Items).Where(x => x.CompanyId == companyId && x.GatePassDate == date).OrderBy(x => x.GatePassNo).ToListAsync(cancellationToken);
        return new DailyGateRegisterDto(date, mapper.Map<IReadOnlyList<VisitorEntryDto>>(visitors), mapper.Map<IReadOnlyList<VehicleEntryDto>>(vehicles), mapper.Map<IReadOnlyList<GatePassDto>>(gatePasses));
    }

    public async Task<IReadOnlyList<VisitorEntryDto>> BuildVisitorReportAsync(Guid companyId, DateOnly fromDate, DateOnly toDate, CancellationToken cancellationToken = default)
    {
        var rows = await db.VisitorEntries.Where(x => x.CompanyId == companyId && x.VisitDate >= fromDate && x.VisitDate <= toDate).OrderBy(x => x.VisitDate).ThenBy(x => x.InTime).ToListAsync(cancellationToken);
        return mapper.Map<IReadOnlyList<VisitorEntryDto>>(rows);
    }

    public async Task<MaterialInOutReportDto> BuildMaterialInOutAsync(Guid companyId, DateOnly fromDate, DateOnly toDate, CancellationToken cancellationToken = default)
    {
        var rows = await db.GatePasses.Include(x => x.Items)
            .Where(x => x.CompanyId == companyId && x.GatePassDate >= fromDate && x.GatePassDate <= toDate && (x.GatePassType == GatePassTypes.MaterialIn || x.GatePassType == GatePassTypes.MaterialOut))
            .ToListAsync(cancellationToken);
        return new MaterialInOutReportDto(
            fromDate,
            toDate,
            mapper.Map<IReadOnlyList<GatePassDto>>(rows.Where(x => x.GatePassType == GatePassTypes.MaterialIn)),
            mapper.Map<IReadOnlyList<GatePassDto>>(rows.Where(x => x.GatePassType == GatePassTypes.MaterialOut)));
    }

    public async Task<IReadOnlyList<VehicleEntryDto>> BuildVehicleReportAsync(Guid companyId, DateOnly fromDate, DateOnly toDate, CancellationToken cancellationToken = default)
    {
        var rows = await db.VehicleEntries.Where(x => x.CompanyId == companyId && x.EntryDate >= fromDate && x.EntryDate <= toDate).OrderBy(x => x.EntryDate).ThenBy(x => x.InTime).ToListAsync(cancellationToken);
        return mapper.Map<IReadOnlyList<VehicleEntryDto>>(rows);
    }

    public async Task<IReadOnlyList<ReturnablePendingDto>> BuildReturnablePendingAsync(Guid companyId, CancellationToken cancellationToken = default)
    {
        var rows = await db.GatePassItems
            .Include(x => x.GatePass)
            .Where(x => x.CompanyId == companyId && x.GatePass != null && x.GatePass.IsReturnable && x.ReturnedQty < x.Quantity && x.GatePass.Status != GatePassStatuses.Cancelled)
            .Select(x => new ReturnablePendingDto(x.GatePassId, x.GatePass!.GatePassNo, x.GatePass.GatePassDate, x.GatePass.ExpectedReturnDate, x.ItemName, x.Quantity, x.ReturnedQty, x.Quantity - x.ReturnedQty))
            .ToListAsync(cancellationToken);
        return rows;
    }

    public async Task<ExportResultDto> ExportAsync(ReportExportApiRequest request, CancellationToken cancellationToken = default)
    {
        object data = request.ReportName switch
        {
            "daily-register" => await BuildDailyRegisterAsync(request.CompanyId, request.Date ?? DateOnly.FromDateTime(BusinessTime.Now), cancellationToken),
            "visitor-report" => await BuildVisitorReportAsync(request.CompanyId, request.FromDate ?? DateOnly.FromDateTime(BusinessTime.Now.Date), request.ToDate ?? DateOnly.FromDateTime(BusinessTime.Now.Date), cancellationToken),
            "material-in-out" => await BuildMaterialInOutAsync(request.CompanyId, request.FromDate ?? DateOnly.FromDateTime(BusinessTime.Now.Date), request.ToDate ?? DateOnly.FromDateTime(BusinessTime.Now.Date), cancellationToken),
            "vehicle-report" => await BuildVehicleReportAsync(request.CompanyId, request.FromDate ?? DateOnly.FromDateTime(BusinessTime.Now.Date), request.ToDate ?? DateOnly.FromDateTime(BusinessTime.Now.Date), cancellationToken),
            "returnable-pending" => await BuildReturnablePendingAsync(request.CompanyId, cancellationToken),
            _ => throw new InvalidOperationException("Unsupported report export request."),
        };

        return await exporter.ExportGateReportAsync(new ReportExportRequest(request.CompanyId, request.ReportName, request.Format, request, data), cancellationToken);
    }
}
