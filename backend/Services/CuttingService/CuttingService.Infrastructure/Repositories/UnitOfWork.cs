using CuttingService.Application;
using CuttingService.Domain;
using CuttingService.Infrastructure.Persistence;

namespace CuttingService.Infrastructure.Repositories;

public sealed class UnitOfWork(CuttingDbContext db) : IUnitOfWork
{
    public IRepository<CuttingPlan> CuttingPlans { get; } = new EfRepository<CuttingPlan>(db);
    public IRepository<CuttingPlanSizeBreakdown> SizeBreakdowns { get; } = new EfRepository<CuttingPlanSizeBreakdown>(db);
    public IRepository<FabricIssueToCutting> FabricIssues { get; } = new EfRepository<FabricIssueToCutting>(db);
    public IRepository<CuttingLay> Lays { get; } = new EfRepository<CuttingLay>(db);
    public IRepository<CuttingOutput> Outputs { get; } = new EfRepository<CuttingOutput>(db);
    public IRepository<CuttingWastage> Wastages { get; } = new EfRepository<CuttingWastage>(db);
    public IRepository<CuttingBalance> Balances { get; } = new EfRepository<CuttingBalance>(db);
    public IRepository<CuttingPanelTransfer> PanelTransfers { get; } = new EfRepository<CuttingPanelTransfer>(db);
    public IRepository<CuttingBundle> Bundles { get; } = new EfRepository<CuttingBundle>(db);
    public Task<int> SaveChangesAsync(CancellationToken cancellationToken = default) => db.SaveChangesAsync(cancellationToken);
}
