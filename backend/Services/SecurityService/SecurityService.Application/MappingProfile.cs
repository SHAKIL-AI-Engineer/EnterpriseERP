using AutoMapper;
using SecurityService.Contracts;
using SecurityService.Domain;

namespace SecurityService.Application;

public sealed class MappingProfile : Profile
{
    public MappingProfile()
    {
        CreateMap<Gate, GateDto>();
        CreateMap<Visitor, VisitorDto>();
        CreateMap<VisitorEntry, VisitorEntryDto>();
        CreateMap<EmployeeOutPass, EmployeeOutPassDto>();
        CreateMap<Vehicle, VehicleDto>();
        CreateMap<VehicleEntry, VehicleEntryDto>();
        CreateMap<GatePassItem, GatePassItemDto>();
        CreateMap<GatePass, GatePassDto>();
        CreateMap<ReturnableGatePassReturnItem, ReturnableGatePassReturnItemDto>();
        CreateMap<ReturnableGatePassReturn, ReturnableGatePassReturnDto>();
        CreateMap<ChalanItem, ChalanItemDto>();
        CreateMap<Chalan, ChalanDto>();
        CreateMap<BillEntry, BillEntryDto>();
        CreateMap<SecurityCheckLog, SecurityCheckLogDto>();
        CreateMap<GateActionLog, GateActionLogDto>();
    }
}
