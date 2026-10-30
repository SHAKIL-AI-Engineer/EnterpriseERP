using AutoMapper;
using Erp.BuildingBlocks.SharedKernel;
using MediatR;
using MerchandisingService.Application.Common;
using MerchandisingService.Contracts;
using MerchandisingService.Domain;
using Microsoft.EntityFrameworkCore;

namespace MerchandisingService.Application;

public sealed class ExtendedCommandHandlers(
    IUnitOfWork uow,
    IMerchandisingDbContext db,
    IMapper mapper,
    IBomCalculationService bomCalculator,
    IRedisCacheService cache,
    IIntegrationEventPublisher publisher,
    IProcurementServiceClient procurementClient) :
    IRequestHandler<CreateBuyerContactCommand, BuyerContactDto>,
    IRequestHandler<CreateBuyerPaymentTermCommand, BuyerPaymentTermDto>,
    IRequestHandler<CreateBuyerComplianceRuleCommand, BuyerComplianceRuleDto>,
    IRequestHandler<CreateStyleVersionCommand, StyleVersionDto>,
    IRequestHandler<CreateStyleBomItemCommand, StyleBomItemDto>,
    IRequestHandler<SubmitSampleCommand, SampleDto>,
    IRequestHandler<ReviseSampleCommand, SampleDto>,
    IRequestHandler<CreateSampleCostingCommand, SampleCostingDto>,
    IRequestHandler<CreateQuotationCommand, QuotationDto>,
    IRequestHandler<UpdateQuotationCommand, QuotationDto>,
    IRequestHandler<AddQuotationNegotiationCommand, QuotationNegotiationDto>,
    IRequestHandler<ConvertQuotationToOrderCommand, OrderDto>,
    IRequestHandler<ConfirmOrderWithOptionsCommand, OrderDto>,
    IRequestHandler<CreateOrderAssignmentCommand, OrderAssignmentDto>,
    IRequestHandler<CreateOrderCommercialTermsCommand, OrderCommercialTermsDto>,
    IRequestHandler<CopyStyleBomToOrderCommand, IReadOnlyList<BomItemDto>>,
    IRequestHandler<SubmitCostingApprovalCommand, OrderCostingDto>,
    IRequestHandler<CreateOrderTrimsMatrixCommand, OrderTrimsMatrixDto>,
    IRequestHandler<CreateTnaTemplateCommand, TnaTemplateDto>,
    IRequestHandler<GenerateTnaForOrderCommand, TnaCalendarDto>,
    IRequestHandler<UpdateTnaMilestoneCommand, TnaMilestoneDto>,
    IRequestHandler<LogTnaDelayCommand, TnaDelayLogDto>,
    IRequestHandler<CreateMaterialBookingCommand, MaterialBookingDto>,
    IRequestHandler<AutoCalculateBookingCommand, MaterialBookingDto>,
    IRequestHandler<CreateFabricBookingDetailCommand, FabricBookingDetailDto>,
    IRequestHandler<CreateTrimsBookingDetailCommand, TrimsBookingDetailDto>,
    IRequestHandler<CreateBookingAllocationCommand, BookingAllocationDto>,
    IRequestHandler<CreatePurchaseRequisitionCommand, PurchaseRequisitionDto>,
    IRequestHandler<SubmitPurchaseRequisitionCommand, PurchaseRequisitionDto>,
    IRequestHandler<GenerateRequisitionFromOrderCommand, PurchaseRequisitionDto>
{
    public async Task<BuyerContactDto> Handle(CreateBuyerContactCommand command, CancellationToken cancellationToken)
    {
        var r = command.Request;
        var contact = new BuyerContact { CompanyId = r.CompanyId, BuyerId = r.BuyerId, Name = r.Name.Trim(), Email = r.Email, Phone = r.Phone, Role = r.Role };
        db.Add(contact);
        await uow.SaveChangesAsync(cancellationToken);
        return mapper.Map<BuyerContactDto>(contact);
    }

    public async Task<BuyerPaymentTermDto> Handle(CreateBuyerPaymentTermCommand command, CancellationToken cancellationToken)
    {
        var r = command.Request;
        var term = new BuyerPaymentTerm { CompanyId = r.CompanyId, BuyerId = r.BuyerId, TermName = r.TermName.Trim(), Days = r.Days, Description = r.Description };
        db.Add(term);
        await uow.SaveChangesAsync(cancellationToken);
        return mapper.Map<BuyerPaymentTermDto>(term);
    }

    public async Task<BuyerComplianceRuleDto> Handle(CreateBuyerComplianceRuleCommand command, CancellationToken cancellationToken)
    {
        var r = command.Request;
        var rule = new BuyerComplianceRule { CompanyId = r.CompanyId, BuyerId = r.BuyerId, RuleName = r.RuleName.Trim(), RuleType = r.RuleType, Description = r.Description, IsMandatory = r.IsMandatory };
        db.Add(rule);
        await uow.SaveChangesAsync(cancellationToken);
        return mapper.Map<BuyerComplianceRuleDto>(rule);
    }

    public async Task<StyleVersionDto> Handle(CreateStyleVersionCommand command, CancellationToken cancellationToken)
    {
        var r = command.Request;
        var version = new StyleVersion { CompanyId = r.CompanyId, StyleId = r.StyleId, VersionNo = r.VersionNo, Description = r.Description, EffectiveDate = r.EffectiveDate };
        db.Add(version);
        await uow.SaveChangesAsync(cancellationToken);
        return mapper.Map<StyleVersionDto>(version);
    }

    public async Task<StyleBomItemDto> Handle(CreateStyleBomItemCommand command, CancellationToken cancellationToken)
    {
        var r = command.Request;
        var item = new StyleBomItem { CompanyId = r.CompanyId, StyleId = r.StyleId, ItemType = r.ItemType, ItemCode = r.ItemCode, ItemName = r.ItemName.Trim(), UnitName = r.UnitName.Trim(), Consumption = r.Consumption, WastagePercent = r.WastagePercent, UnitPrice = r.UnitPrice };
        db.Add(item);
        await uow.SaveChangesAsync(cancellationToken);
        return mapper.Map<StyleBomItemDto>(item);
    }

    public async Task<SampleDto> Handle(SubmitSampleCommand command, CancellationToken cancellationToken)
    {
        var sample = await uow.Samples.GetByIdAsync(command.Id, cancellationToken) ?? throw new KeyNotFoundException("Sample not found.");
        sample.Status = SampleStatuses.Submitted;
        sample.SubmitDate = command.Request.SubmitDate;
        sample.Remarks = command.Request.Remarks;
        sample.UpdatedAt = BusinessTime.Now;
        await uow.SaveChangesAsync(cancellationToken);
        await publisher.PublishAsync(new SampleSubmitted(sample.CompanyId, sample.Id, sample.StyleId), cancellationToken);
        return mapper.Map<SampleDto>(sample);
    }

    public async Task<SampleDto> Handle(ReviseSampleCommand command, CancellationToken cancellationToken)
    {
        var sample = await uow.Samples.GetByIdAsync(command.Id, cancellationToken) ?? throw new KeyNotFoundException("Sample not found.");
        sample.Status = SampleStatuses.Revised;
        sample.Remarks = command.Request.Remarks;
        sample.UpdatedAt = BusinessTime.Now;
        await uow.SaveChangesAsync(cancellationToken);
        return mapper.Map<SampleDto>(sample);
    }

    public async Task<SampleCostingDto> Handle(CreateSampleCostingCommand command, CancellationToken cancellationToken)
    {
        var r = command.Request;
        var costing = new SampleCosting { CompanyId = r.CompanyId, SampleId = command.SampleId, FabricCost = r.FabricCost, TrimsCost = r.TrimsCost, CMCost = r.CMCost, TotalCost = r.FabricCost + r.TrimsCost + r.CMCost };
        db.Add(costing);
        await uow.SaveChangesAsync(cancellationToken);
        return mapper.Map<SampleCostingDto>(costing);
    }

    public async Task<QuotationDto> Handle(CreateQuotationCommand command, CancellationToken cancellationToken)
    {
        var r = command.Request;
        var quotation = new Quotation { CompanyId = r.CompanyId, BuyerId = r.BuyerId, StyleId = r.StyleId, QuotationNo = r.QuotationNo.Trim(), QuotationDate = r.QuotationDate, ValidUntil = r.ValidUntil };
        foreach (var line in r.Lines)
        {
            quotation.Lines.Add(new QuotationLine { CompanyId = r.CompanyId, ItemDescription = line.ItemDescription, Quantity = line.Quantity, UnitPrice = line.UnitPrice, LineTotal = line.Quantity * line.UnitPrice });
        }

        quotation.TotalAmount = quotation.Lines.Sum(x => x.LineTotal);
        await uow.Quotations.AddAsync(quotation, cancellationToken);
        await uow.SaveChangesAsync(cancellationToken);
        await publisher.PublishAsync(new QuotationCreated(quotation.CompanyId, quotation.Id, quotation.QuotationNo), cancellationToken);
        return mapper.Map<QuotationDto>(quotation);
    }

    public async Task<QuotationDto> Handle(UpdateQuotationCommand command, CancellationToken cancellationToken)
    {
        var quotation = await uow.Quotations.GetByIdAsync(command.Id, cancellationToken) ?? throw new KeyNotFoundException("Quotation not found.");
        quotation.ValidUntil = command.Request.ValidUntil;
        quotation.Status = command.Request.Status;
        quotation.UpdatedAt = BusinessTime.Now;
        await uow.SaveChangesAsync(cancellationToken);
        return mapper.Map<QuotationDto>(quotation);
    }

    public async Task<QuotationNegotiationDto> Handle(AddQuotationNegotiationCommand command, CancellationToken cancellationToken)
    {
        var quotation = await uow.Quotations.GetByIdAsync(command.Id, cancellationToken) ?? throw new KeyNotFoundException("Quotation not found.");
        var roundNo = await db.QuotationNegotiations.CountAsync(x => x.QuotationId == quotation.Id, cancellationToken) + 1;
        var negotiation = new QuotationNegotiation { CompanyId = quotation.CompanyId, QuotationId = quotation.Id, RoundNo = roundNo, ProposedAmount = command.Request.ProposedAmount, CounterAmount = command.Request.CounterAmount, Notes = command.Request.Notes, NegotiatedAt = BusinessTime.Now };
        quotation.Status = QuotationStatuses.Negotiating;
        db.Add(negotiation);
        await uow.SaveChangesAsync(cancellationToken);
        return mapper.Map<QuotationNegotiationDto>(negotiation);
    }

    public async Task<OrderDto> Handle(ConvertQuotationToOrderCommand command, CancellationToken cancellationToken)
    {
        var quotation = await uow.Quotations.Query().Include(x => x.Lines).FirstOrDefaultAsync(x => x.Id == command.Id, cancellationToken) ?? throw new KeyNotFoundException("Quotation not found.");
        if (quotation.Status == QuotationStatuses.Converted)
        {
            throw new InvalidOperationException("Quotation already converted.");
        }

        var r = command.Request;
        var order = new Order { CompanyId = quotation.CompanyId, BuyerId = quotation.BuyerId, StyleId = quotation.StyleId, OrderNo = r.OrderNo.Trim(), OrderDate = r.OrderDate, TotalOrderQty = r.TotalOrderQty, UnitPrice = r.UnitPrice, TotalValue = r.TotalOrderQty * r.UnitPrice, CurrencyCode = r.CurrencyCode };
        await uow.Orders.AddAsync(order, cancellationToken);
        quotation.Status = QuotationStatuses.Converted;
        quotation.UpdatedAt = BusinessTime.Now;
        await uow.SaveChangesAsync(cancellationToken);
        await publisher.PublishAsync(new QuotationConverted(quotation.CompanyId, quotation.Id, order.Id), cancellationToken);
        return mapper.Map<OrderDto>(order);
    }

    public async Task<OrderDto> Handle(ConfirmOrderWithOptionsCommand command, CancellationToken cancellationToken)
    {
        var order = await uow.Orders.GetByIdAsync(command.Id, cancellationToken) ?? throw new KeyNotFoundException("Order not found.");
        if (order.OrderStatus == OrderStatuses.Cancelled)
        {
            throw new InvalidOperationException("Cancelled order cannot be confirmed.");
        }

        var breakdownTotal = await uow.Breakdowns.Query().Where(x => x.OrderId == order.Id).SumAsync(x => x.Quantity, cancellationToken);
        if (breakdownTotal == 0 || breakdownTotal != order.TotalOrderQty)
        {
            throw new InvalidOperationException("Color-size breakdown must match order quantity before confirmation.");
        }

        var previous = order.OrderStatus;
        order.OrderStatus = OrderStatuses.Confirmed;
        order.UpdatedAt = BusinessTime.Now;
        db.Add(new OrderStatusHistory { CompanyId = order.CompanyId, OrderId = order.Id, FromStatus = previous, ToStatus = order.OrderStatus, Reason = "Order confirmed." });

        if (command.Options.GenerateTna)
        {
            await GenerateTnaInternalAsync(order, cancellationToken);
        }

        if (command.Options.CreateRequisition)
        {
            await GenerateRequisitionInternalAsync(order, cancellationToken);
            await procurementClient.CreatePurchaseRequisitionFromBomAsync(order.CompanyId, order.Id, cancellationToken);
        }

        await uow.SaveChangesAsync(cancellationToken);
        await cache.RemoveAsync(CacheKeys.OrderDetails(order.Id), cancellationToken);
        await publisher.PublishAsync(new OrderConfirmed(order.CompanyId, order.Id, order.BuyerId, order.StyleId, order.OrderNo, order.TotalOrderQty, order.ShipmentDate), cancellationToken);
        return mapper.Map<OrderDto>(order);
    }

    public async Task<OrderAssignmentDto> Handle(CreateOrderAssignmentCommand command, CancellationToken cancellationToken)
    {
        var order = await uow.Orders.GetByIdAsync(command.OrderId, cancellationToken) ?? throw new KeyNotFoundException("Order not found.");
        var r = command.Request;
        var assignment = new OrderAssignment { CompanyId = r.CompanyId, OrderId = order.Id, AssignedTo = r.AssignedTo.Trim(), Role = r.Role, AssignedAt = BusinessTime.Now };
        db.Add(assignment);
        await uow.SaveChangesAsync(cancellationToken);
        return mapper.Map<OrderAssignmentDto>(assignment);
    }

    public async Task<OrderCommercialTermsDto> Handle(CreateOrderCommercialTermsCommand command, CancellationToken cancellationToken)
    {
        var order = await uow.Orders.GetByIdAsync(command.OrderId, cancellationToken) ?? throw new KeyNotFoundException("Order not found.");
        var r = command.Request;
        var terms = new OrderCommercialTerms { CompanyId = r.CompanyId, OrderId = order.Id, PaymentTerms = r.PaymentTerms, Incoterms = r.Incoterms, LCBank = r.LCBank, Commission = r.Commission };
        db.Add(terms);
        await uow.SaveChangesAsync(cancellationToken);
        return mapper.Map<OrderCommercialTermsDto>(terms);
    }

    public async Task<IReadOnlyList<BomItemDto>> Handle(CopyStyleBomToOrderCommand command, CancellationToken cancellationToken)
    {
        var order = await uow.Orders.GetByIdAsync(command.OrderId, cancellationToken) ?? throw new KeyNotFoundException("Order not found.");
        var styleItems = await db.StyleBomItems.Where(x => x.StyleId == order.StyleId).ToListAsync(cancellationToken);
        var result = new List<BomItem>();
        foreach (var styleItem in styleItems)
        {
            var item = new BomItem { CompanyId = command.Request.CompanyId, OrderId = order.Id, ItemType = styleItem.ItemType, ItemCode = styleItem.ItemCode, ItemName = styleItem.ItemName, UnitName = styleItem.UnitName, Consumption = styleItem.Consumption, WastagePercent = styleItem.WastagePercent, UnitPrice = styleItem.UnitPrice };
            bomCalculator.Calculate(item, order.TotalOrderQty);
            await uow.BomItems.AddAsync(item, cancellationToken);
            result.Add(item);
        }

        await uow.SaveChangesAsync(cancellationToken);
        await cache.RemoveAsync(CacheKeys.BomItems(order.Id), cancellationToken);
        await publisher.PublishAsync(new BomCreated(order.CompanyId, order.Id, result.Count), cancellationToken);
        return mapper.Map<IReadOnlyList<BomItemDto>>(result);
    }

    public async Task<OrderCostingDto> Handle(SubmitCostingApprovalCommand command, CancellationToken cancellationToken)
    {
        var costing = await uow.Costings.Query().FirstOrDefaultAsync(x => x.OrderId == command.OrderId, cancellationToken) ?? throw new KeyNotFoundException("Costing not found.");
        costing.ApprovalStatus = CostingApprovalStatuses.Submitted;
        costing.UpdatedAt = BusinessTime.Now;
        await uow.SaveChangesAsync(cancellationToken);
        await publisher.PublishAsync(new CostingSubmitted(costing.CompanyId, costing.OrderId, costing.Id), cancellationToken);
        return mapper.Map<OrderCostingDto>(costing);
    }

    public async Task<OrderTrimsMatrixDto> Handle(CreateOrderTrimsMatrixCommand command, CancellationToken cancellationToken)
    {
        var order = await uow.Orders.GetByIdAsync(command.OrderId, cancellationToken) ?? throw new KeyNotFoundException("Order not found.");
        var r = command.Request;
        var matrix = new OrderTrimsMatrix { CompanyId = r.CompanyId, OrderId = order.Id, TrimsType = r.TrimsType, ColorName = r.ColorName, SizeName = r.SizeName, Quantity = r.Quantity };
        db.Add(matrix);
        await uow.SaveChangesAsync(cancellationToken);
        return mapper.Map<OrderTrimsMatrixDto>(matrix);
    }

    public async Task<TnaTemplateDto> Handle(CreateTnaTemplateCommand command, CancellationToken cancellationToken)
    {
        var r = command.Request;
        var template = new TnaTemplate { CompanyId = r.CompanyId, TemplateName = r.TemplateName.Trim(), Description = r.Description, IsDefault = r.IsDefault };
        if (r.Milestones is not null)
        {
            foreach (var m in r.Milestones)
            {
                template.Milestones.Add(new TnaMilestone { CompanyId = r.CompanyId, MilestoneName = m.MilestoneName, SequenceNo = m.SequenceNo, PlannedDate = DateOnly.FromDateTime(BusinessTime.Now.AddDays(m.DaysFromStart)), Status = TnaMilestoneStatuses.Pending });
            }
        }

        await uow.TnaTemplates.AddAsync(template, cancellationToken);
        await uow.SaveChangesAsync(cancellationToken);
        return mapper.Map<TnaTemplateDto>(template);
    }

    public async Task<TnaCalendarDto> Handle(GenerateTnaForOrderCommand command, CancellationToken cancellationToken)
    {
        var order = await uow.Orders.GetByIdAsync(command.OrderId, cancellationToken) ?? throw new KeyNotFoundException("Order not found.");
        var calendar = await GenerateTnaInternalAsync(order, cancellationToken);
        await uow.SaveChangesAsync(cancellationToken);
        return mapper.Map<TnaCalendarDto>(calendar);
    }

    public async Task<TnaMilestoneDto> Handle(UpdateTnaMilestoneCommand command, CancellationToken cancellationToken)
    {
        var milestone = await db.TnaMilestones.FirstOrDefaultAsync(x => x.Id == command.Id, cancellationToken) ?? throw new KeyNotFoundException("TNA milestone not found.");
        milestone.ActualDate = command.Request.ActualDate;
        milestone.Status = command.Request.Status;
        milestone.UpdatedAt = BusinessTime.Now;
        await uow.SaveChangesAsync(cancellationToken);
        return mapper.Map<TnaMilestoneDto>(milestone);
    }

    public async Task<TnaDelayLogDto> Handle(LogTnaDelayCommand command, CancellationToken cancellationToken)
    {
        var milestone = await db.TnaMilestones.FirstOrDefaultAsync(x => x.Id == command.MilestoneId, cancellationToken) ?? throw new KeyNotFoundException("TNA milestone not found.");
        var r = command.Request;
        var log = new TnaDelayLog { CompanyId = r.CompanyId, TnaMilestoneId = milestone.Id, DelayDays = r.DelayDays, Reason = r.Reason.Trim(), LoggedAt = BusinessTime.Now };
        milestone.Status = TnaMilestoneStatuses.Delayed;
        db.Add(log);
        await uow.SaveChangesAsync(cancellationToken);
        return mapper.Map<TnaDelayLogDto>(log);
    }

    public async Task<MaterialBookingDto> Handle(CreateMaterialBookingCommand command, CancellationToken cancellationToken)
    {
        var r = command.Request;
        var booking = new MaterialBooking { CompanyId = r.CompanyId, OrderId = r.OrderId, BookingNo = r.BookingNo.Trim(), BookingType = r.BookingType };
        await uow.MaterialBookings.AddAsync(booking, cancellationToken);
        await uow.SaveChangesAsync(cancellationToken);
        await publisher.PublishAsync(new MaterialBookingCreated(booking.CompanyId, booking.Id, booking.OrderId), cancellationToken);
        return mapper.Map<MaterialBookingDto>(booking);
    }

    public async Task<MaterialBookingDto> Handle(AutoCalculateBookingCommand command, CancellationToken cancellationToken)
    {
        var booking = await uow.MaterialBookings.GetByIdAsync(command.BookingId, cancellationToken) ?? throw new KeyNotFoundException("Material booking not found.");
        var bomItems = await uow.BomItems.Query().Where(x => x.OrderId == booking.OrderId).ToListAsync(cancellationToken);
        decimal total = 0;
        foreach (var bom in bomItems.Where(x => booking.BookingType == BookingTypes.Fabric ? x.ItemType == "Fabric" : x.ItemType != "Fabric"))
        {
            if (booking.BookingType == BookingTypes.Fabric)
            {
                db.Add(new FabricBookingDetail { CompanyId = command.Request.CompanyId, MaterialBookingId = booking.Id, ColorName = bom.ItemName, RequiredQty = bom.RequiredQty, BookedQty = bom.RequiredQty });
            }
            else
            {
                db.Add(new TrimsBookingDetail { CompanyId = command.Request.CompanyId, MaterialBookingId = booking.Id, ItemName = bom.ItemName, RequiredQty = bom.RequiredQty, BookedQty = bom.RequiredQty });
            }

            total += bom.RequiredQty;
        }

        booking.TotalQty = total;
        booking.Status = BookingStatuses.Confirmed;
        booking.UpdatedAt = BusinessTime.Now;
        await uow.SaveChangesAsync(cancellationToken);
        return mapper.Map<MaterialBookingDto>(booking);
    }

    public async Task<FabricBookingDetailDto> Handle(CreateFabricBookingDetailCommand command, CancellationToken cancellationToken)
    {
        var r = command.Request;
        var detail = new FabricBookingDetail { CompanyId = r.CompanyId, MaterialBookingId = command.BookingId, FabricTypeId = r.FabricTypeId, ColorName = r.ColorName, RequiredQty = r.RequiredQty, SupplierId = r.SupplierId };
        db.Add(detail);
        await uow.SaveChangesAsync(cancellationToken);
        return mapper.Map<FabricBookingDetailDto>(detail);
    }

    public async Task<TrimsBookingDetailDto> Handle(CreateTrimsBookingDetailCommand command, CancellationToken cancellationToken)
    {
        var r = command.Request;
        var detail = new TrimsBookingDetail { CompanyId = r.CompanyId, MaterialBookingId = command.BookingId, TrimsTypeId = r.TrimsTypeId, ItemName = r.ItemName, RequiredQty = r.RequiredQty, SupplierId = r.SupplierId };
        db.Add(detail);
        await uow.SaveChangesAsync(cancellationToken);
        return mapper.Map<TrimsBookingDetailDto>(detail);
    }

    public async Task<BookingAllocationDto> Handle(CreateBookingAllocationCommand command, CancellationToken cancellationToken)
    {
        var r = command.Request;
        var allocation = new BookingAllocation { CompanyId = r.CompanyId, MaterialBookingId = command.BookingId, DetailId = r.DetailId, DetailType = r.DetailType, AllocatedQty = r.AllocatedQty, AllocationDate = r.AllocationDate };
        db.Add(allocation);
        await uow.SaveChangesAsync(cancellationToken);
        return mapper.Map<BookingAllocationDto>(allocation);
    }

    public async Task<PurchaseRequisitionDto> Handle(CreatePurchaseRequisitionCommand command, CancellationToken cancellationToken)
    {
        var r = command.Request;
        var requisition = new PurchaseRequisition { CompanyId = r.CompanyId, OrderId = r.OrderId, RequisitionNo = r.RequisitionNo.Trim(), RequestedDate = r.RequestedDate };
        if (r.Lines is not null)
        {
            foreach (var line in r.Lines)
            {
                requisition.Lines.Add(new RequisitionLine { CompanyId = r.CompanyId, ItemType = line.ItemType, ItemCode = line.ItemCode, ItemName = line.ItemName, RequiredQty = line.RequiredQty, UnitName = line.UnitName });
            }
        }

        await uow.Requisitions.AddAsync(requisition, cancellationToken);
        await uow.SaveChangesAsync(cancellationToken);
        await publisher.PublishAsync(new RequisitionCreated(requisition.CompanyId, requisition.Id, requisition.OrderId), cancellationToken);
        return mapper.Map<PurchaseRequisitionDto>(requisition);
    }

    public async Task<PurchaseRequisitionDto> Handle(SubmitPurchaseRequisitionCommand command, CancellationToken cancellationToken)
    {
        var requisition = await uow.Requisitions.GetByIdAsync(command.Id, cancellationToken) ?? throw new KeyNotFoundException("Requisition not found.");
        requisition.Status = RequisitionStatuses.Submitted;
        requisition.UpdatedAt = BusinessTime.Now;
        await uow.SaveChangesAsync(cancellationToken);
        await publisher.PublishAsync(new RequisitionSubmitted(requisition.CompanyId, requisition.Id), cancellationToken);
        var poId = await procurementClient.CreatePurchaseOrderFromRequisitionAsync(requisition.CompanyId, requisition.Id, cancellationToken);
        if (poId.HasValue)
        {
            requisition.Status = RequisitionStatuses.Ordered;
            await uow.SaveChangesAsync(cancellationToken);
        }

        return mapper.Map<PurchaseRequisitionDto>(requisition);
    }

    public async Task<PurchaseRequisitionDto> Handle(GenerateRequisitionFromOrderCommand command, CancellationToken cancellationToken)
    {
        var order = await uow.Orders.GetByIdAsync(command.OrderId, cancellationToken) ?? throw new KeyNotFoundException("Order not found.");
        var requisition = await GenerateRequisitionInternalAsync(order, cancellationToken);
        await uow.SaveChangesAsync(cancellationToken);
        return mapper.Map<PurchaseRequisitionDto>(requisition);
    }

    private async Task<TnaCalendar> GenerateTnaInternalAsync(Order order, CancellationToken cancellationToken)
    {
        var existing = await db.TnaCalendars.FirstOrDefaultAsync(x => x.OrderId == order.Id, cancellationToken);
        if (existing is not null)
        {
            return existing;
        }

        var template = await db.TnaTemplates.Where(x => x.CompanyId == order.CompanyId && x.IsDefault).Include(x => x.Milestones).FirstOrDefaultAsync(cancellationToken);
        var startDate = order.OrderDate;
        var calendar = new TnaCalendar { CompanyId = order.CompanyId, OrderId = order.Id, TemplateId = template?.Id, StartDate = startDate, Status = TnaCalendarStatuses.Active };
        if (template?.Milestones.Count > 0)
        {
            foreach (var tm in template.Milestones.OrderBy(x => x.SequenceNo))
            {
                calendar.Milestones.Add(new TnaMilestone { CompanyId = order.CompanyId, MilestoneName = tm.MilestoneName, SequenceNo = tm.SequenceNo, PlannedDate = tm.PlannedDate, Status = TnaMilestoneStatuses.Pending });
            }
        }
        else
        {
            calendar.Milestones.Add(new TnaMilestone { CompanyId = order.CompanyId, MilestoneName = "Fabric Booking", SequenceNo = 1, PlannedDate = startDate.AddDays(7), Status = TnaMilestoneStatuses.Pending });
            calendar.Milestones.Add(new TnaMilestone { CompanyId = order.CompanyId, MilestoneName = "Cutting Start", SequenceNo = 2, PlannedDate = startDate.AddDays(21), Status = TnaMilestoneStatuses.Pending });
            calendar.Milestones.Add(new TnaMilestone { CompanyId = order.CompanyId, MilestoneName = "Shipment", SequenceNo = 3, PlannedDate = order.ShipmentDate ?? startDate.AddDays(60), Status = TnaMilestoneStatuses.Pending });
        }

        db.Add(calendar);
        await publisher.PublishAsync(new TnaGenerated(order.CompanyId, order.Id, calendar.Id), cancellationToken);
        return calendar;
    }

    private async Task<PurchaseRequisition> GenerateRequisitionInternalAsync(Order order, CancellationToken cancellationToken)
    {
        var bomItems = await uow.BomItems.Query().Where(x => x.OrderId == order.Id).ToListAsync(cancellationToken);
        var requisition = new PurchaseRequisition { CompanyId = order.CompanyId, OrderId = order.Id, RequisitionNo = $"REQ-{order.OrderNo}", RequestedDate = DateOnly.FromDateTime(BusinessTime.Now), Status = RequisitionStatuses.Draft };
        foreach (var bom in bomItems)
        {
            requisition.Lines.Add(new RequisitionLine { CompanyId = order.CompanyId, ItemType = bom.ItemType, ItemCode = bom.ItemCode, ItemName = bom.ItemName, RequiredQty = bom.RequiredQty, UnitName = bom.UnitName });
        }

        await uow.Requisitions.AddAsync(requisition, cancellationToken);
        return requisition;
    }
}

