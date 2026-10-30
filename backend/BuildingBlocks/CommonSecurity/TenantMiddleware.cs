using System.Security.Claims;
using System.Text.Json;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace Erp.BuildingBlocks.CommonSecurity;

public sealed class TenantMiddleware(
    RequestDelegate next,
    IOptions<TenantOptions> options,
    ILogger<TenantMiddleware> logger)
{
    private static readonly HashSet<string> ExcludedPathPrefixes =
    [
        "/health",
        "/swagger",
        "/api/v1/auth/login",
        "/api/v1/auth/register",
        "/api/v1/auth/refresh-token",
        "/api/v1/auth/verify-2fa",
        "/api/v1/auth/me",
    ];

    public async Task InvokeAsync(HttpContext context, ITenantContext tenant)
    {
        if (tenant is not TenantContext mutable)
        {
            await next(context);
            return;
        }

        var path = context.Request.Path.Value ?? string.Empty;
        if (ShouldSkip(path) || !(context.User.Identity?.IsAuthenticated ?? false))
        {
            await next(context);
            return;
        }

        PopulateFromClaims(context.User, mutable);
        await EnrichFromDatabaseAsync(context, mutable);

        if (mutable.IsSuperAdmin)
        {
            ResolveActiveCompanyForSuperAdmin(context, mutable);
            await next(context);
            return;
        }

        if (options.Value.EnforceTenant && mutable.AllowedCompanyIds.Count == 0)
        {
            await WriteForbiddenAsync(context, "No company assigned to your account.");
            return;
        }

        if (!TryResolveActiveCompany(context, mutable, options.Value, out var error))
        {
            await WriteForbiddenAsync(context, error!);
            return;
        }

        if (options.Value.EnforceTenant && mutable.ActiveCompanyId.HasValue)
        {
            var queryCompanyId = GetCompanyIdFromQuery(context);
            if (queryCompanyId.HasValue && queryCompanyId.Value != mutable.ActiveCompanyId.Value)
            {
                logger.LogWarning(
                    "Cross-tenant query attempt user={UserId} queryCompany={QueryCompany} active={ActiveCompany}",
                    mutable.UserId,
                    queryCompanyId,
                    mutable.ActiveCompanyId);
                await WriteForbiddenAsync(context, "Company scope mismatch.");
                return;
            }
        }

        await next(context);
    }

    private static bool ShouldSkip(string path)
    {
        foreach (var prefix in ExcludedPathPrefixes)
        {
            if (path.StartsWith(prefix, StringComparison.OrdinalIgnoreCase))
            {
                return true;
            }
        }

        return false;
    }

    private static void PopulateFromClaims(ClaimsPrincipal user, TenantContext tenant)
    {
        tenant.IsAuthenticated = true;
        var sub = user.FindFirstValue(ClaimTypes.NameIdentifier) ?? user.FindFirstValue("sub");
        if (Guid.TryParse(sub, out var userId))
        {
            tenant.UserId = userId;
        }

        tenant.IsSuperAdmin = string.Equals(
            user.FindFirstValue(SecurityClaimTypes.IsSuperAdmin),
            "true",
            StringComparison.OrdinalIgnoreCase)
            || user.IsInRole("SuperAdmin");

        tenant.TenantScope = user.FindFirstValue(SecurityClaimTypes.TenantScope)
            ?? (tenant.IsSuperAdmin ? SecurityClaimTypes.TenantScopeGlobal : SecurityClaimTypes.TenantScopeCompany);

        tenant.AllowedCompanyIds = ParseCompanyIdsFromPrincipal(user);
        var defaultCompany = user.FindFirstValue(SecurityClaimTypes.DefaultCompanyId);
        tenant.DefaultCompanyId = Guid.TryParse(defaultCompany, out var dc) ? dc : tenant.AllowedCompanyIds.FirstOrDefault();
    }

    private static async Task EnrichFromDatabaseAsync(HttpContext context, TenantContext tenant)
    {
        if (tenant.IsSuperAdmin || !tenant.UserId.HasValue)
        {
            return;
        }

        var resolver = context.RequestServices.GetService<ITenantCompanyAccessResolver>();
        if (resolver is null)
        {
            return;
        }

        var snapshot = await resolver.GetForUserAsync(tenant.UserId.Value, context.RequestAborted);
        if (snapshot is null)
        {
            return;
        }

        tenant.AllowedCompanyIds = snapshot.CompanyIds;
        tenant.DefaultCompanyId = snapshot.DefaultCompanyId ?? snapshot.CompanyIds.FirstOrDefault();
    }

    private static IReadOnlyList<Guid> ParseCompanyIdsFromPrincipal(ClaimsPrincipal user)
    {
        var claim = user.FindFirst(SecurityClaimTypes.CompanyIds)
            ?? user.Claims.FirstOrDefault(c =>
                c.Type.Contains("company_ids", StringComparison.OrdinalIgnoreCase));

        if (claim is not null)
        {
            var parsed = TryParseCompanyIdList(claim.Value);
            if (parsed.Count > 0)
            {
                return parsed;
            }
        }

        var fromMany = user.FindAll(SecurityClaimTypes.CompanyIds)
            .SelectMany(c => TryParseCompanyIdList(c.Value))
            .Where(x => x != Guid.Empty)
            .Distinct()
            .ToList();

        return fromMany;
    }

    private static List<Guid> TryParseCompanyIdList(string? raw)
    {
        if (string.IsNullOrWhiteSpace(raw))
        {
            return [];
        }

        var trimmed = raw.Trim();
        if (trimmed.StartsWith('['))
        {
            try
            {
                var ids = JsonSerializer.Deserialize<List<Guid>>(trimmed);
                return ids?.Where(x => x != Guid.Empty).Distinct().ToList() ?? [];
            }
            catch
            {
                // fall through
            }
        }

        var result = new List<Guid>();
        foreach (var part in trimmed.Split([',', ';'], StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries))
        {
            if (Guid.TryParse(part, out var g) && g != Guid.Empty)
            {
                result.Add(g);
            }
        }

        return result.Distinct().ToList();
    }

    private static bool TryResolveActiveCompany(
        HttpContext context,
        TenantContext tenant,
        TenantOptions options,
        out string? error)
    {
        error = null;
        Guid? headerCompany = null;
        if (context.Request.Headers.TryGetValue(SecurityClaimTypes.CompanyIdHeader, out var headerValue)
            && Guid.TryParse(headerValue.ToString(), out var parsed))
        {
            headerCompany = parsed;
        }

        if (headerCompany.HasValue)
        {
            if (tenant.HasAccessToCompany(headerCompany.Value))
            {
                tenant.ActiveCompanyId = headerCompany;
                return true;
            }

            // Stale or tampered header: fall back to JWT default instead of hard 403.
        }

        if (tenant.DefaultCompanyId.HasValue && tenant.HasAccessToCompany(tenant.DefaultCompanyId.Value))
        {
            tenant.ActiveCompanyId = tenant.DefaultCompanyId;
            return true;
        }

        if (tenant.AllowedCompanyIds.Count > 0)
        {
            tenant.ActiveCompanyId = tenant.AllowedCompanyIds[0];
            return true;
        }

        if (options.RequireCompanyHeaderForScopedUsers)
        {
            error = "Company context is required. Send the X-Company-Id header.";
            return false;
        }

        return true;
    }

    private static void ResolveActiveCompanyForSuperAdmin(HttpContext context, TenantContext tenant)
    {
        if (context.Request.Headers.TryGetValue(SecurityClaimTypes.CompanyIdHeader, out var headerValue)
            && Guid.TryParse(headerValue.ToString(), out var parsed))
        {
            tenant.ActiveCompanyId = parsed;
            return;
        }

        var queryCompanyId = GetCompanyIdFromQuery(context);
        if (queryCompanyId.HasValue)
        {
            tenant.ActiveCompanyId = queryCompanyId;
        }
    }

    private static Guid? GetCompanyIdFromQuery(HttpContext context)
    {
        if (context.Request.Query.TryGetValue("companyId", out var v) && Guid.TryParse(v.ToString(), out var g))
        {
            return g;
        }

        return null;
    }

    private static async Task WriteForbiddenAsync(HttpContext context, string message)
    {
        context.Response.StatusCode = StatusCodes.Status403Forbidden;
        context.Response.ContentType = "application/json; charset=utf-8";
        await context.Response.WriteAsJsonAsync(new
        {
            success = false,
            traceId = context.TraceIdentifier,
            errors = new[] { new { code = "Forbidden", message } },
        });
    }
}
