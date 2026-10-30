using FinishingService.Application.Services;
using FinishingService.Domain;
using FinishingService.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace FinishingService.Tests;

public sealed class FinishingBalanceTests
{
    [Fact]
    public async Task Recalculating_finishing_balance_uses_correct_mathematical_formula()
    {
        var options = new DbContextOptionsBuilder<FinishingDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        await using var db = new FinishingDbContext(options);
        var companyId = Guid.NewGuid();
        var orderId = Guid.NewGuid();
        var poId = Guid.Empty; // Using default Guid.Empty/null
        
        // Seed initial balance row
        var balance = new FinishingBalance
        {
            Id = Guid.NewGuid(),
            CompanyId = companyId,
            OrderId = orderId,
            BuyerPurchaseOrderId = null,
            ColorName = "Navy",
            SizeName = "XL",
            SewingOutputQty = 1000,
            FinishingReceiveQty = 0,
            TransferQty = 0,
            RejectQty = 0,
            BalanceQty = 0
        };
        db.FinishingBalances.Add(balance);

        // Seed confirmed Receive
        var receive = new FinishingReceive
        {
            Id = Guid.NewGuid(),
            CompanyId = companyId,
            OrderId = orderId,
            ReceiveNo = "REC-01",
            ReceiveDate = DateOnly.FromDateTime(DateTime.Today),
            Status = FinishingReceiveStatuses.Confirmed
        };
        db.FinishingReceives.Add(receive);
        db.FinishingReceiveItems.Add(new FinishingReceiveItem
        {
            Id = Guid.NewGuid(),
            CompanyId = companyId,
            FinishingReceiveId = receive.Id,
            OrderId = orderId,
            BuyerPurchaseOrderId = null,
            ColorName = "Navy",
            SizeName = "XL",
            ReceiveQty = 800
        });

        // Seed confirmed Goods Transfer
        var transfer = new FinishedGoodsTransfer
        {
            Id = Guid.NewGuid(),
            CompanyId = companyId,
            OrderId = orderId,
            TransferNo = "TRF-01",
            TransferDate = DateOnly.FromDateTime(DateTime.Today),
            Status = FinishedGoodsTransferStatuses.Confirmed
        };
        db.FinishedGoodsTransfers.Add(transfer);
        db.FinishedGoodsTransferItems.Add(new FinishedGoodsTransferItem
        {
            Id = Guid.NewGuid(),
            CompanyId = companyId,
            FinishedGoodsTransferId = transfer.Id,
            OrderId = orderId,
            BuyerPurchaseOrderId = null,
            ColorName = "Navy",
            SizeName = "XL",
            TransferQty = 500
        });

        // Seed QC with Reject Qty
        var batch = new FinishingBatch
        {
            Id = Guid.NewGuid(),
            CompanyId = companyId,
            OrderId = orderId,
            BatchNo = "BTC-01",
            BatchDate = DateOnly.FromDateTime(DateTime.Today),
            Status = FinishingBatchStatuses.Running
        };
        db.FinishingBatches.Add(batch);
        
        var qc = new FinishingQC
        {
            Id = Guid.NewGuid(),
            CompanyId = companyId,
            FinishingBatchId = batch.Id,
            OrderId = orderId,
            ColorName = "Navy",
            SizeName = "XL",
            CheckedQty = 200,
            PassedQty = 180,
            RejectQty = 20
        };
        db.FinishingQCs.Add(qc);

        // Seed Wastage
        var wastage = new FinishingWastage
        {
            Id = Guid.NewGuid(),
            CompanyId = companyId,
            OrderId = orderId,
            FinishingBatchId = batch.Id,
            WastageDate = DateOnly.FromDateTime(DateTime.Today),
            ColorName = "Navy",
            SizeName = "XL",
            WastageQty = 15,
            WastageReason = "Damaged during pack"
        };
        db.FinishingWastages.Add(wastage);

        await db.SaveChangesAsync();

        var balanceService = new FinishingBalanceService(db);
        
        // Invoke updates sequentially matching production triggers
        await balanceService.UpdateReceiveQtyAsync(receive, default);
        await balanceService.UpdateTransferQtyAsync(transfer, default);
        await balanceService.UpdateQCQtyAsync(qc, default);
        await balanceService.UpdateWastageQtyAsync(wastage, default);

        await db.SaveChangesAsync();

        var updatedBalance = await db.FinishingBalances.FirstAsync(x => x.ColorName == "Navy" && x.SizeName == "XL");
        
        // Formula: BalanceQty = FinishingReceiveQty (800) - TransferQty (500) - RejectQty (20) - WastageQty (15) = 265
        Assert.Equal(800, updatedBalance.FinishingReceiveQty);
        Assert.Equal(500, updatedBalance.TransferQty);
        Assert.Equal(20, updatedBalance.RejectQty);
        Assert.Equal(265, updatedBalance.BalanceQty);
    }
}
