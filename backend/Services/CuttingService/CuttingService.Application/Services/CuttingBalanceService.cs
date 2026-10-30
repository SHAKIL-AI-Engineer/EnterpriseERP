using CuttingService.Domain;
using Microsoft.EntityFrameworkCore;

using Erp.BuildingBlocks.SharedKernel;

namespace CuttingService.Application.Services;

public sealed class CuttingBalanceService(ICuttingDbContext db) : ICuttingBalanceService
{
    public async Task UpdatePlanQtyAsync(CuttingPlan plan, CancellationToken cancellationToken = default)
    {
        var breakdowns = await db.CuttingPlanSizeBreakdowns.Where(x => x.CuttingPlanId == plan.Id).ToListAsync(cancellationToken);
        foreach (var row in breakdowns)
        {
            var balance = await FindOrCreateAsync(plan.CompanyId, plan.OrderId, plan.ColorName, row.SizeName, cancellationToken);
            balance.PlanQty = await db.CuttingPlanSizeBreakdowns
                .Where(x => x.CompanyId == plan.CompanyId && x.SizeName == row.SizeName && x.CuttingPlan!.OrderId == plan.OrderId && x.CuttingPlan.ColorName == plan.ColorName)
                .SumAsync(x => x.PlanQty, cancellationToken);
            balance.BalanceQty = balance.OrderQty - balance.CutQty;
            balance.UpdatedAt = BusinessTime.Now;
        }
    }

    public async Task AddOutputAsync(CuttingOutput output, int orderQty, CancellationToken cancellationToken = default)
    {
        var balance = await FindOrCreateAsync(output.CompanyId, output.OrderId, output.ColorName, output.SizeName, cancellationToken);
        if (balance.OrderQty == 0) balance.OrderQty = orderQty;
        balance.CutQty += output.OutputQty;
        balance.BalanceQty = balance.OrderQty - balance.CutQty;
        balance.UpdatedAt = BusinessTime.Now;
    }

    public async Task AddTransferAsync(CuttingPanelTransfer transfer, CancellationToken cancellationToken = default)
    {
        var items = await db.CuttingPanelTransferItems.Where(x => x.CuttingPanelTransferId == transfer.Id).ToListAsync(cancellationToken);
        foreach (var item in items)
        {
            var balance = await FindOrCreateAsync(transfer.CompanyId, transfer.OrderId, item.ColorName, item.SizeName, cancellationToken);
            balance.TransferredQty += item.TransferQty;
            balance.UpdatedAt = BusinessTime.Now;
        }
    }

    private async Task<CuttingBalance> FindOrCreateAsync(Guid companyId, Guid orderId, string? colorName, string sizeName, CancellationToken cancellationToken)
    {
        var balance = await db.CuttingBalances.FirstOrDefaultAsync(x => x.CompanyId == companyId && x.OrderId == orderId && x.ColorName == colorName && x.SizeName == sizeName, cancellationToken);
        if (balance is not null) return balance;
        balance = new CuttingBalance { CompanyId = companyId, OrderId = orderId, ColorName = colorName, SizeName = sizeName };
        db.Add(balance);
        return balance;
    }
}
