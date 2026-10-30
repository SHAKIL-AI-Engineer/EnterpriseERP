using System.Net.Sockets;
using System.Text.Json;

namespace EnterpriseERP.Platform.Host.Middleware;

/// <summary>
/// Returns 503 with a clear message when PunchDataService (:5050) is down,
/// instead of a generic 502 from YARP.
/// </summary>
public sealed class PunchDataProxyAvailabilityMiddleware(
    RequestDelegate next,
    IConfiguration configuration)
{
    private static readonly JsonSerializerOptions JsonOptions = new() { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };

    public async Task InvokeAsync(HttpContext context)
    {
        var path = context.Request.Path.Value ?? "";
        if (!path.StartsWith("/api/v1/punch-data", StringComparison.OrdinalIgnoreCase))
        {
            await next(context);
            return;
        }

        if (!await IsPunchDataAvailableAsync(context.RequestAborted))
        {
            context.Response.StatusCode = StatusCodes.Status503ServiceUnavailable;
            context.Response.ContentType = "application/json; charset=utf-8";
            await context.Response.WriteAsJsonAsync(new
            {
                success = false,
                traceId = context.TraceIdentifier,
                message = "PunchDataService is not running on http://127.0.0.1:5050. Start it via backend/Infrastructure/Scripts/start-platform.ps1 or: cd backend/Services/PunchDataService && go run ./cmd/server",
                errors = new[] { new { code = "PUNCHDATA_UNAVAILABLE", message = "Punch data service unavailable" } },
            }, JsonOptions, context.RequestAborted);
            return;
        }

        await next(context);
    }

    private async Task<bool> IsPunchDataAvailableAsync(CancellationToken cancellationToken)
    {
        var address = configuration["ReverseProxy:Clusters:punchdata:Destinations:d1:Address"] ?? "http://127.0.0.1:5050/";
        if (!Uri.TryCreate(address, UriKind.Absolute, out var uri))
        {
            uri = new Uri("http://127.0.0.1:5050/");
        }

        var host = uri.Host;
        var port = uri.Port > 0 ? uri.Port : 5050;

        try
        {
            using var client = new TcpClient();
            using var cts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
            cts.CancelAfter(TimeSpan.FromSeconds(5));
            await client.ConnectAsync(host, port, cts.Token);
            return true;
        }
        catch
        {
            return false;
        }
    }
}
