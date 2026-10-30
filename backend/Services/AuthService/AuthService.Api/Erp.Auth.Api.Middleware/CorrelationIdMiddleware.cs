using System;
using System.Diagnostics;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Primitives;
using Serilog.Context;

namespace AuthService.Api.Middleware;

public sealed class CorrelationIdMiddleware(RequestDelegate next)
{
	public const string HeaderName = "X-Correlation-Id";

	public async Task InvokeAsync(HttpContext context)
	{
		StringValues existing;
		string correlationId = ((context.Request.Headers.TryGetValue("X-Correlation-Id", out existing) && !string.IsNullOrWhiteSpace(existing)) ? existing.ToString() : Guid.NewGuid().ToString("N"));
		context.Response.Headers["X-Correlation-Id"] = correlationId;
		context.Items["CorrelationId"] = correlationId;
		Activity.Current?.SetTag("correlation.id", correlationId);
		using (LogContext.PushProperty("CorrelationId", correlationId))
		{
			await next(context);
		}
	}
}
