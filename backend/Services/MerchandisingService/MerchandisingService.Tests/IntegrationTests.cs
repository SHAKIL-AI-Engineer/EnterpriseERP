using System.Net;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;

namespace MerchandisingService.Tests;

public sealed class IntegrationTests
{
    [Fact]
    public async Task Health_endpoint_is_available()
    {
        await using var factory = new MerchandisingApiFactory();
        using var client = factory.CreateClient();

        var response = await client.GetAsync("/health");

        Assert.True(response.StatusCode is HttpStatusCode.OK or HttpStatusCode.ServiceUnavailable);
    }

    [Fact]
    public async Task Protected_endpoint_requires_jwt()
    {
        await using var factory = new MerchandisingApiFactory();
        using var client = factory.CreateClient();

        var response = await client.GetAsync($"/api/v1/merchandising/buyers?companyId={Guid.NewGuid()}");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }
}

public sealed class MerchandisingApiFactory : WebApplicationFactory<Program>
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
