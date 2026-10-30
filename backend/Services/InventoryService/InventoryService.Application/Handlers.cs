using Erp.BuildingBlocks.SharedKernel;
using MediatR;
using InventoryService.Contracts;
using InventoryService.Domain;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace InventoryService.Application;

public interface IInventoryDbContext
{
    IQueryable<StockItem> StockItems { get; }
    IQueryable<StockTransaction> StockTransactions { get; }
    void Add<T>(T entity) where T : class;
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}

public sealed record ReceiveStockCommand(ReceiveStockRequest Request) : IRequest<StockItemDto>;
public sealed record IssueStockCommand(Guid ItemId, IssueStockRequest Request) : IRequest<StockItemDto>;
public sealed record GetStockItemsQuery(Guid CompanyId, string? Search) : IRequest<IReadOnlyList<StockItemDto>>;
public sealed record GetStockItemByIdQuery(Guid CompanyId, Guid Id) : IRequest<StockItemDto?>;
public sealed record GetStockTransactionsQuery(Guid CompanyId, Guid? ItemId, int Limit) : IRequest<IReadOnlyList<StockTransactionDto>>;
public sealed record GetItemTransactionsQuery(Guid CompanyId, Guid ItemId) : IRequest<IReadOnlyList<StockTransactionDto>>;

public sealed class InventoryHandlers(IInventoryDbContext db) :
    IRequestHandler<ReceiveStockCommand, StockItemDto>,
    IRequestHandler<IssueStockCommand, StockItemDto>,
    IRequestHandler<GetStockItemsQuery, IReadOnlyList<StockItemDto>>,
    IRequestHandler<GetStockItemByIdQuery, StockItemDto?>,
    IRequestHandler<GetStockTransactionsQuery, IReadOnlyList<StockTransactionDto>>,
    IRequestHandler<GetItemTransactionsQuery, IReadOnlyList<StockTransactionDto>>
{
    public async Task<StockItemDto> Handle(ReceiveStockCommand command, CancellationToken cancellationToken)
    {
        var r = command.Request;
        var item = await db.StockItems.FirstOrDefaultAsync(x => x.CompanyId == r.CompanyId && x.ItemCode == r.ItemCode, cancellationToken);
        if (item is null)
        {
            item = new StockItem { CompanyId = r.CompanyId, ItemCode = r.ItemCode.Trim(), ItemName = r.ItemName.Trim(), UnitName = r.UnitName.Trim() };
            db.Add(item);
        }

        item.BalanceQty += r.Quantity;
        item.UpdatedAt = BusinessTime.Now;
        db.Add(new StockTransaction { CompanyId = r.CompanyId, StockItemId = item.Id, TransactionType = "Receive", Quantity = r.Quantity, ReferenceNo = r.ReferenceNo });
        await db.SaveChangesAsync(cancellationToken);
        return new StockItemDto(item.Id, item.CompanyId, item.ItemCode, item.ItemName, item.UnitName, item.BalanceQty);
    }

    public async Task<StockItemDto> Handle(IssueStockCommand command, CancellationToken cancellationToken)
    {
        var item = await db.StockItems.FirstOrDefaultAsync(x => x.Id == command.ItemId && x.CompanyId == command.Request.CompanyId, cancellationToken) ?? throw new KeyNotFoundException("Stock item not found.");
        if (item.BalanceQty < command.Request.Quantity)
        {
            throw new InvalidOperationException("Insufficient stock balance.");
        }

        item.BalanceQty -= command.Request.Quantity;
        item.UpdatedAt = BusinessTime.Now;
        db.Add(new StockTransaction { CompanyId = item.CompanyId, StockItemId = item.Id, TransactionType = "Issue", Quantity = command.Request.Quantity, ReferenceNo = command.Request.ReferenceNo });
        await db.SaveChangesAsync(cancellationToken);
        return new StockItemDto(item.Id, item.CompanyId, item.ItemCode, item.ItemName, item.UnitName, item.BalanceQty);
    }

    public async Task<IReadOnlyList<StockItemDto>> Handle(GetStockItemsQuery query, CancellationToken cancellationToken)
    {
        var q = db.StockItems.Where(x => x.CompanyId == query.CompanyId);
        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var s = query.Search.Trim();
            q = q.Where(x => x.ItemCode.Contains(s) || x.ItemName.Contains(s));
        }
        var rows = await q.OrderBy(x => x.ItemCode).ToListAsync(cancellationToken);
        return rows.Select(x => new StockItemDto(x.Id, x.CompanyId, x.ItemCode, x.ItemName, x.UnitName, x.BalanceQty)).ToList();
    }

    public async Task<StockItemDto?> Handle(GetStockItemByIdQuery query, CancellationToken cancellationToken)
    {
        var item = await db.StockItems.FirstOrDefaultAsync(x => x.Id == query.Id && x.CompanyId == query.CompanyId, cancellationToken);
        return item is null ? null : new StockItemDto(item.Id, item.CompanyId, item.ItemCode, item.ItemName, item.UnitName, item.BalanceQty);
    }

    public async Task<IReadOnlyList<StockTransactionDto>> Handle(GetStockTransactionsQuery query, CancellationToken cancellationToken)
    {
        var q = db.StockTransactions.Where(x => x.CompanyId == query.CompanyId);
        if (query.ItemId.HasValue) q = q.Where(x => x.StockItemId == query.ItemId.Value);
        var rows = await q.OrderByDescending(x => x.TransactionDate).Take(Math.Clamp(query.Limit, 1, 500)).ToListAsync(cancellationToken);
        return await MapTransactions(rows, cancellationToken);
    }

    public async Task<IReadOnlyList<StockTransactionDto>> Handle(GetItemTransactionsQuery query, CancellationToken cancellationToken)
    {
        var rows = await db.StockTransactions
            .Where(x => x.CompanyId == query.CompanyId && x.StockItemId == query.ItemId)
            .OrderByDescending(x => x.TransactionDate)
            .ToListAsync(cancellationToken);
        return await MapTransactions(rows, cancellationToken);
    }

    private async Task<IReadOnlyList<StockTransactionDto>> MapTransactions(IReadOnlyList<StockTransaction> rows, CancellationToken cancellationToken)
    {
        if (rows.Count == 0) return [];
        var itemIds = rows.Select(x => x.StockItemId).Distinct().ToList();
        var items = await db.StockItems.Where(x => itemIds.Contains(x.Id)).ToDictionaryAsync(x => x.Id, cancellationToken);
        return rows.Select(x =>
        {
            items.TryGetValue(x.StockItemId, out var item);
            return new StockTransactionDto(x.Id, x.CompanyId, x.StockItemId, item?.ItemCode ?? "", item?.ItemName ?? "", x.TransactionType, x.Quantity, x.ReferenceNo, x.TransactionDate);
        }).ToList();
    }
}

public static class DependencyInjection
{
    public static IServiceCollection AddInventoryApplication(this IServiceCollection services)
    {
        services.AddMediatR(cfg => cfg.RegisterServicesFromAssembly(typeof(DependencyInjection).Assembly));
        return services;
    }
}
