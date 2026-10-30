using FinishingService.Domain;
using Microsoft.EntityFrameworkCore;

using Erp.BuildingBlocks.SharedKernel;

namespace FinishingService.Application.Services;

public sealed class FinishingBalanceService(IFinishingDbContext db) : IFinishingBalanceService
{
    public async Task UpdateReceiveQtyAsync(FinishingReceive receive, CancellationToken cancellationToken = default)
    {
        var items = await db.FinishingReceiveItems.Where(x => x.FinishingReceiveId == receive.Id).ToListAsync(cancellationToken);
        foreach (var item in items)
        {
            var balance = await FindOrCreateAsync(receive.CompanyId, receive.OrderId, item.BuyerPurchaseOrderId, item.ColorName, item.SizeName, cancellationToken);
            balance.FinishingReceiveQty = await db.FinishingReceiveItems
                .Where(x => x.CompanyId == receive.CompanyId && x.OrderId == receive.OrderId && x.BuyerPurchaseOrderId == item.BuyerPurchaseOrderId && x.ColorName == item.ColorName && x.SizeName == item.SizeName && x.FinishingReceive!.Status == FinishingReceiveStatuses.Confirmed)
                .SumAsync(x => x.ReceiveQty, cancellationToken);
            Recalculate(balance);
        }
    }

    public async Task UpdateInputQtyAsync(FinishingInput input, CancellationToken cancellationToken = default)
    {
        var balance = await FindOrCreateAsync(input.CompanyId, input.OrderId, null, input.ColorName, input.SizeName, cancellationToken);
        balance.FinishingInputQty = await db.FinishingInputs
            .Where(x => x.CompanyId == input.CompanyId && x.OrderId == input.OrderId && x.ColorName == input.ColorName && x.SizeName == input.SizeName)
            .SumAsync(x => x.InputQty, cancellationToken);
        Recalculate(balance);
    }

    public async Task UpdateIronQtyAsync(IroningOutput ironing, CancellationToken cancellationToken = default)
    {
        var balance = await FindOrCreateAsync(ironing.CompanyId, ironing.OrderId, null, ironing.ColorName, ironing.SizeName, cancellationToken);
        balance.IronQty = await db.IroningOutputs
            .Where(x => x.CompanyId == ironing.CompanyId && x.OrderId == ironing.OrderId && x.ColorName == ironing.ColorName && x.SizeName == ironing.SizeName)
            .SumAsync(x => x.IronQty, cancellationToken);
        Recalculate(balance);
    }

    public async Task UpdateQCQtyAsync(FinishingQC qc, CancellationToken cancellationToken = default)
    {
        var balance = await FindOrCreateAsync(qc.CompanyId, qc.OrderId, null, qc.ColorName, qc.SizeName, cancellationToken);
        
        balance.QCPassQty = await db.FinishingQCs
            .Where(x => x.CompanyId == qc.CompanyId && x.OrderId == qc.OrderId && x.ColorName == qc.ColorName && x.SizeName == qc.SizeName)
            .SumAsync(x => x.PassedQty, cancellationToken);

        balance.AlterQty = await db.FinishingQCs
            .Where(x => x.CompanyId == qc.CompanyId && x.OrderId == qc.OrderId && x.ColorName == qc.ColorName && x.SizeName == qc.SizeName)
            .SumAsync(x => x.AlterQty, cancellationToken);

        balance.RejectQty = await db.FinishingQCs
            .Where(x => x.CompanyId == qc.CompanyId && x.OrderId == qc.OrderId && x.ColorName == qc.ColorName && x.SizeName == qc.SizeName)
            .SumAsync(x => x.RejectQty, cancellationToken);

        Recalculate(balance);
    }

    public async Task UpdateFoldingQtyAsync(FoldingPacking folding, CancellationToken cancellationToken = default)
    {
        var balance = await FindOrCreateAsync(folding.CompanyId, folding.OrderId, null, folding.ColorName, folding.SizeName, cancellationToken);
        
        balance.FoldingQty = await db.FoldingPackings
            .Where(x => x.CompanyId == folding.CompanyId && x.OrderId == folding.OrderId && x.ColorName == folding.ColorName && x.SizeName == folding.SizeName)
            .SumAsync(x => x.FoldingQty, cancellationToken);

        balance.PolyQty = await db.FoldingPackings
            .Where(x => x.CompanyId == folding.CompanyId && x.OrderId == folding.OrderId && x.ColorName == folding.ColorName && x.SizeName == folding.SizeName)
            .SumAsync(x => x.PolyQty, cancellationToken);

        Recalculate(balance);
    }

