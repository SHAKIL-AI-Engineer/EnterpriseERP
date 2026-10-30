using SecurityService.Contracts;
using SecurityService.Domain;

namespace SecurityService.Application;

public interface ISecurityDbContext
{
    IQueryable<Gate> Gates { get; }
    IQueryable<Visitor> Visitors { get; }
    IQueryable<VisitorEntry> VisitorEntries { get; }
    IQueryable<EmployeeOutPass> EmployeeOutPasses { get; }
    IQueryable<Vehicle> Vehicles { get; }
    IQueryable<VehicleEntry> VehicleEntries { get; }
    IQueryable<GatePass> GatePasses { get; }
    IQueryable<GatePassItem> GatePassItems { get; }
    IQueryable<ReturnableGatePassReturn> ReturnableGatePassReturns { get; }
    IQueryable<ReturnableGatePassReturnItem> ReturnableGatePassReturnItems { get; }
    IQueryable<Chalan> Chalans { get; }
    IQueryable<ChalanItem> ChalanItems { get; }
    IQueryable<BillEntry> BillEntries { get; }
    IQueryable<SecurityCheckLog> SecurityCheckLogs { get; }
    IQueryable<GateActionLog> GateActionLogs { get; }
    IQueryable<ExternalReferenceSnapshot> ExternalReferenceSnapshots { get; }

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
    IRepository<TEntity> Repository<TEntity>() where TEntity : class;
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}

public interface ICurrentUserService
{
    Guid? UserId { get; }
}

public interface IRedisCacheService
{
    Task<T?> GetAsync<T>(string key, CancellationToken cancellationToken = default);
    Task SetAsync<T>(string key, T value, TimeSpan ttl, CancellationToken cancellationToken = default);
    Task RemoveAsync(string key, CancellationToken cancellationToken = default);
}

public interface IIntegrationEventPublisher
{
    Task PublishAsync(IntegrationEvent integrationEvent, CancellationToken cancellationToken = default);
}

public interface IEmployeeServiceClient
{
    Task<object?> GetEmployeeAsync(Guid companyId, Guid employeeId, CancellationToken cancellationToken = default);
    Task<bool> IsEmployeeActiveAsync(Guid companyId, Guid employeeId, CancellationToken cancellationToken = default);
}

public interface IInventoryServiceClient
{
    Task<object?> GetStockIssueAsync(Guid companyId, Guid issueId, CancellationToken cancellationToken = default);
}

public interface IProcurementServiceClient
{
    Task<object?> GetSupplierAsync(Guid companyId, Guid supplierId, CancellationToken cancellationToken = default);
}

public interface IMerchandisingServiceClient
{
    Task<object?> GetBuyerAsync(Guid companyId, Guid buyerId, CancellationToken cancellationToken = default);
    Task<object?> GetOrderAsync(Guid companyId, Guid orderId, CancellationToken cancellationToken = default);
}

public interface IAccountsServiceClient
{
    Task CreatePayableFromBillEntryAsync(Guid companyId, Guid billEntryId, CancellationToken cancellationToken = default);
}

public interface IImportExportServiceClient
{
    Task<ExportResultDto> ExportGateReportAsync(ReportExportRequest request, CancellationToken cancellationToken = default);
}

public interface IVisitorEntryService
{
    Task<VisitorEntryDto> CreateAsync(CreateVisitorEntryRequest request, CancellationToken cancellationToken = default);
    Task<VisitorEntryDto> CheckoutAsync(Guid id, DateTime outTime, CancellationToken cancellationToken = default);
    Task<VisitorEntryDto> CancelAsync(Guid id, CancellationToken cancellationToken = default);
}

public interface IEmployeeOutPassService
{
    Task<EmployeeOutPassDto> CreateAsync(CreateEmployeeOutPassRequest request, CancellationToken cancellationToken = default);
    Task<EmployeeOutPassDto> ApproveAsync(Guid id, CancellationToken cancellationToken = default);
    Task<EmployeeOutPassDto> MarkOutAsync(Guid id, CancellationToken cancellationToken = default);
    Task<EmployeeOutPassDto> MarkReturnedAsync(Guid id, DateTime actualReturnTime, CancellationToken cancellationToken = default);
    Task<EmployeeOutPassDto> CancelAsync(Guid id, CancellationToken cancellationToken = default);
}

public interface IVehicleEntryService
{
    Task<VehicleEntryDto> CreateAsync(CreateVehicleEntryRequest request, CancellationToken cancellationToken = default);
    Task<VehicleEntryDto> ExitAsync(Guid id, DateTime outTime, CancellationToken cancellationToken = default);
}

public interface IGatePassService
{
    Task<GatePassDto> CreateAsync(CreateGatePassRequest request, CancellationToken cancellationToken = default);
    Task<GatePassDto> SubmitAsync(Guid id, CancellationToken cancellationToken = default);
    Task<GatePassDto> ApproveAsync(Guid id, CancellationToken cancellationToken = default);
    Task<GatePassDto> IssueAsync(Guid id, CancellationToken cancellationToken = default);
    Task<GatePassDto> CompleteAsync(Guid id, CancellationToken cancellationToken = default);
    Task<GatePassDto> CancelAsync(Guid id, CancellationToken cancellationToken = default);
}

public interface IChalanService
{
    Task<ChalanDto> CreateAsync(CreateChalanRequest request, CancellationToken cancellationToken = default);
    Task<ChalanDto> ApproveAsync(Guid id, CancellationToken cancellationToken = default);
    Task<ChalanDto> CancelAsync(Guid id, CancellationToken cancellationToken = default);
}

public interface IBillEntryService
{
    Task<BillEntryDto> CreateAsync(CreateBillEntryRequest request, CancellationToken cancellationToken = default);
    Task<BillEntryDto> ApproveAsync(Guid id, CancellationToken cancellationToken = default);
    Task<BillEntryDto> RejectAsync(Guid id, CancellationToken cancellationToken = default);
    Task<BillEntryDto> SendToAccountsAsync(Guid id, CancellationToken cancellationToken = default);
}

public interface ISecurityCheckService
{
    Task<SecurityCheckLogDto> CreateAsync(CreateSecurityCheckRequest request, CancellationToken cancellationToken = default);
}

public interface IReportDataBuilderService
{
    Task<DailyGateRegisterDto> BuildDailyRegisterAsync(Guid companyId, DateOnly date, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<VisitorEntryDto>> BuildVisitorReportAsync(Guid companyId, DateOnly fromDate, DateOnly toDate, CancellationToken cancellationToken = default);
    Task<MaterialInOutReportDto> BuildMaterialInOutAsync(Guid companyId, DateOnly fromDate, DateOnly toDate, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<VehicleEntryDto>> BuildVehicleReportAsync(Guid companyId, DateOnly fromDate, DateOnly toDate, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<ReturnablePendingDto>> BuildReturnablePendingAsync(Guid companyId, CancellationToken cancellationToken = default);
    Task<ExportResultDto> ExportAsync(ReportExportApiRequest request, CancellationToken cancellationToken = default);
}
