using AutoMapper;
using Microsoft.EntityFrameworkCore;
using QualityService.Application;
using QualityService.Application.Handlers;
using QualityService.Contracts;
using QualityService.Domain;
using QualityService.Infrastructure.Persistence;
using QualityService.Infrastructure.Repositories;

namespace QualityService.Tests;

public sealed class IntegrationTests
{
    private readonly QualityDbContext _db;
    private readonly UnitOfWork _uow;
    private readonly IMapper _mapper;

    public IntegrationTests()
    {
        var options = new DbContextOptionsBuilder<QualityDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        _db = new QualityDbContext(options);
        _uow = new UnitOfWork(_db);

        var config = new MapperConfiguration(
            cfg => cfg.AddProfile<MappingProfile>(),
            Microsoft.Extensions.Logging.Abstractions.NullLoggerFactory.Instance);
        _mapper = config.CreateMapper();
    }

    [Fact]
    public async Task CheckpointWorkflow_ShouldAddAndListSuccessfully()
    {
        // Arrange
        var mockCache = new MockRedisCacheService();
        var mockPublisher = new MockIntegrationEventPublisher();
        var mockMerch = new MockMerchandisingClient();
        var mockShip = new MockShipmentClient();

        var commandHandler = new CommandHandlers(_uow, _db, _mapper, mockCache, mockPublisher, mockMerch, mockShip);
        var queryHandler = new QueryHandlers(_db, _mapper, mockCache);

        var companyId = Guid.NewGuid();
        var request = new CreateQualityCheckpointRequest(
            CompanyId: companyId,
            CheckpointCode: "INLINE-01",
            CheckpointName: "Sewing Line 01 QC",
            CheckpointType: QualityCheckpointTypes.InlineQC,
            CreatedBy: Guid.NewGuid()
        );

        // Act - Create Checkpoint
        var createResult = await commandHandler.Handle(new CreateQualityCheckpointCommand(request), CancellationToken.None);

        // Assert - Creation succeeded
        Assert.NotNull(createResult);
        Assert.Equal("INLINE-01", createResult.CheckpointCode);

        // Act - Query list
        var listResult = await queryHandler.Handle(new GetQualityCheckpointsQuery(companyId), CancellationToken.None);

        // Assert - List matches
        Assert.Single(listResult);
        Assert.Equal("INLINE-01", listResult[0].CheckpointCode);
    }
}

// Mocks for isolated in-memory execution
internal sealed class MockRedisCacheService : IRedisCacheService
{
    public Task<T?> GetAsync<T>(string key, CancellationToken ct = default) => Task.FromResult<T?>(default);
    public Task SetAsync<T>(string key, T value, TimeSpan? absoluteExpiration = null, CancellationToken ct = default) => Task.CompletedTask;
    public Task RemoveAsync(string key, CancellationToken ct = default) => Task.CompletedTask;
}

internal sealed class MockIntegrationEventPublisher : IIntegrationEventPublisher
{
    public Task PublishAsync<T>(T @event, CancellationToken ct = default) where T : IntegrationEvent => Task.CompletedTask;
}

internal sealed class MockMerchandisingClient : IMerchandisingServiceClient
{
    public Task<bool> OrderExistsAsync(Guid companyId, Guid orderId, CancellationToken ct = default) => Task.FromResult(true);
    public Task<bool> ColorSizeBreakdownExistsAsync(Guid companyId, Guid orderId, string? colorName, string sizeName, CancellationToken ct = default) => Task.FromResult(true);
}

internal sealed class MockShipmentClient : IShipmentServiceClient
{
    public Task NotifyFinalInspectionPassedAsync(Guid companyId, Guid orderId, CancellationToken ct = default) => Task.CompletedTask;
}
