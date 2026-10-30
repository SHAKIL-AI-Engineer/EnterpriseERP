using Microsoft.EntityFrameworkCore;
using SewingService.Domain;

namespace SewingService.Application.Services;

public sealed class SewingBalanceService(IUnitOfWork uow) : ISewingBalanceService
{
    public async Task<SewingBalance> GetOrCreateAsync(Guid companyId, Guid orderId, string? colorName, string sizeName, CancellationToken ct = default)
    {
        var normalizedColor = string.IsNullOrWhiteSpace(colorName) ? null : colorName.Trim();
        var normalizedSize = sizeName.Trim();
        var balance = await uow.Balances.Query()
            .FirstOrDefaultAsync(x => x.CompanyId == companyId && x.OrderId == orderId && x.ColorName == normalizedColor && x.SizeName == normalizedSize, ct);
        if (balance is not null) return balance;

        balance = new SewingBalance
        {
            CompanyId = companyId,
            OrderId = orderId,
            ColorName = normalizedColor,
            SizeName = normalizedSize,
        };
        await uow.Balances.AddAsync(balance, ct);
        return balance;
    }

    public async Task AddPanelReceivedAsync(Guid companyId, Guid orderId, string? colorName, string sizeName, int qty, CancellationToken ct = default)
    {
        var balance = await GetOrCreateAsync(companyId, orderId, colorName, sizeName, ct);
        balance.PanelReceivedQty += qty;
        balance.WipQty = balance.PanelReceivedQty - balance.SewnOutputQty;
        await uow.SaveChangesAsync(ct);
    }

    public async Task AddSewnOutputAsync(Guid companyId, Guid orderId, string? colorName, string sizeName, int qty, CancellationToken ct = default)
    {
        var balance = await GetOrCreateAsync(companyId, orderId, colorName, sizeName, ct);
        balance.SewnOutputQty += qty;
        balance.WipQty = balance.PanelReceivedQty - balance.SewnOutputQty;
        await uow.SaveChangesAsync(ct);
    }
}
