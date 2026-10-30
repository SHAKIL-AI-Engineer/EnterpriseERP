using AutoMapper;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using SecurityService.Application;
using SecurityService.Application.Services;
using SecurityService.Contracts;
using SecurityService.Domain;
using SecurityService.Infrastructure.Persistence;

namespace SecurityService.Tests;

public sealed class SecurityOperationsTests
{
    private static readonly Guid CompanyId = Guid.Parse("20000000-0000-0000-0000-000000000001");
    private static readonly Guid GateId = Guid.NewGuid();

    [Fact]
    public async Task BlacklistedVisitorCannotCheckIn()
    {
        await using var db = CreateDbContext();
        db.Gates.Add(new Gate { Id = GateId, CompanyId = CompanyId, GateCode = "G1", GateName = "Main" });
        var visitor = new Visitor { Id = Guid.NewGuid(), CompanyId = CompanyId, VisitorName = "Blocked", IsBlacklisted = true };
        db.Visitors.Add(visitor);
        await db.SaveChangesAsync();

        var service = CreateService(db);
        var request = new CreateVisitorEntryRequest(CompanyId, GateId, visitor.Id, "VE-001", DateOnly.FromDateTime(DateTime.UtcNow), DateTime.UtcNow, "Meeting", null, null, "C1");

        await Assert.ThrowsAsync<InvalidOperationException>(() => service.CreateAsync(request));
    }

    [Fact]
    public async Task ReturnQtyCannotExceedGatePassItemQuantity()
    {
        await using var db = CreateDbContext();
        var itemId = Guid.NewGuid();
        var gatePass = new GatePass
        {
            Id = Guid.NewGuid(),
            CompanyId = CompanyId,
            GateId = GateId,
            GatePassNo = "GP-001",
            GatePassDate = DateOnly.FromDateTime(DateTime.UtcNow),
            GatePassType = GatePassTypes.Returnable,
            Direction = GatePassDirections.Out,
            IsReturnable = true,
            ExpectedReturnDate = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(3)),
            Items =
            [
                new GatePassItem { Id = itemId, CompanyId = CompanyId, ItemName = "Fabric Roll", Quantity = 10, ReturnedQty = 7 }
            ]
        };
        db.GatePasses.Add(gatePass);
        await db.SaveChangesAsync();

        var handler = new SecurityService.Application.Handlers.CommandHandlers(
            db,
            Mapper(),
            new TestCurrentUser(),
            CreateService(db),
            CreateService(db),
            CreateService(db),
            CreateService(db),
            CreateService(db),
            CreateService(db),
            CreateService(db),
            new TestReportBuilder());

        var request = new CreateReturnableGatePassReturnRequest(CompanyId, gatePass.Id, DateOnly.FromDateTime(DateTime.UtcNow), "Driver", null, null, [new CreateReturnableGatePassReturnItemRequest(itemId, 4)]);

        await Assert.ThrowsAsync<InvalidOperationException>(() => handler.Handle(new CreateReturnableGatePassReturnCommand(request), CancellationToken.None));
    }

    [Fact]
    public async Task VehicleCannotExitBeforeEntry()
    {
        await using var db = CreateDbContext();
        db.VehicleEntries.Add(new VehicleEntry
        {
            Id = Guid.NewGuid(),
            CompanyId = CompanyId,
            GateId = GateId,
            VehicleId = Guid.NewGuid(),
            EntryNo = "VH-001",
            EntryDate = DateOnly.FromDateTime(DateTime.UtcNow),
            InTime = DateTime.UtcNow,
        });
        await db.SaveChangesAsync();
        var entry = await db.VehicleEntries.FirstAsync();

        var service = CreateService(db);
        await Assert.ThrowsAsync<InvalidOperationException>(() => service.ExitAsync(entry.Id, entry.InTime.AddMinutes(-1)));
    }

    private static SecurityDbContext CreateDbContext()
    {
        var options = new DbContextOptionsBuilder<SecurityDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString("N"))
            .Options;
        return new SecurityDbContext(options);
    }

    private static SecurityOperationsService CreateService(SecurityDbContext db) =>
        new(db, Mapper(), new TestCurrentUser(), new TestPublisher(), new TestAccountsClient());

    private static IMapper Mapper() => new MapperConfiguration(cfg => cfg.AddProfile<MappingProfile>(), NullLoggerFactory.Instance).CreateMapper();

    private sealed class TestCurrentUser : ICurrentUserService
    {
        public Guid? UserId => Guid.Parse("30000000-0000-0000-0000-000000000001");
    }

    private sealed class TestPublisher : IIntegrationEventPublisher
    {
        public Task PublishAsync(IntegrationEvent integrationEvent, CancellationToken cancellationToken = default) => Task.CompletedTask;
    }

    private sealed class TestAccountsClient : IAccountsServiceClient
    {
        public Task CreatePayableFromBillEntryAsync(Guid companyId, Guid billEntryId, CancellationToken cancellationToken = default) => Task.CompletedTask;
    }

    private sealed class TestReportBuilder : IReportDataBuilderService
    {
        public Task<DailyGateRegisterDto> BuildDailyRegisterAsync(Guid companyId, DateOnly date, CancellationToken cancellationToken = default) => throw new NotSupportedException();
        public Task<IReadOnlyList<VisitorEntryDto>> BuildVisitorReportAsync(Guid companyId, DateOnly fromDate, DateOnly toDate, CancellationToken cancellationToken = default) => throw new NotSupportedException();
        public Task<MaterialInOutReportDto> BuildMaterialInOutAsync(Guid companyId, DateOnly fromDate, DateOnly toDate, CancellationToken cancellationToken = default) => throw new NotSupportedException();
        public Task<IReadOnlyList<VehicleEntryDto>> BuildVehicleReportAsync(Guid companyId, DateOnly fromDate, DateOnly toDate, CancellationToken cancellationToken = default) => throw new NotSupportedException();
        public Task<IReadOnlyList<ReturnablePendingDto>> BuildReturnablePendingAsync(Guid companyId, CancellationToken cancellationToken = default) => throw new NotSupportedException();
        public Task<ExportResultDto> ExportAsync(ReportExportApiRequest request, CancellationToken cancellationToken = default) => throw new NotSupportedException();
    }
}
