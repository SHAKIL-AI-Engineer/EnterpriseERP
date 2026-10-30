using System.Net;
using System.Net.Sockets;
using System.Text.Json;

namespace EnterpriseERP.Platform.Host.Middleware;

/// <summary>
/// Returns 503 with a clear message when ImportExportService (:8060) is down,
/// instead of a generic 502 from YARP.
/// </summary>
public sealed class ImportExportProxyAvailabilityMiddleware(
    RequestDelegate next,
    IConfiguration configuration)
{
    private static readonly JsonSerializerOptions JsonOptions = new() { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };

    public async Task InvokeAsync(HttpContext context)
    {
        var path = context.Request.Path.Value ?? "";
        if (!path.StartsWith("/api/v1/import-export", StringComparison.OrdinalIgnoreCase))
        {
            await next(context);
            return;
        }

        // Handled locally by Platform.Host controllers (organogram / address fallbacks).
        if (path.StartsWith("/api/v1/import-export/company-organogram", StringComparison.OrdinalIgnoreCase)
            || path.StartsWith("/api/v1/import-export/address", StringComparison.OrdinalIgnoreCase))
        {
            await next(context);
            return;
        }

        if (!await IsImportExportAvailableAsync(context.RequestAborted))
        {
            context.Response.StatusCode = StatusCodes.Status503ServiceUnavailable;
            context.Response.ContentType = "application/json; charset=utf-8";
            await context.Response.WriteAsJsonAsync(new
            {
                success = false,
                traceId = context.TraceIdentifier,
                message = "ImportExportService is not running on http://127.0.0.1:8060. Start it via backend/Infrastructure/Scripts/start-platform.ps1 or go run ./cmd/api in Services/ImportExportService.",
                errors = new[] { new { code = "IMPORT_EXPORT_UNAVAILABLE", message = "Import export service unavailable" } },
            }, JsonOptions, context.RequestAborted);
            return;
        }

        await next(context);
    }

    private async Task<bool> IsImportExportAvailableAsync(CancellationToken cancellationToken)
    {
        var address = configuration["ReverseProxy:Clusters:importexport:Destinations:d1:Address"] ?? "http://127.0.0.1:8060/";
        if (!Uri.TryCreate(address, UriKind.Absolute, out var uri))
        {
            uri = new Uri("http://127.0.0.1:8060/");
        }

        var host = uri.Host;
        var port = uri.Port > 0 ? uri.Port : 8060;

        try
        {
            using var client = new TcpClient();
            using var cts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
            cts.CancelAfter(TimeSpan.FromSeconds(2));
            await client.ConnectAsync(host, port, cts.Token);
            return true;
        }
        catch
        {
            return false;
        }
    }
}
