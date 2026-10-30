using FinishingService.Application;
using FinishingService.Domain;
using FinishingService.Infrastructure.Persistence;

namespace FinishingService.Infrastructure.Repositories;

public sealed class UnitOfWork(FinishingDbContext db) : IUnitOfWork
{
    private IRepository<FinishingReceive>? _receives;
    private IRepository<FinishingReceiveItem>? _receiveItems;
    private IRepository<FinishingBatch>? _batches;
    private IRepository<FinishingInput>? _inputs;
    private IRepository<IroningOutput>? _ironings;
    private IRepository<FinishingQC>? _qcs;
    private IRepository<FinishingDefect>? _defects;
    private IRepository<FoldingPacking>? _foldings;
    private IRepository<CartonPacking>? _cartons;
    private IRepository<CartonPackingItem>? _cartonItems;
    private IRepository<FinishedGoodsTransfer>? _transfers;
    private IRepository<FinishedGoodsTransferItem>? _transferItems;
    private IRepository<FinishingWastage>? _wastages;
    private IRepository<FinishingBalance>? _balances;

    public IRepository<FinishingReceive> FinishingReceives => _receives ??= new EfRepository<FinishingReceive>(db);
    public IRepository<FinishingReceiveItem> FinishingReceiveItems => _receiveItems ??= new EfRepository<FinishingReceiveItem>(db);
    public IRepository<FinishingBatch> FinishingBatches => _batches ??= new EfRepository<FinishingBatch>(db);
    public IRepository<FinishingInput> FinishingInputs => _inputs ??= new EfRepository<FinishingInput>(db);
    public IRepository<IroningOutput> IroningOutputs => _ironings ??= new EfRepository<IroningOutput>(db);
    public IRepository<FinishingQC> FinishingQCs => _qcs ??= new EfRepository<FinishingQC>(db);
    public IRepository<FinishingDefect> FinishingDefects => _defects ??= new EfRepository<FinishingDefect>(db);
    public IRepository<FoldingPacking> FoldingPackings => _foldings ??= new EfRepository<FoldingPacking>(db);
    public IRepository<CartonPacking> CartonPackings => _cartons ??= new EfRepository<CartonPacking>(db);
    public IRepository<CartonPackingItem> CartonPackingItems => _cartonItems ??= new EfRepository<CartonPackingItem>(db);
    public IRepository<FinishedGoodsTransfer> FinishedGoodsTransfers => _transfers ??= new EfRepository<FinishedGoodsTransfer>(db);
    public IRepository<FinishedGoodsTransferItem> FinishedGoodsTransferItems => _transferItems ??= new EfRepository<FinishedGoodsTransferItem>(db);
    public IRepository<FinishingWastage> FinishingWastages => _wastages ??= new EfRepository<FinishingWastage>(db);
    public IRepository<FinishingBalance> Balances => _balances ??= new EfRepository<FinishingBalance>(db);

    public Task<int> SaveChangesAsync(CancellationToken cancellationToken = default) =>
        db.SaveChangesAsync(cancellationToken);
}
