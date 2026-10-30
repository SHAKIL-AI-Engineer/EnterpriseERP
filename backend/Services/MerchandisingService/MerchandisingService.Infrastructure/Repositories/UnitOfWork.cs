using MerchandisingService.Application;
using MerchandisingService.Domain;
using MerchandisingService.Infrastructure.Persistence;

namespace MerchandisingService.Infrastructure.Repositories;

public sealed class UnitOfWork(MerchandisingDbContext db) : IUnitOfWork
{
    public IRepository<Buyer> Buyers { get; } = new EfRepository<Buyer>(db);
    public IRepository<Season> Seasons { get; } = new EfRepository<Season>(db);
    public IRepository<GarmentItem> GarmentItems { get; } = new EfRepository<GarmentItem>(db);
    public IRepository<Style> Styles { get; } = new EfRepository<Style>(db);
    public IRepository<Order> Orders { get; } = new EfRepository<Order>(db);
    public IRepository<BuyerPurchaseOrder> BuyerPurchaseOrders { get; } = new EfRepository<BuyerPurchaseOrder>(db);
    public IRepository<OrderColorSizeBreakdown> Breakdowns { get; } = new EfRepository<OrderColorSizeBreakdown>(db);
    public IRepository<BomItem> BomItems { get; } = new EfRepository<BomItem>(db);
    public IRepository<OrderCosting> Costings { get; } = new EfRepository<OrderCosting>(db);
    public IRepository<Sample> Samples { get; } = new EfRepository<Sample>(db);
    public IRepository<ShipmentPlan> ShipmentPlans { get; } = new EfRepository<ShipmentPlan>(db);
    public IRepository<Quotation> Quotations { get; } = new EfRepository<Quotation>(db);
    public IRepository<MaterialBooking> MaterialBookings { get; } = new EfRepository<MaterialBooking>(db);
    public IRepository<PurchaseRequisition> Requisitions { get; } = new EfRepository<PurchaseRequisition>(db);
    public IRepository<TnaCalendar> TnaCalendars { get; } = new EfRepository<TnaCalendar>(db);
    public IRepository<TnaTemplate> TnaTemplates { get; } = new EfRepository<TnaTemplate>(db);
    public IRepository<StyleDocument> StyleDocuments { get; } = new EfRepository<StyleDocument>(db);
    public IRepository<OrderDocument> OrderDocuments { get; } = new EfRepository<OrderDocument>(db);
    public IRepository<CommunicationLog> CommunicationLogs { get; } = new EfRepository<CommunicationLog>(db);
    public IRepository<ApprovalRequest> ApprovalRequests { get; } = new EfRepository<ApprovalRequest>(db);
    public IRepository<ShipmentExecution> ShipmentExecutions { get; } = new EfRepository<ShipmentExecution>(db);

    public Task<int> SaveChangesAsync(CancellationToken cancellationToken = default) => db.SaveChangesAsync(cancellationToken);
}
