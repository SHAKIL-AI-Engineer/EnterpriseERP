using MerchandisingService.Contracts;
using MerchandisingService.Domain;

namespace MerchandisingService.Application;

public interface IMerchandisingDbContext
{
    IQueryable<Buyer> Buyers { get; }
    IQueryable<Season> Seasons { get; }
    IQueryable<GarmentItem> GarmentItems { get; }
    IQueryable<Style> Styles { get; }
    IQueryable<Order> Orders { get; }
    IQueryable<BuyerPurchaseOrder> BuyerPurchaseOrders { get; }
    IQueryable<OrderColorSizeBreakdown> OrderColorSizeBreakdowns { get; }
    IQueryable<BomItem> BomItems { get; }
    IQueryable<OrderCosting> OrderCostings { get; }
    IQueryable<Sample> Samples { get; }
    IQueryable<ShipmentPlan> ShipmentPlans { get; }
    IQueryable<OrderStatusHistory> OrderStatusHistories { get; }
    IQueryable<MerchandisingAuditLog> AuditLogs { get; }
    IQueryable<ColorMaster> ColorMasters { get; }
    IQueryable<SizeMaster> SizeMasters { get; }
    IQueryable<SizeRatioTemplate> SizeRatioTemplates { get; }
    IQueryable<UnitMaster> UnitMasters { get; }
    IQueryable<CurrencyMaster> CurrencyMasters { get; }
    IQueryable<FabricTypeMaster> FabricTypeMasters { get; }
    IQueryable<TrimsTypeMaster> TrimsTypeMasters { get; }
    IQueryable<SupplierMaster> SupplierMasters { get; }
    IQueryable<Brand> Brands { get; }
    IQueryable<GarmentCategory> GarmentCategories { get; }
    IQueryable<BuyerContact> BuyerContacts { get; }
    IQueryable<BuyerPaymentTerm> BuyerPaymentTerms { get; }
    IQueryable<BuyerComplianceRule> BuyerComplianceRules { get; }
    IQueryable<StyleVersion> StyleVersions { get; }
    IQueryable<StyleBomItem> StyleBomItems { get; }
    IQueryable<SampleCosting> SampleCostings { get; }
    IQueryable<Quotation> Quotations { get; }
    IQueryable<QuotationLine> QuotationLines { get; }
    IQueryable<QuotationNegotiation> QuotationNegotiations { get; }
    IQueryable<OrderAssignment> OrderAssignments { get; }
    IQueryable<OrderCommercialTerms> OrderCommercialTerms { get; }
    IQueryable<OrderTrimsMatrix> OrderTrimsMatrices { get; }
    IQueryable<TnaTemplate> TnaTemplates { get; }
    IQueryable<TnaCalendar> TnaCalendars { get; }
    IQueryable<TnaMilestone> TnaMilestones { get; }
    IQueryable<TnaDelayLog> TnaDelayLogs { get; }
    IQueryable<MaterialBooking> MaterialBookings { get; }
    IQueryable<FabricBookingDetail> FabricBookingDetails { get; }
    IQueryable<TrimsBookingDetail> TrimsBookingDetails { get; }
    IQueryable<BookingAllocation> BookingAllocations { get; }
    IQueryable<PurchaseRequisition> PurchaseRequisitions { get; }
    IQueryable<RequisitionLine> RequisitionLines { get; }
    IQueryable<StyleDocument> StyleDocuments { get; }
    IQueryable<OrderDocument> OrderDocuments { get; }
    IQueryable<CommunicationLog> CommunicationLogs { get; }
    IQueryable<ApprovalRequest> ApprovalRequests { get; }
    IQueryable<ApprovalStep> ApprovalSteps { get; }
    IQueryable<ShipmentExecution> ShipmentExecutions { get; }
    IQueryable<PackingList> PackingLists { get; }
    IQueryable<CartonBreakdown> CartonBreakdowns { get; }
    void Add<TEntity>(TEntity entity) where TEntity : class;
    void Remove<TEntity>(TEntity entity) where TEntity : class;
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}

