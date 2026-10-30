using System.Net;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;

namespace SewingService.Tests;

public sealed class IntegrationTests
{
    [Fact]
    public async Task Health_endpoint_is_available()
    {
        await using var factory = new SewingApiFactory();
        using var client = factory.CreateClient();

        var response = await client.GetAsync("/health");

        Assert.True(response.StatusCode is HttpStatusCode.OK or HttpStatusCode.ServiceUnavailable);
    }

    [Fact]
    public async Task Versioned_sewing_endpoint_requires_jwt()
    {
        await using var factory = new SewingApiFactory();
        using var client = factory.CreateClient();

        var response = await client.GetAsync($"/api/v1/sewing-lines?companyId={Guid.NewGuid()}");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }
}

public sealed class SewingApiFactory : WebApplicationFactory<Program>
{
    protected override IHost CreateHost(IHostBuilder builder)
    {
        builder.ConfigureAppConfiguration((_, config) =>
        {
            config.AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Database:UseInMemory"] = "true",
                ["Database:InMemoryName"] = Guid.NewGuid().ToString(),
                ["ConnectionStrings:Redis"] = "",
            });
        });

        return base.CreateHost(builder);
    }
}
