using Microsoft.AspNetCore.Http;

namespace PayrollService.Infrastructure.ExternalServices;

/// <summary>Forwards the incoming JWT to outbound service HTTP calls (Platform.Host in-process routing).</summary>
public sealed class ForwardAuthorizationHandler(IHttpContextAccessor httpContextAccessor) : DelegatingHandler
{
    protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
    {
        var httpContext = httpContextAccessor.HttpContext;
        var authorization = httpContext?.Request.Headers.Authorization.ToString();
        if (!string.IsNullOrWhiteSpace(authorization))
        {
            request.Headers.TryAddWithoutValidation("Authorization", authorization);
        }

        var companyId = httpContext?.Request.Headers["X-Company-Id"].ToString();
        if (!string.IsNullOrWhiteSpace(companyId))
        {
            request.Headers.TryAddWithoutValidation("X-Company-Id", companyId);
        }

        return base.SendAsync(request, cancellationToken);
    }
}
