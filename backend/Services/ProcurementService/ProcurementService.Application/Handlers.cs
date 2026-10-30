using MediatR;
using Microsoft.Extensions.DependencyInjection;
using ProcurementService.Contracts;
using ProcurementService.Domain;
using Microsoft.EntityFrameworkCore;

namespace ProcurementService.Application;

public interface IProcurementDbContext
{
    IQueryable<SupplierPurchaseOrder> PurchaseOrders { get; }
    IQueryable<SupplierPurchaseOrderLine> PurchaseOrderLines { get; }
    void Add<T>(T entity) where T : class;
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}

public sealed record CreatePurchaseOrderFromRequisitionCommand(Guid RequisitionId, CreatePurchaseOrderFromRequisitionRequest Request) : IRequest<Guid>;
public sealed record ReceivePurchaseOrderLineCommand(Guid LineId, ReceivePurchaseOrderLineRequest Request) : IRequest<SupplierPurchaseOrderLineDto>;
public sealed record CreatePurchaseOrderFromBomCommand(Guid CompanyId, Guid OrderId) : IRequest<Guid>;

public sealed class ProcurementHandlers(IProcurementDbContext db) :
    IRequestHandler<CreatePurchaseOrderFromRequisitionCommand, Guid>,
    IRequestHandler<ReceivePurchaseOrderLineCommand, SupplierPurchaseOrderLineDto>,
    IRequestHandler<CreatePurchaseOrderFromBomCommand, Guid>
{
    public async Task<Guid> Handle(CreatePurchaseOrderFromRequisitionCommand command, CancellationToken cancellationToken)
    {
        var r = command.Request;
        var po = new SupplierPurchaseOrder { CompanyId = r.CompanyId, RequisitionId = command.RequisitionId, PONo = r.PONo.Trim(), SupplierId = r.SupplierId, PODate = DateOnly.FromDateTime(DateTime.UtcNow), Lines = [new SupplierPurchaseOrderLine { CompanyId = r.CompanyId, ItemName = "Requisition Items", Quantity = 1, UnitName = "Lot", UnitPrice = 0, LineTotal = 0 }] };
        db.Add(po);
        await db.SaveChangesAsync(cancellationToken);
        return po.Id;
    }

    public async Task<SupplierPurchaseOrderLineDto> Handle(ReceivePurchaseOrderLineCommand command, CancellationToken cancellationToken)
    {
        var line = await db.PurchaseOrderLines.FirstOrDefaultAsync(x => x.Id == command.LineId, cancellationToken) ?? throw new KeyNotFoundException("PO line not found.");
        line.ReceivedQty += command.Request.ReceivedQty;
        await db.SaveChangesAsync(cancellationToken);
        return new SupplierPurchaseOrderLineDto(line.Id, line.CompanyId, line.PurchaseOrderId, line.ItemName, line.Quantity, line.UnitName, line.UnitPrice, line.LineTotal, line.ReceivedQty);
    }

    public async Task<Guid> Handle(CreatePurchaseOrderFromBomCommand command, CancellationToken cancellationToken)
    {
        var po = new SupplierPurchaseOrder { CompanyId = command.CompanyId, PONo = $"PO-BOM-{command.OrderId:N}".Substring(0, 20), SupplierId = Guid.Empty, PODate = DateOnly.FromDateTime(DateTime.UtcNow) };
        db.Add(po);
        await db.SaveChangesAsync(cancellationToken);
        return po.Id;
    }
}

public static class DependencyInjection
{
    public static IServiceCollection AddProcurementApplication(this IServiceCollection services)
    {
        services.AddMediatR(cfg => cfg.RegisterServicesFromAssembly(typeof(DependencyInjection).Assembly));
        return services;
    }
}
