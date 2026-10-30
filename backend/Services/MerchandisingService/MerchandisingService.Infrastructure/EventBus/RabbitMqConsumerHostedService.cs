using System.Text;
using System.Text.Json;
using Erp.BuildingBlocks.EventBus;
using MerchandisingService.Application;
using MerchandisingService.Domain;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using RabbitMQ.Client;
using RabbitMQ.Client.Events;

using Erp.BuildingBlocks.SharedKernel;

namespace MerchandisingService.Infrastructure.EventBus;

public sealed class RabbitMqConsumerHostedService(
    IConfiguration configuration,
    IServiceScopeFactory scopeFactory,
    ILogger<RabbitMqConsumerHostedService> logger) : BackgroundService
{
    private static readonly string[] ConsumedEvents =
    [
        EventTypes.MerchandisingCuttingStarted,
        EventTypes.MerchandisingProductionStarted,
        EventTypes.MerchandisingProductionCompleted,
        EventTypes.MerchandisingShipmentCompleted,
    ];

    protected override Task ExecuteAsync(CancellationToken stoppingToken)
    {
        if (configuration.GetValue("RabbitMQ:DisableConsumers", false))
        {
            logger.LogInformation("MerchandisingService RabbitMQ consumers are disabled.");
            return Task.CompletedTask;
        }

        _ = Task.Run(() => Consume(stoppingToken), stoppingToken);
        return Task.CompletedTask;
    }

    private void Consume(CancellationToken stoppingToken)
    {
        try
        {
            var factory = new ConnectionFactory
            {
                HostName = configuration["RabbitMQ:HostName"] ?? configuration["RabbitMQ:Host"] ?? "localhost",
                UserName = configuration["RabbitMQ:UserName"] ?? "guest",
                Password = configuration["RabbitMQ:Password"] ?? "guest",
                DispatchConsumersAsync = true,
            };
            using var connection = factory.CreateConnection();
            using var channel = connection.CreateModel();
            var exchange = configuration["RabbitMQ:Exchange"] ?? "erp.events";
            var queue = configuration["RabbitMQ:MerchandisingQueue"] ?? "merchandising-service";
            channel.ExchangeDeclare(exchange, ExchangeType.Topic, durable: true, autoDelete: false);
            channel.QueueDeclare(queue, durable: true, exclusive: false, autoDelete: false);
            foreach (var eventName in ConsumedEvents)
            {
                channel.QueueBind(queue, exchange, eventName);
            }

            var consumer = new AsyncEventingBasicConsumer(channel);
            consumer.Received += async (_, args) =>
            {
                await HandleEventAsync(args.RoutingKey, Encoding.UTF8.GetString(args.Body.ToArray()), stoppingToken);
                channel.BasicAck(args.DeliveryTag, multiple: false);
            };
            channel.BasicConsume(queue, autoAck: false, consumer);

            while (!stoppingToken.IsCancellationRequested)
            {
                Thread.Sleep(TimeSpan.FromSeconds(2));
            }
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "MerchandisingService RabbitMQ consumer stopped. The API can continue without the consumer.");
        }
    }

    private async Task HandleEventAsync(string eventName, string payload, CancellationToken cancellationToken)
    {
        using var scope = scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<IMerchandisingDbContext>();
        var document = JsonDocument.Parse(payload);
        var root = document.RootElement;
        var companyId = TryReadGuid(root, "companyId") ?? Guid.Empty;
        var orderId = TryReadGuid(root, "orderId");
        if (companyId == Guid.Empty || !orderId.HasValue)
        {
            logger.LogWarning("Skipping event {EventName} because companyId or orderId was missing.", eventName);
            return;
        }

        var order = await db.Orders.FirstOrDefaultAsync(x => x.CompanyId == companyId && x.Id == orderId.Value, cancellationToken);
        if (order is null)
        {
            logger.LogWarning("Order {OrderId} not found for event {EventName}.", orderId.Value, eventName);
            return;
        }

        var previous = order.OrderStatus;
        switch (eventName)
        {
            case EventTypes.MerchandisingCuttingStarted:
                if (order.OrderStatus == OrderStatuses.Confirmed)
                {
                    order.OrderStatus = OrderStatuses.InProduction;
                }

                break;
            case EventTypes.MerchandisingProductionStarted:
                if (order.OrderStatus is OrderStatuses.Confirmed or OrderStatuses.InProduction)
                {
                    order.OrderStatus = OrderStatuses.InProduction;
                }

                break;
            case EventTypes.MerchandisingProductionCompleted:
                if (order.OrderStatus != OrderStatuses.Cancelled && order.OrderStatus != OrderStatuses.Shipped)
                {
                    order.OrderStatus = OrderStatuses.InProduction;
                }

                break;
            case EventTypes.MerchandisingShipmentCompleted:
                var shippedQty = TryReadInt(root, "shippedQty") ?? 0;
                var activePlans = await db.ShipmentPlans
                    .Where(x => x.OrderId == order.Id && x.Status == ShipmentPlanStatuses.Planned)
                    .OrderBy(x => x.PlannedShipmentDate)
                    .ToListAsync(cancellationToken);
                var remaining = shippedQty;
                foreach (var plan in activePlans)
                {
                    if (remaining <= 0)
                    {
                        break;
                    }

                    plan.Status = ShipmentPlanStatuses.Completed;
                    plan.UpdatedAt = BusinessTime.Now;
                    remaining -= plan.PlannedQty;
                }

                var totalShipped = await db.ShipmentPlans
                    .Where(x => x.OrderId == order.Id && x.Status == ShipmentPlanStatuses.Completed)
                    .SumAsync(x => x.PlannedQty, cancellationToken);
                order.OrderStatus = totalShipped >= order.TotalOrderQty
                    ? OrderStatuses.Shipped
                    : OrderStatuses.PartiallyShipped;
                break;
            default:
                return;
        }

        if (previous == order.OrderStatus)
        {
            return;
        }

        order.UpdatedAt = BusinessTime.Now;
        db.Add(new OrderStatusHistory
        {
            CompanyId = order.CompanyId,
            OrderId = order.Id,
            FromStatus = previous,
            ToStatus = order.OrderStatus,
            Reason = $"Updated from {eventName} integration event.",
        });
        await db.SaveChangesAsync(cancellationToken);
    }

    private static Guid? TryReadGuid(JsonElement element, string property)
    {
        if (element.ValueKind == JsonValueKind.Object && element.TryGetProperty(property, out var value) && Guid.TryParse(value.GetString(), out var id))
        {
            return id;
        }

        return null;
    }

    private static int? TryReadInt(JsonElement element, string property)
    {
        if (element.ValueKind != JsonValueKind.Object || !element.TryGetProperty(property, out var value))
        {
            return null;
        }

        return value.ValueKind switch
        {
            JsonValueKind.Number when value.TryGetInt32(out var number) => number,
            JsonValueKind.String when int.TryParse(value.GetString(), out var parsed) => parsed,
            _ => null,
        };
    }
}
