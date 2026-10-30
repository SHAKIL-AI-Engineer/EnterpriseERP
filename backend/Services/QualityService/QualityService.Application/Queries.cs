using MediatR;
using QualityService.Contracts;

namespace QualityService.Application;

public sealed record GetQualityCheckpointsQuery(Guid CompanyId) : IRequest<IReadOnlyList<QualityCheckpointDto>>;
public sealed record GetDefectCategoriesQuery(Guid CompanyId) : IRequest<IReadOnlyList<DefectCategoryDto>>;

public sealed record GetDefectTypesQuery(Guid CompanyId, Guid? CategoryId) : IRequest<IReadOnlyList<DefectTypeDto>>;

public sealed record GetQualityInspectionsQuery(
    Guid CompanyId,
    Guid? OrderId,
    string? InspectionType,
    DateOnly? FromDate,
    DateOnly? ToDate
) : IRequest<IReadOnlyList<QualityInspectionDto>>;

public sealed record GetQualityInspectionByIdQuery(Guid Id) : IRequest<QualityInspectionDto>;
public sealed record GetInspectionDefectsQuery(Guid InspectionId) : IRequest<IReadOnlyList<QualityInspectionDefectDto>>;

public sealed record GetQualityReworksQuery(
    Guid CompanyId,
    Guid? OrderId,
    string? Status
) : IRequest<IReadOnlyList<QualityReworkDto>>;

public sealed record GetQualityRejectsQuery(
    Guid CompanyId,
    Guid? OrderId
) : IRequest<IReadOnlyList<QualityRejectDto>>;

public sealed record GetAQLStandardsQuery(Guid CompanyId) : IRequest<IReadOnlyList<AQLStandardDto>>;
public sealed record FindAQLStandardByLotSizeQuery(Guid CompanyId, int LotSize) : IRequest<AQLStandardDto>;

public sealed record GetFinalInspectionsQuery(
    Guid CompanyId,
    Guid? OrderId,
    DateOnly? FromDate,
    DateOnly? ToDate
) : IRequest<IReadOnlyList<FinalInspectionDto>>;

public sealed record GetFinalInspectionByIdQuery(Guid Id) : IRequest<FinalInspectionDto>;

// Reports Queries
public sealed record GetDefectSummaryReportQuery(
    Guid CompanyId,
    DateOnly? FromDate,
    DateOnly? ToDate
) : IRequest<IReadOnlyList<QualityReportRowDto>>;

public sealed record GetOrderQualityReportQuery(
    Guid CompanyId,
    Guid OrderId
) : IRequest<IReadOnlyList<QualityReportRowDto>>;

public sealed record GetAqlSummaryReportQuery(
    Guid CompanyId,
    DateOnly? FromDate,
    DateOnly? ToDate
) : IRequest<IReadOnlyList<QualityReportRowDto>>;

public sealed record GetQualityReportQuery(
    Guid CompanyId,
    Guid? OrderId,
    string ReportType,
    DateOnly? FromDate,
    DateOnly? ToDate
) : IRequest<IReadOnlyList<QualityReportRowDto>>;
