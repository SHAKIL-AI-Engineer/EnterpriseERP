using AutoMapper;
using CuttingService.Contracts;
using CuttingService.Domain;

namespace CuttingService.Application;

public sealed class MappingProfile : Profile
{
    public MappingProfile()
    {
        CreateMap<CuttingPlan, CuttingPlanDto>();
        CreateMap<CuttingPlanSizeBreakdown, CuttingPlanSizeBreakdownDto>();
        CreateMap<FabricIssueToCutting, FabricIssueToCuttingDto>();
        CreateMap<CuttingLaySizeDetail, CuttingLaySizeDetailDto>();
        CreateMap<CuttingLay, CuttingLayDto>();
        CreateMap<CuttingOutput, CuttingOutputDto>();
        CreateMap<CuttingWastage, CuttingWastageDto>();
        CreateMap<CuttingBalance, CuttingBalanceDto>();
        CreateMap<CuttingPanelTransferItem, CuttingPanelTransferItemDto>();
        CreateMap<CuttingPanelTransfer, CuttingPanelTransferDto>();
        CreateMap<CuttingBundle, CuttingBundleDto>();
    }
}
