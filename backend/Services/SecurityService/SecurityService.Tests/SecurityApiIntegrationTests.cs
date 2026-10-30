using System.Net;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Configuration;

namespace SecurityService.Tests;

public sealed class SecurityApiIntegrationTests
{
    [Fact]
    public async Task SwaggerEndpointResponds()
    {
        await using var factory = new WebApplicationFactory<Program>()
            .WithWebHostBuilder(builder =>
            {
                builder.ConfigureAppConfiguration((_, config) =>
                {
                    config.AddInMemoryCollection(new Dictionary<string, string?>
                    {
                        ["Database:UseInMemory"] = "true",
                        ["Database:InMemoryName"] = Guid.NewGuid().ToString("N"),
                        ["RabbitMQ:DisableConsumers"] = "true"
                    });
                });
            });

        using var client = factory.CreateClient();
        var response = await client.GetAsync("/swagger/v1/swagger.json");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }
}