    public async Task UpdateCartonQtyAsync(CartonPacking carton, CancellationToken cancellationToken = default)
    {
        var items = await db.CartonPackingItems.Where(x => x.CartonPackingId == carton.Id).ToListAsync(cancellationToken);
        foreach (var item in items)
        {
            var balance = await FindOrCreateAsync(carton.CompanyId, carton.OrderId, item.BuyerPurchaseOrderId, item.ColorName, item.SizeName, cancellationToken);
            balance.CartonQty = await db.CartonPackingItems
                .Where(x => x.CompanyId == carton.CompanyId && x.OrderId == carton.OrderId && x.BuyerPurchaseOrderId == item.BuyerPurchaseOrderId && x.ColorName == item.ColorName && x.SizeName == item.SizeName && x.CartonPacking!.Status == CartonPackingStatuses.Closed)
                .SumAsync(x => x.Quantity, cancellationToken);
            Recalculate(balance);
        }
    }

    public async Task UpdateTransferQtyAsync(FinishedGoodsTransfer transfer, CancellationToken cancellationToken = default)
    {
        var items = await db.FinishedGoodsTransferItems.Where(x => x.FinishedGoodsTransferId == transfer.Id).ToListAsync(cancellationToken);
        foreach (var item in items)
        {
            var balance = await FindOrCreateAsync(transfer.CompanyId, transfer.OrderId, item.BuyerPurchaseOrderId, item.ColorName, item.SizeName, cancellationToken);
            balance.TransferQty = await db.FinishedGoodsTransferItems
                .Where(x => x.CompanyId == transfer.CompanyId && x.OrderId == transfer.OrderId && x.BuyerPurchaseOrderId == item.BuyerPurchaseOrderId && x.ColorName == item.ColorName && x.SizeName == item.SizeName && x.FinishedGoodsTransfer!.Status == FinishedGoodsTransferStatuses.Confirmed)
                .SumAsync(x => x.TransferQty, cancellationToken);
            Recalculate(balance);
        }
    }

    public async Task UpdateWastageQtyAsync(FinishingWastage wastage, CancellationToken cancellationToken = default)
    {
        var balance = await FindOrCreateAsync(wastage.CompanyId, wastage.OrderId, null, wastage.ColorName, wastage.SizeName ?? "N/A", cancellationToken);
        balance.BalanceQty = balance.FinishingReceiveQty - balance.TransferQty - balance.RejectQty - await db.FinishingWastages
            .Where(x => x.CompanyId == wastage.CompanyId && x.OrderId == wastage.OrderId && x.ColorName == wastage.ColorName && x.SizeName == wastage.SizeName)
            .SumAsync(x => x.WastageQty, cancellationToken);
        balance.UpdatedAt = BusinessTime.Now;
    }

    public async Task SyncSewingOutputAsync(Guid companyId, Guid orderId, string? colorName, string sizeName, int quantity, CancellationToken cancellationToken = default)
    {
        var balance = await FindOrCreateAsync(companyId, orderId, null, colorName, sizeName, cancellationToken);
        balance.SewingOutputQty += quantity;
        Recalculate(balance);
    }

    private async Task<FinishingBalance> FindOrCreateAsync(Guid companyId, Guid orderId, Guid? buyerPurchaseOrderId, string? colorName, string sizeName, CancellationToken cancellationToken)
    {
        var balance = await db.FinishingBalances.FirstOrDefaultAsync(x =>
            x.CompanyId == companyId &&
            x.OrderId == orderId &&
            x.BuyerPurchaseOrderId == buyerPurchaseOrderId &&
            x.ColorName == colorName &&
            x.SizeName == sizeName, cancellationToken);

        if (balance is not null) return balance;

        balance = new FinishingBalance
        {
            CompanyId = companyId,
            OrderId = orderId,
            BuyerPurchaseOrderId = buyerPurchaseOrderId,
            ColorName = colorName,
            SizeName = sizeName
        };

        db.Add(balance);
        return balance;
    }

    private static void Recalculate(FinishingBalance balance)
    {
        balance.BalanceQty = balance.FinishingReceiveQty - balance.TransferQty - balance.RejectQty;
        balance.UpdatedAt = BusinessTime.Now;
    }
}
