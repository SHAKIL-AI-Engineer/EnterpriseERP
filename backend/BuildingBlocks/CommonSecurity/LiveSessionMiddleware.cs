using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;

namespace Erp.BuildingBlocks.CommonSecurity;

/// <summary>Standalone services check the authoritative account status and session stamp.</summary>
public sealed class LiveSessionMiddleware(RequestDelegate next, IConfiguration configuration)
{
    private static readonly HttpClient Client = new() { Timeout = TimeSpan.FromSeconds(5) };
    public async Task InvokeAsync(HttpContext context)
    {
        if (context.User.Identity?.IsAuthenticated != true) { await next(context); return; }
        var endpoint = configuration["ERP_AUTH_SESSION_URL"] ?? "http://127.0.0.1:5000/api/v1/auth/me";
        using var request = new HttpRequestMessage(HttpMethod.Get, endpoint);
        request.Headers.TryAddWithoutValidation("Authorization", context.Request.Headers.Authorization.ToString());
        try
        {
            using var response = await Client.SendAsync(request, HttpCompletionOption.ResponseHeadersRead, context.RequestAborted);
            if (!response.IsSuccessStatusCode) { context.Response.StatusCode = response.StatusCode == System.Net.HttpStatusCode.Unauthorized ? 401 : 503; return; }
        }
        catch (HttpRequestException) { context.Response.StatusCode = 503; return; }
        catch (TaskCanceledException) when (!context.RequestAborted.IsCancellationRequested) { context.Response.StatusCode = 503; return; }
        await next(context);
    }
}
