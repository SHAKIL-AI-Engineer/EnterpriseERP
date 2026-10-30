using AutoMapper;
using MerchandisingService.Contracts;
using MerchandisingService.Domain;

namespace MerchandisingService.Application;

public sealed class MappingProfile : Profile
{
    public MappingProfile()
    {
        CreateMap<Buyer, BuyerDto>();
        CreateMap<Season, SeasonDto>();
        CreateMap<GarmentItem, GarmentItemDto>();
        CreateMap<Style, StyleDto>();
        CreateMap<Order, OrderDto>();
        CreateMap<BuyerPurchaseOrder, BuyerPurchaseOrderDto>();
        CreateMap<OrderColorSizeBreakdown, ColorSizeBreakdownDto>();
        CreateMap<BomItem, BomItemDto>();
        CreateMap<OrderCosting, OrderCostingDto>();
        CreateMap<Sample, SampleDto>();
        CreateMap<ShipmentPlan, ShipmentPlanDto>();
        CreateMap<BuyerContact, BuyerContactDto>();
        CreateMap<BuyerPaymentTerm, BuyerPaymentTermDto>();
        CreateMap<BuyerComplianceRule, BuyerComplianceRuleDto>();
        CreateMap<StyleVersion, StyleVersionDto>();
        CreateMap<StyleBomItem, StyleBomItemDto>();
        CreateMap<SampleCosting, SampleCostingDto>();
        CreateMap<Quotation, QuotationDto>();
        CreateMap<QuotationLine, QuotationLineDto>();
        CreateMap<QuotationNegotiation, QuotationNegotiationDto>();
        CreateMap<OrderAssignment, OrderAssignmentDto>();
        CreateMap<OrderCommercialTerms, OrderCommercialTermsDto>();
        CreateMap<OrderTrimsMatrix, OrderTrimsMatrixDto>();
        CreateMap<TnaTemplate, TnaTemplateDto>();
        CreateMap<TnaCalendar, TnaCalendarDto>();
        CreateMap<TnaMilestone, TnaMilestoneDto>();
        CreateMap<TnaDelayLog, TnaDelayLogDto>();
        CreateMap<MaterialBooking, MaterialBookingDto>();
        CreateMap<FabricBookingDetail, FabricBookingDetailDto>();
        CreateMap<TrimsBookingDetail, TrimsBookingDetailDto>();
        CreateMap<BookingAllocation, BookingAllocationDto>();
        CreateMap<PurchaseRequisition, PurchaseRequisitionDto>();
        CreateMap<RequisitionLine, RequisitionLineDto>();
    }
}
