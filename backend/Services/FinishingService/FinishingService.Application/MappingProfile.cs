using AutoMapper;
using FinishingService.Contracts;
using FinishingService.Domain;

namespace FinishingService.Application;

public sealed class MappingProfile : Profile
{
    public MappingProfile()
    {
        CreateMap<FinishingReceive, FinishingReceiveDto>();
        CreateMap<FinishingReceiveItem, FinishingReceiveItemDto>();
        CreateMap<FinishingBatch, FinishingBatchDto>();
        CreateMap<FinishingInput, FinishingInputDto>();
        CreateMap<IroningOutput, IroningOutputDto>();
        CreateMap<FinishingQC, FinishingQCDto>();
        CreateMap<FinishingDefect, FinishingDefectDto>();
        CreateMap<FoldingPacking, FoldingPackingDto>();
        CreateMap<CartonPacking, CartonPackingDto>();
        CreateMap<CartonPackingItem, CartonPackingItemDto>();
        CreateMap<FinishedGoodsTransfer, FinishedGoodsTransferDto>();
        CreateMap<FinishedGoodsTransferItem, FinishedGoodsTransferItemDto>();
        CreateMap<FinishingWastage, FinishingWastageDto>();
        CreateMap<FinishingBalance, FinishingBalanceDto>();
    }
}