public sealed class ExtendedQueryHandlers(IUnitOfWork uow, IMerchandisingDbContext db, IMapper mapper) :
    IRequestHandler<GetBuyerContactsQuery, IReadOnlyList<BuyerContactDto>>,
    IRequestHandler<GetBuyerPaymentTermsQuery, IReadOnlyList<BuyerPaymentTermDto>>,
    IRequestHandler<GetBuyerComplianceRulesQuery, IReadOnlyList<BuyerComplianceRuleDto>>,
    IRequestHandler<GetQuotationNegotiationsQuery, IReadOnlyList<QuotationNegotiationDto>>,
    IRequestHandler<GetStyleVersionsQuery, IReadOnlyList<StyleVersionDto>>,
    IRequestHandler<GetStyleBomItemsQuery, IReadOnlyList<StyleBomItemDto>>,
    IRequestHandler<GetQuotationsQuery, IReadOnlyList<QuotationDto>>,
    IRequestHandler<GetQuotationByIdQuery, QuotationDto>,
    IRequestHandler<GetOrderWorksheetQuery, ProgramOrderWorksheetDto>,
    IRequestHandler<GetTnaCalendarByOrderQuery, TnaCalendarDto?>,
    IRequestHandler<GetMaterialBookingsQuery, IReadOnlyList<MaterialBookingDto>>,
    IRequestHandler<GetPurchaseRequisitionsQuery, IReadOnlyList<PurchaseRequisitionDto>>
{
    public async Task<IReadOnlyList<BuyerContactDto>> Handle(GetBuyerContactsQuery query, CancellationToken cancellationToken)
    {
        var rows = await db.BuyerContacts.Where(x => x.BuyerId == query.BuyerId).ToListAsync(cancellationToken);
        return mapper.Map<IReadOnlyList<BuyerContactDto>>(rows);
    }

    public async Task<IReadOnlyList<BuyerPaymentTermDto>> Handle(GetBuyerPaymentTermsQuery query, CancellationToken cancellationToken)
    {
        var rows = await db.BuyerPaymentTerms.Where(x => x.BuyerId == query.BuyerId).OrderBy(x => x.TermName).ToListAsync(cancellationToken);
        return mapper.Map<IReadOnlyList<BuyerPaymentTermDto>>(rows);
    }

    public async Task<IReadOnlyList<BuyerComplianceRuleDto>> Handle(GetBuyerComplianceRulesQuery query, CancellationToken cancellationToken)
    {
        var rows = await db.BuyerComplianceRules.Where(x => x.BuyerId == query.BuyerId).OrderBy(x => x.RuleName).ToListAsync(cancellationToken);
        return mapper.Map<IReadOnlyList<BuyerComplianceRuleDto>>(rows);
    }

    public async Task<IReadOnlyList<QuotationNegotiationDto>> Handle(GetQuotationNegotiationsQuery query, CancellationToken cancellationToken)
    {
        var rows = await db.QuotationNegotiations
            .Where(x => x.QuotationId == query.QuotationId && x.CompanyId == query.CompanyId)
            .OrderBy(x => x.RoundNo)
            .ToListAsync(cancellationToken);
        return mapper.Map<IReadOnlyList<QuotationNegotiationDto>>(rows);
    }

    public async Task<IReadOnlyList<StyleVersionDto>> Handle(GetStyleVersionsQuery query, CancellationToken cancellationToken)
    {
        var rows = await db.StyleVersions.Where(x => x.StyleId == query.StyleId).OrderBy(x => x.VersionNo).ToListAsync(cancellationToken);
        return mapper.Map<IReadOnlyList<StyleVersionDto>>(rows);
    }

    public async Task<IReadOnlyList<StyleBomItemDto>> Handle(GetStyleBomItemsQuery query, CancellationToken cancellationToken)
    {
        var rows = await db.StyleBomItems.Where(x => x.StyleId == query.StyleId).ToListAsync(cancellationToken);
        return mapper.Map<IReadOnlyList<StyleBomItemDto>>(rows);
    }

    public async Task<IReadOnlyList<QuotationDto>> Handle(GetQuotationsQuery query, CancellationToken cancellationToken)
    {
        var q = uow.Quotations.Query().Where(x => x.CompanyId == query.CompanyId);
        if (query.BuyerId.HasValue) q = q.Where(x => x.BuyerId == query.BuyerId.Value);
        var rows = await q.OrderByDescending(x => x.QuotationDate).ToListAsync(cancellationToken);
        return mapper.Map<IReadOnlyList<QuotationDto>>(rows);
    }

    public async Task<QuotationDto> Handle(GetQuotationByIdQuery query, CancellationToken cancellationToken)
    {
        var quotation = await uow.Quotations.Query().Include(x => x.Lines).FirstOrDefaultAsync(x => x.Id == query.Id && x.CompanyId == query.CompanyId, cancellationToken) ?? throw new KeyNotFoundException("Quotation not found.");
        return mapper.Map<QuotationDto>(quotation);
    }

    public async Task<ProgramOrderWorksheetDto> Handle(GetOrderWorksheetQuery query, CancellationToken cancellationToken)
    {
        var order = await uow.Orders.Query().Include(x => x.Buyer).Include(x => x.Style).FirstOrDefaultAsync(x => x.Id == query.OrderId, cancellationToken) ?? throw new KeyNotFoundException("Order not found.");
        var breakdowns = await uow.Breakdowns.Query().Where(x => x.OrderId == order.Id).ToListAsync(cancellationToken);
        var colors = breakdowns.GroupBy(x => x.ColorName).Select(g => new ProgramColorWorksheetDto(g.Key, g.Select(b => new ProgramSizeBreakdownWorksheetDto(b.SizeName, b.Quantity)).ToList())).ToList();
        var article = new ProgramArticleWorksheetDto(order.Style?.StyleNo ?? "", order.Style?.StyleName, order.TotalOrderQty, colors);
        return new ProgramOrderWorksheetDto(order.Id, order.CompanyId, order.OrderNo, order.Buyer?.BuyerName ?? "", order.Buyer?.BuyerName, order.Style?.FabricDescription, order.Style?.StyleName, order.OrderDate, order.OrderStatus, [article]);
    }

    public async Task<TnaCalendarDto?> Handle(GetTnaCalendarByOrderQuery query, CancellationToken cancellationToken)
    {
        var calendar = await db.TnaCalendars.Include(x => x.Milestones).FirstOrDefaultAsync(x => x.OrderId == query.OrderId, cancellationToken);
        return calendar is null ? null : mapper.Map<TnaCalendarDto>(calendar);
    }

    public async Task<IReadOnlyList<MaterialBookingDto>> Handle(GetMaterialBookingsQuery query, CancellationToken cancellationToken)
    {
        var q = uow.MaterialBookings.Query().Where(x => x.CompanyId == query.CompanyId);
        if (query.OrderId.HasValue) q = q.Where(x => x.OrderId == query.OrderId.Value);
        var rows = await q.OrderByDescending(x => x.CreatedAt).ToListAsync(cancellationToken);
        return mapper.Map<IReadOnlyList<MaterialBookingDto>>(rows);
    }

    public async Task<IReadOnlyList<PurchaseRequisitionDto>> Handle(GetPurchaseRequisitionsQuery query, CancellationToken cancellationToken)
    {
        var q = uow.Requisitions.Query().Where(x => x.CompanyId == query.CompanyId);
        if (query.OrderId.HasValue) q = q.Where(x => x.OrderId == query.OrderId.Value);
        var rows = await q.OrderByDescending(x => x.RequestedDate).ToListAsync(cancellationToken);
        return mapper.Map<IReadOnlyList<PurchaseRequisitionDto>>(rows);
    }
}
