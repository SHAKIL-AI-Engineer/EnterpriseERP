using System.Diagnostics;
using System.Security.Claims;

namespace EnterpriseERP.Platform.Host.Administration;

public sealed class AdministratorAuditMiddleware(RequestDelegate next, IServiceScopeFactory scopes,
    ILogger<AdministratorAuditMiddleware> logger)
{
    public async Task InvokeAsync(HttpContext context)
    {
        var started = Stopwatch.GetTimestamp();
        await next(context);
        if (!context.Request.Path.StartsWithSegments("/api/v1") || HttpMethods.IsOptions(context.Request.Method)) return;
        // Successful reads are omitted. Record mutations and failed requests without request bodies or query strings.
        if (context.Response.StatusCode < 400 && (HttpMethods.IsGet(context.Request.Method) || HttpMethods.IsHead(context.Request.Method))) return;

        try
        {
            await using var scope = scopes.CreateAsyncScope();
            var db = scope.ServiceProvider.GetRequiredService<AdministratorDbContext>();
            var path = context.Request.Path.Value ?? "";
            var actor = context.User.FindFirstValue(ClaimTypes.NameIdentifier) ?? context.User.FindFirstValue("sub") ?? "Anonymous";
            db.Events.Add(new AdministratorEvent
            {
                Method = context.Request.Method[..Math.Min(context.Request.Method.Length, 12)],
                Path = path[..Math.Min(path.Length, 1024)],
                StatusCode = context.Response.StatusCode,
                Level = context.Response.StatusCode >= 500 ? "Error" : context.Response.StatusCode >= 400 ? "Warning" : "Information",
                DurationMs = (long)Stopwatch.GetElapsedTime(started).TotalMilliseconds,
                TraceId = context.TraceIdentifier[..Math.Min(context.TraceIdentifier.Length, 128)],
                Actor = actor[..Math.Min(actor.Length, 256)]
            });
            await db.SaveChangesAsync();
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Could not persist administrator request audit event");
        }
    }
}
