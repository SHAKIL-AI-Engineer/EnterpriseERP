using AutoMapper;
using SewingService.Contracts;
using SewingService.Domain;

namespace SewingService.Application;

public sealed class MappingProfile : Profile
{
    public MappingProfile()
    {
        CreateMap<SewingLine, SewingLineDto>();
        CreateMap<ProductionAssignment, ProductionAssignmentDto>()
            .ForMember(d => d.LineName, o => o.MapFrom(s => s.SewingLine != null ? s.SewingLine.LineName : null));
        CreateMap<ProductionTarget, ProductionTargetDto>();
        CreateMap<DailyProductionRecord, DailyProductionRecordDto>();
        CreateMap<SewingOutput, SewingOutputDto>();
        CreateMap<PanelTransferReceipt, PanelTransferReceiptDto>();
        CreateMap<SewingBalance, SewingBalanceDto>();
        CreateMap<SewingOutput, SewingOutputSnapshotDto>()
            .ForMember(d => d.ProductionOutputId, o => o.MapFrom(s => s.Id));
    }
}
