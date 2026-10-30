using AutoMapper;
using MediatR;
using Microsoft.EntityFrameworkCore;
using QualityService.Domain;
using QualityService.Contracts;

namespace QualityService.Application.Handlers;

public sealed class QueryHandlers(
    IQualityDbContext db,
    IMapper mapper,
    IRedisCacheService cache) :
    IRequestHandler<GetQualityCheckpointsQuery, IReadOnlyList<QualityCheckpointDto>>,
    IRequestHandler<GetDefectCategoriesQuery, IReadOnlyList<DefectCategoryDto>>,
    IRequestHandler<GetDefectTypesQuery, IReadOnlyList<DefectTypeDto>>,
    IRequestHandler<GetQualityInspectionsQuery, IReadOnlyList<QualityInspectionDto>>,
    IRequestHandler<GetQualityInspectionByIdQuery, QualityInspectionDto>,
    IRequestHandler<GetInspectionDefectsQuery, IReadOnlyList<QualityInspectionDefectDto>>,
    IRequestHandler<GetQualityReworksQuery, IReadOnlyList<QualityReworkDto>>,
    IRequestHandler<GetQualityRejectsQuery, IReadOnlyList<QualityRejectDto>>,
    IRequestHandler<GetAQLStandardsQuery, IReadOnlyList<AQLStandardDto>>,
    IRequestHandler<FindAQLStandardByLotSizeQuery, AQLStandardDto>,
    IRequestHandler<GetFinalInspectionsQuery, IReadOnlyList<FinalInspectionDto>>,
    IRequestHandler<GetFinalInspectionByIdQuery, FinalInspectionDto>,
    IRequestHandler<GetDefectSummaryReportQuery, IReadOnlyList<QualityReportRowDto>>,
    IRequestHandler<GetOrderQualityReportQuery, IReadOnlyList<QualityReportRowDto>>,
    IRequestHandler<GetAqlSummaryReportQuery, IReadOnlyList<QualityReportRowDto>>,
    IRequestHandler<GetQualityReportQuery, IReadOnlyList<QualityReportRowDto>>
{
    public async Task<IReadOnlyList<QualityCheckpointDto>> Handle(GetQualityCheckpointsQuery q, CancellationToken ct)
    {
        var list = await db.QualityCheckpoints
            .AsNoTracking()
            .Where(x => x.CompanyId == q.CompanyId)
            .OrderBy(x => x.CheckpointCode)
            .ToListAsync(ct);
        return mapper.Map<IReadOnlyList<QualityCheckpointDto>>(list);
    }

    public async Task<IReadOnlyList<DefectCategoryDto>> Handle(GetDefectCategoriesQuery q, CancellationToken ct)
    {
        var list = await db.DefectCategories
            .AsNoTracking()
            .Where(x => x.CompanyId == q.CompanyId)
            .OrderBy(x => x.CategoryCode)
            .ToListAsync(ct);
        return mapper.Map<IReadOnlyList<DefectCategoryDto>>(list);
    }

    public async Task<IReadOnlyList<DefectTypeDto>> Handle(GetDefectTypesQuery q, CancellationToken ct)
    {
        var query = db.DefectTypes.AsNoTracking().Where(x => x.CompanyId == q.CompanyId);
        if (q.CategoryId.HasValue)
        {
            query = query.Where(x => x.DefectCategoryId == q.CategoryId.Value);
        }

        var list = await query.OrderBy(x => x.DefectCode).ToListAsync(ct);
        return mapper.Map<IReadOnlyList<DefectTypeDto>>(list);
    }

    public async Task<IReadOnlyList<QualityInspectionDto>> Handle(GetQualityInspectionsQuery q, CancellationToken ct)
    {
        var query = db.QualityInspections.AsNoTracking().Where(x => x.CompanyId == q.CompanyId);
        if (q.OrderId.HasValue)
        {
            query = query.Where(x => x.OrderId == q.OrderId.Value);
        }
        if (!string.IsNullOrEmpty(q.InspectionType))
        {
            query = query.Where(x => x.InspectionType == q.InspectionType);
        }
        if (q.FromDate.HasValue)
        {
            query = query.Where(x => x.InspectionDate >= q.FromDate.Value);
        }
        if (q.ToDate.HasValue)
        {
            query = query.Where(x => x.InspectionDate <= q.ToDate.Value);
        }

        var list = await query
            .Include(x => x.Defects)
            .OrderByDescending(x => x.InspectionDate)
            .ToListAsync(ct);

        return mapper.Map<IReadOnlyList<QualityInspectionDto>>(list);
    }

    public async Task<QualityInspectionDto> Handle(GetQualityInspectionByIdQuery q, CancellationToken ct)
    {
        var cacheKey = $"quality:inspections:byid:{q.Id}";
        var cached = await cache.GetAsync<QualityInspectionDto>(cacheKey, ct);
        if (cached is not null) return cached;

        var entity = await db.QualityInspections
            .Include(x => x.Defects)
            .FirstOrDefaultAsync(x => x.Id == q.Id, ct) ?? throw new KeyNotFoundException("Inspection not found.");

        var dto = mapper.Map<QualityInspectionDto>(entity);
        await cache.SetAsync(cacheKey, dto, TimeSpan.FromMinutes(10), ct);
        return dto;
    }

    public async Task<IReadOnlyList<QualityInspectionDefectDto>> Handle(GetInspectionDefectsQuery q, CancellationToken ct)
    {
        var list = await db.QualityInspectionDefects
            .AsNoTracking()
            .Where(x => x.QualityInspectionId == q.InspectionId)
            .ToListAsync(ct);
        return mapper.Map<IReadOnlyList<QualityInspectionDefectDto>>(list);
    }

    public async Task<IReadOnlyList<QualityReworkDto>> Handle(GetQualityReworksQuery q, CancellationToken ct)
    {
        var query = db.QualityReworks.AsNoTracking().Where(x => x.CompanyId == q.CompanyId);
        if (q.OrderId.HasValue)
        {
            query = query.Where(x => x.OrderId == q.OrderId.Value);
        }
        if (!string.IsNullOrEmpty(q.Status))
        {
            query = query.Where(x => x.Status == q.Status);
        }

        var list = await query.OrderByDescending(x => x.ReworkDate).ToListAsync(ct);
        return mapper.Map<IReadOnlyList<QualityReworkDto>>(list);
    }

    public async Task<IReadOnlyList<QualityRejectDto>> Handle(GetQualityRejectsQuery q, CancellationToken ct)
    {
        var query = db.QualityRejects.AsNoTracking().Where(x => x.CompanyId == q.CompanyId);
        if (q.OrderId.HasValue)
        {
            query = query.Where(x => x.OrderId == q.OrderId.Value);
        }

        var list = await query.OrderByDescending(x => x.RejectDate).ToListAsync(ct);
        return mapper.Map<IReadOnlyList<QualityRejectDto>>(list);
    }

    public async Task<IReadOnlyList<AQLStandardDto>> Handle(GetAQLStandardsQuery q, CancellationToken ct)
    {
        var list = await db.AQLStandards
            .AsNoTracking()
            .Where(x => x.CompanyId == q.CompanyId)
            .OrderBy(x => x.LotSizeFrom)
            .ToListAsync(ct);
        return mapper.Map<IReadOnlyList<AQLStandardDto>>(list);
    }

    public async Task<AQLStandardDto> Handle(FindAQLStandardByLotSizeQuery q, CancellationToken ct)
    {
        var cacheKey = CacheKeys.AqlStandard(q.CompanyId, q.LotSize);
        var cached = await cache.GetAsync<AQLStandardDto>(cacheKey, ct);
        if (cached is not null) return cached;

        var entity = await db.AQLStandards.FirstOrDefaultAsync(x => 
            x.CompanyId == q.CompanyId && 
            q.LotSize >= x.LotSizeFrom && 
            q.LotSize <= x.LotSizeTo && 
            x.IsActive, ct) ?? throw new KeyNotFoundException("AQL standard matching the lot size was not found.");

        var dto = mapper.Map<AQLStandardDto>(entity);
        await cache.SetAsync(cacheKey, dto, TimeSpan.FromHours(1), ct);
        return dto;
    }

    public async Task<IReadOnlyList<FinalInspectionDto>> Handle(GetFinalInspectionsQuery q, CancellationToken ct)
    {
        var query = db.FinalInspections.AsNoTracking().Where(x => x.CompanyId == q.CompanyId);
        if (q.OrderId.HasValue)
        {
            query = query.Where(x => x.OrderId == q.OrderId.Value);
        }
        if (q.FromDate.HasValue)
        {
            query = query.Where(x => x.InspectionDate >= q.FromDate.Value);
        }
        if (q.ToDate.HasValue)
        {
            query = query.Where(x => x.InspectionDate <= q.ToDate.Value);
        }

        var list = await query.OrderByDescending(x => x.InspectionDate).ToListAsync(ct);
        return mapper.Map<IReadOnlyList<FinalInspectionDto>>(list);
    }

    public async Task<FinalInspectionDto> Handle(GetFinalInspectionByIdQuery q, CancellationToken ct)
    {
        var entity = await db.FinalInspections.FindAsync([q.Id], ct) ?? throw new KeyNotFoundException("Final inspection not found.");
        return mapper.Map<FinalInspectionDto>(entity);
    }

    public async Task<IReadOnlyList<QualityReportRowDto>> Handle(GetDefectSummaryReportQuery q, CancellationToken ct)
    {
        var inspections = await db.QualityInspections
            .AsNoTracking()
            .Include(x => x.Defects)
            .ThenInclude(d => d.DefectType)
            .Where(x => x.CompanyId == q.CompanyId && x.Status == QualityInspectionStatuses.Approved)
            .ToListAsync(ct);

        if (q.FromDate.HasValue) inspections = inspections.Where(x => x.InspectionDate >= q.FromDate.Value).ToList();
        if (q.ToDate.HasValue) inspections = inspections.Where(x => x.InspectionDate <= q.ToDate.Value).ToList();

        var rows = inspections.Select(x => new QualityReportRowDto(
            ReportType: "Defect Summary",
            CompanyId: x.CompanyId,
            OrderId: x.OrderId,
            ReferenceNo: x.InspectionNo,
            Date: x.InspectionDate,
            ColorName: x.ColorName,
            SizeName: x.SizeName,
            InspectedQty: x.InspectedQty,
            PassedQty: x.PassedQty,
            DefectQty: x.DefectQty,
            ReworkQty: x.ReworkQty,
            RejectQty: x.RejectQty,
            Result: x.Result,
            Details: string.Join(", ", x.Defects.Select(d => $"{d.DefectType?.DefectName ?? "Defect"}: {d.DefectQty}"))
        )).ToList();

        return rows;
    }

    public async Task<IReadOnlyList<QualityReportRowDto>> Handle(GetOrderQualityReportQuery q, CancellationToken ct)
    {
        var inspections = await db.QualityInspections
            .AsNoTracking()
            .Include(x => x.Defects)
            .ThenInclude(d => d.DefectType)
            .Where(x => x.CompanyId == q.CompanyId && x.OrderId == q.OrderId && x.Status == QualityInspectionStatuses.Approved)
            .OrderBy(x => x.InspectionDate)
            .ToListAsync(ct);

        var rows = inspections.Select(x => new QualityReportRowDto(
            ReportType: "Order Quality Tracker",
            CompanyId: x.CompanyId,
            OrderId: x.OrderId,
            ReferenceNo: x.InspectionNo,
            Date: x.InspectionDate,
            ColorName: x.ColorName,
            SizeName: x.SizeName,
            InspectedQty: x.InspectedQty,
            PassedQty: x.PassedQty,
            DefectQty: x.DefectQty,
            ReworkQty: x.ReworkQty,
            RejectQty: x.RejectQty,
            Result: x.Result,
            Details: $"{x.InspectionType} QC Checkpoint"
        )).ToList();

        return rows;
    }

    public async Task<IReadOnlyList<QualityReportRowDto>> Handle(GetAqlSummaryReportQuery q, CancellationToken ct)
    {
        var inspections = await db.FinalInspections
            .AsNoTracking()
            .Where(x => x.CompanyId == q.CompanyId && x.Status == QualityInspectionStatuses.Approved)
            .ToListAsync(ct);

        if (q.FromDate.HasValue) inspections = inspections.Where(x => x.InspectionDate >= q.FromDate.Value).ToList();
        if (q.ToDate.HasValue) inspections = inspections.Where(x => x.InspectionDate <= q.ToDate.Value).ToList();

        var rows = inspections.Select(x => new QualityReportRowDto(
            ReportType: "Final AQL Summary",
            CompanyId: x.CompanyId,
            OrderId: x.OrderId,
            ReferenceNo: x.InspectionNo,
            Date: x.InspectionDate,
            ColorName: "N/A",
            SizeName: "N/A",
            InspectedQty: x.SampleSize,
            PassedQty: x.LotSize,
            DefectQty: x.CriticalDefects + x.MajorDefects + x.MinorDefects,
            ReworkQty: 0,
            RejectQty: 0,
            Result: x.Result,
            Details: $"Lot Size: {x.LotSize}, Sample Size: {x.SampleSize}, Major Defects: {x.MajorDefects}"
        )).ToList();

        return rows;
    }

    public async Task<IReadOnlyList<QualityReportRowDto>> Handle(GetQualityReportQuery q, CancellationToken ct)
    {
        if (q.ReportType == "Defect Summary")
            return await Handle(new GetDefectSummaryReportQuery(q.CompanyId, q.FromDate, q.ToDate), ct);
        if (q.ReportType == "Order Quality Tracker")
            return await Handle(new GetOrderQualityReportQuery(q.CompanyId, q.OrderId ?? Guid.Empty), ct);
        if (q.ReportType == "Final AQL Summary")
            return await Handle(new GetAqlSummaryReportQuery(q.CompanyId, q.FromDate, q.ToDate), ct);

        // General operational reports listing
        var inspections = await db.QualityInspections
            .AsNoTracking()
            .Where(x => x.CompanyId == q.CompanyId && x.Status == QualityInspectionStatuses.Approved)
            .ToListAsync(ct);

        if (q.OrderId.HasValue) inspections = inspections.Where(x => x.OrderId == q.OrderId.Value).ToList();
        if (q.FromDate.HasValue) inspections = inspections.Where(x => x.InspectionDate >= q.FromDate.Value).ToList();
        if (q.ToDate.HasValue) inspections = inspections.Where(x => x.InspectionDate <= q.ToDate.Value).ToList();

        var rows = inspections.Select(x => new QualityReportRowDto(
            ReportType: q.ReportType,
            CompanyId: x.CompanyId,
            OrderId: x.OrderId,
            ReferenceNo: x.InspectionNo,
            Date: x.InspectionDate,
            ColorName: x.ColorName,
            SizeName: x.SizeName,
            InspectedQty: x.InspectedQty,
            PassedQty: x.PassedQty,
            DefectQty: x.DefectQty,
            ReworkQty: x.ReworkQty,
            RejectQty: x.RejectQty,
            Result: x.Result,
            Details: $"{x.InspectionType} QC Checkpoint"
        )).ToList();

        return rows;
    }
}