public interface IRepository<TEntity> where TEntity : class
{
    IQueryable<TEntity> Query();
    Task<TEntity?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task AddAsync(TEntity entity, CancellationToken cancellationToken = default);
    void Remove(TEntity entity);
}

public interface IUnitOfWork
{
    IRepository<Buyer> Buyers { get; }
    IRepository<Season> Seasons { get; }
    IRepository<GarmentItem> GarmentItems { get; }
    IRepository<Style> Styles { get; }
    IRepository<Order> Orders { get; }
    IRepository<BuyerPurchaseOrder> BuyerPurchaseOrders { get; }
    IRepository<OrderColorSizeBreakdown> Breakdowns { get; }
    IRepository<BomItem> BomItems { get; }
    IRepository<OrderCosting> Costings { get; }
    IRepository<Sample> Samples { get; }
    IRepository<ShipmentPlan> ShipmentPlans { get; }
    IRepository<Quotation> Quotations { get; }
    IRepository<MaterialBooking> MaterialBookings { get; }
    IRepository<PurchaseRequisition> Requisitions { get; }
    IRepository<TnaCalendar> TnaCalendars { get; }
    IRepository<TnaTemplate> TnaTemplates { get; }
    IRepository<StyleDocument> StyleDocuments { get; }
    IRepository<OrderDocument> OrderDocuments { get; }
    IRepository<CommunicationLog> CommunicationLogs { get; }
    IRepository<ApprovalRequest> ApprovalRequests { get; }
    IRepository<ShipmentExecution> ShipmentExecutions { get; }
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}

public interface IRedisCacheService
{
    Task<T?> GetAsync<T>(string key, CancellationToken cancellationToken = default);
    Task SetAsync<T>(string key, T value, TimeSpan expiration, CancellationToken cancellationToken = default);
    Task RemoveAsync(string key, CancellationToken cancellationToken = default);
}

public interface IIntegrationEventPublisher
{
    Task PublishAsync<TEvent>(TEvent integrationEvent, CancellationToken cancellationToken = default) where TEvent : IntegrationEvent;
}

public interface IBomCalculationService
{
    BomItem Calculate(BomItem item, int orderQuantity);
    BomCalculationResultDto Summarize(Guid orderId, IReadOnlyCollection<BomItem> items);
}

public interface ICostingCalculationService
{
    OrderCosting Calculate(OrderCosting costing);
}

public interface ICompanyServiceClient
{
    Task<CompanySnapshot?> GetCompanyAsync(Guid companyId, CancellationToken cancellationToken = default);
}

public interface IInventoryServiceClient
{
    Task<bool> CheckItemExistsAsync(Guid companyId, Guid itemId, CancellationToken cancellationToken = default);
    Task<decimal> GetStockBalanceAsync(Guid companyId, Guid itemId, CancellationToken cancellationToken = default);
}

public interface IProcurementServiceClient
{
    Task<Guid?> CreatePurchaseRequisitionFromBomAsync(Guid companyId, Guid orderId, CancellationToken cancellationToken = default);
    Task<Guid?> CreatePurchaseOrderFromRequisitionAsync(Guid companyId, Guid requisitionId, CancellationToken cancellationToken = default);
}

public interface ITnaGenerationService
{
    TnaCalendar GenerateFromTemplate(Order order, TnaTemplate template, DateOnly startDate);
}

public interface IProductionServiceClient
{
    Task<string?> GetOrderProductionStatusAsync(Guid companyId, Guid orderId, CancellationToken cancellationToken = default);
}

public interface IShipmentServiceClient
{
    Task<string?> GetShipmentStatusAsync(Guid companyId, Guid orderId, CancellationToken cancellationToken = default);
}

public sealed record CompanySnapshot(Guid CompanyId, string CompanyCode, string CompanyName);
