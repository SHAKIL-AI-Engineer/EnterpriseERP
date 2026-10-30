using AutoMapper;
using QualityService.Domain;
using QualityService.Contracts;

namespace QualityService.Application;

public sealed class MappingProfile : Profile
{
    public MappingProfile()
    {
        CreateMap<QualityCheckpoint, QualityCheckpointDto>();
        CreateMap<DefectCategory, DefectCategoryDto>();
        CreateMap<DefectType, DefectTypeDto>();
        CreateMap<QualityInspectionDefect, QualityInspectionDefectDto>();
        CreateMap<QualityInspection, QualityInspectionDto>();
        CreateMap<QualityRework, QualityReworkDto>();
        CreateMap<QualityReject, QualityRejectDto>();
        CreateMap<AQLStandard, AQLStandardDto>();
        CreateMap<FinalInspection, FinalInspectionDto>();
    }
}
