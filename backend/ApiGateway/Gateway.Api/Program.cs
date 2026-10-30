using System.Threading.RateLimiting;
using Gateway.Api.Middleware;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.OpenApi.Models;
using Serilog;
using Erp.BuildingBlocks.Hosting;

var builder = WebApplication.CreateBuilder(args);
builder.AddEnterpriseErpConnectionConfiguration();

builder.Host.UseSerilog((ctx, cfg) =>
{
    cfg.ReadFrom.Configuration(ctx.Configuration);
    cfg.WriteTo.Console();
});

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "EnterpriseERP Gateway API", Version = "v1" });
});

builder.Services.AddHealthChecks();

var configuredCorsOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? Array.Empty<string>();
builder.Services.AddCors(options =>
{
    options.AddPolicy("gateway", policy =>
    {
        policy
            .SetIsOriginAllowed(origin =>
            {
                if (string.IsNullOrEmpty(origin))
                {
                    return false;
                }

                if (configuredCorsOrigins.Length > 0)
                {
                    return configuredCorsOrigins.Contains(origin, StringComparer.OrdinalIgnoreCase);
                }

                if (!builder.Environment.IsDevelopment() && !builder.Environment.IsEnvironment("Docker"))
                {
                    return false;
                }

                try
                {
                    var uri = new Uri(origin);
                    return uri.Host is "localhost" or "127.0.0.1";
                }
                catch (UriFormatException)
                {
                    return false;
                }
            })
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.AddPolicy("per-ip", httpContext =>
    {
        if (HttpMethods.IsOptions(httpContext.Request.Method))
        {
            return RateLimitPartition.GetNoLimiter("preflight");
        }

        return RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 300,
                Window = TimeSpan.FromMinutes(1),
                QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                QueueLimit = 20,
            });
    });
});

builder.Services.AddReverseProxy()
    .LoadFromConfig(builder.Configuration.GetSection("ReverseProxy"));

var app = builder.Build();

app.UseSerilogRequestLogging();
app.UseMiddleware<CorrelationIdMiddleware>();
app.UseCors("gateway");
app.UseRateLimiter();

if (app.Environment.IsDevelopment() || app.Environment.IsEnvironment("Docker"))
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "Gateway API");

        // Aggregated .NET services (Platform.Host or individual microservices)
        c.SwaggerEndpoint("/api/v1/auth/swagger/v1/swagger.json", "Auth Service");
        c.SwaggerEndpoint("/api/v1/companies/swagger/v1/swagger.json", "Company Service");
        c.SwaggerEndpoint("/api/v1/hr/swagger/v1/swagger.json", "HR Service");
        c.SwaggerEndpoint("/api/v1/shifts/swagger/v1/swagger.json", "Shift Service");
        c.SwaggerEndpoint("/api/v1/attendance/swagger/v1/swagger.json", "Attendance Service");
        c.SwaggerEndpoint("/api/v1/leave/swagger/v1/swagger.json", "Leave Service");
        c.SwaggerEndpoint("/api/v1/payroll/swagger/v1/swagger.json", "Payroll Service");
        c.SwaggerEndpoint("/api/v1/accounts/swagger/v1/swagger.json", "Accounts Service");
        c.SwaggerEndpoint("/api/v1/inventory/swagger/v1/swagger.json", "Inventory Service");
        c.SwaggerEndpoint("/api/v1/production/swagger/v1/swagger.json", "Production Service");
        c.SwaggerEndpoint("/api/v1/merchandising/swagger/v1/swagger.json", "Merchandising Service");
        c.SwaggerEndpoint("/api/v1/cutting/swagger/v1/swagger.json", "Cutting Service");
        c.SwaggerEndpoint("/api/v1/bills/swagger/v1/swagger.json", "Bills Service");
        c.SwaggerEndpoint("/api/v1/report/swagger/v1/swagger.json", "Report Service");
        c.SwaggerEndpoint("/api/v1/notification/swagger/v1/swagger.json", "Notification Service");
        c.SwaggerEndpoint("/api/v1/audit/swagger/v1/swagger.json", "Audit Service");
        c.SwaggerEndpoint("/api/v1/filestorage/swagger/v1/swagger.json", "File Storage Service");

        // Go services expose OpenAPI at doc.json (not v1/swagger.json)
        c.SwaggerEndpoint("/api/v1/punch-data/swagger/doc.json", "Punch Data Service");
        c.SwaggerEndpoint("/api/v1/import-export/swagger/doc.json", "Import Export Service");
    });
}

