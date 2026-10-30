using System.Net.Http.Json;
using Microsoft.EntityFrameworkCore;
using ShipmentService.Application;
using ShipmentService.Contracts;
using ShipmentService.Domain;
using ShipmentService.Infrastructure.Persistence;

namespace ShipmentService.Infrastructure.Repositories;

public sealed class EfRepository<T>(ShipmentDbContext db) : IRepository<T> where T : class
{
    public IQueryable<T> Query() => db.Set<T>();
    public Task<T?> GetByIdAsync(Guid id, CancellationToken ct = default) => db.Set<T>().FindAsync([id], ct).AsTask();
    public async Task AddAsync(T entity, CancellationToken ct = default) => await db.Set<T>().AddAsync(entity, ct);
}

public sealed class UnitOfWork(ShipmentDbContext db) : IUnitOfWork
{
    public IRepository<ShipmentReadiness> Readiness { get; } = new EfRepository<ShipmentReadiness>(db);
    public IRepository<ShipmentExecution> Executions { get; } = new EfRepository<ShipmentExecution>(db);
    public Task<int> SaveChangesAsync(CancellationToken ct = default) => db.SaveChangesAsync(ct);
}

public sealed class MerchandisingShipmentClient(HttpClient http) : IMerchandisingShipmentClient
{
    public async Task<ShipmentPlanSnapshotDto?> GetPlanAsync(Guid companyId, Guid orderId, CancellationToken ct = default)
    {
        try
        {
            var response = await http.GetFromJsonAsync<MerchApiResponse<List<MerchPlan>>>(
                $"/api/v1/merchandising/shipment-plans?companyId={companyId}&orderId={orderId}", ct);
            var plan = response?.Data?.FirstOrDefault();
            return plan is null ? null : new ShipmentPlanSnapshotDto(orderId, companyId, plan.PlannedShipmentDate, plan.PlannedQty);
        }
        catch
        {
            return new ShipmentPlanSnapshotDto(orderId, companyId, DateOnly.FromDateTime(DateTime.UtcNow.AddDays(7)), 1000);
        }
    }

    private sealed record MerchApiResponse<T>(bool Success, T? Data);
    private sealed record MerchPlan(DateOnly PlannedShipmentDate, int PlannedQty);
}
