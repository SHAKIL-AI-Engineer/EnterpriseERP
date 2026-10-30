using SewingService.Application;
using SewingService.Domain;
using SewingService.Infrastructure.Persistence;

namespace SewingService.Infrastructure.Repositories;

public sealed class UnitOfWork(SewingDbContext db) : IUnitOfWork
{
    public IRepository<SewingLine> SewingLines { get; } = new EfRepository<SewingLine>(db);
    public IRepository<ProductionAssignment> Assignments { get; } = new EfRepository<ProductionAssignment>(db);
    public IRepository<ProductionTarget> Targets { get; } = new EfRepository<ProductionTarget>(db);
    public IRepository<DailyProductionRecord> DailyRecords { get; } = new EfRepository<DailyProductionRecord>(db);
    public IRepository<SewingOutput> Outputs { get; } = new EfRepository<SewingOutput>(db);
    public IRepository<PanelTransferReceipt> PanelReceipts { get; } = new EfRepository<PanelTransferReceipt>(db);
    public IRepository<SewingBalance> Balances { get; } = new EfRepository<SewingBalance>(db);
    public Task<int> SaveChangesAsync(CancellationToken cancellationToken = default) => db.SaveChangesAsync(cancellationToken);
}