// Must run before YARP: the legacy route `{**catch-all}` matches `/` and proxies to :5011 → 502 when the monolith is down.
app.Use(async (ctx, next) =>
{
    if (HttpMethods.IsGet(ctx.Request.Method) && ctx.Request.Path == "/")
    {
        ctx.Response.ContentType = "application/json; charset=utf-8";
        await ctx.Response.WriteAsJsonAsync(new
        {
            service = "EnterpriseERP.Gateway",
            health = "/health",
            swagger = "/swagger",
            api = "/api/v1/...",
            hint = "Use /health or /api/v1/*. Other paths may proxy to the legacy monolith on port 5011.",
        });
        return;
    }

    await next(ctx);
});

app.MapHealthChecks("/health");

app.MapGet("/api/v1/notification/swagger/v1/swagger.json", () => Results.Json(new
{
    openapi = "3.0.1",
    info = new
    {
        title = "Notification Service API",
        version = "v1",
        description = "Gateway-local OpenAPI document for NotificationService when the standalone service is not running.",
    },
    paths = new Dictionary<string, object>
    {
        ["/api/v1/notification/send"] = new
        {
            post = new
            {
                tags = new[] { "Notification" },
                summary = "Send a notification",
                responses = new Dictionary<string, object>
                {
                    ["200"] = new { description = "OK" },
                    ["401"] = new { description = "Unauthorized" },
                },
            },
        },
        ["/api/v1/notification/recipient/{recipientId}"] = new
        {
            get = new
            {
                tags = new[] { "Notification" },
                summary = "List notifications by recipient",
                parameters = new[]
                {
                    new
                    {
                        name = "recipientId",
                        @in = "path",
                        required = true,
                        schema = new { type = "string" },
                    },
                },
                responses = new Dictionary<string, object>
                {
                    ["200"] = new { description = "OK" },
                    ["401"] = new { description = "Unauthorized" },
                },
            },
        },
        ["/api/v1/notification/unread-count/{recipientId}"] = new
        {
            get = new
            {
                tags = new[] { "Notification" },
                summary = "Get unread notification count",
                parameters = new[]
                {
                    new
                    {
                        name = "recipientId",
                        @in = "path",
                        required = true,
                        schema = new { type = "string" },
                    },
                },
                responses = new Dictionary<string, object>
                {
                    ["200"] = new { description = "OK" },
                    ["401"] = new { description = "Unauthorized" },
                },
            },
        },
    },
}));

// YARP legacy `{**catch-all}` also matches `/swagger/*` and proxies → 502 for Swagger UI assets.
// Only non-local paths should hit reverse proxy; /swagger is served by UseSwaggerUI above.
app.MapWhen(
    ctx => ShouldReverseProxy(ctx.Request.Path),
    branch =>
    {
        branch.UseRouting();
        branch.UseCors("gateway");
        branch.UseEndpoints(endpoints =>
        {
            endpoints.MapReverseProxy().RequireRateLimiting("per-ip");
        });
    });

await app.RunAsync();

static bool ShouldReverseProxy(PathString path)
{
    if (path.StartsWithSegments("/swagger", StringComparison.OrdinalIgnoreCase))
        return false;

    if (path.StartsWithSegments("/health", StringComparison.OrdinalIgnoreCase))
        return false;

    if (path.StartsWithSegments("/api/v1/notification/swagger", StringComparison.OrdinalIgnoreCase))
        return false;

    return true;
}
