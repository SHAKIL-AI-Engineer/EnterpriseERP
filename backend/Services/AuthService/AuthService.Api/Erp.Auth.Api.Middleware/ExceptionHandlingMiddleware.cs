using System;
using System.Net;
using System.Text.Json;
using System.Threading.Tasks;
using AuthService.Contracts.Common;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;

namespace AuthService.Api.Middleware;

public sealed class ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
{
	public async Task InvokeAsync(HttpContext context)
	{
		try
		{
			await next(context);
		}
		catch (InvalidOperationException business)
		{
			logger.LogWarning(business, "Business rule violation");
			await WriteErrorAsync(context, HttpStatusCode.BadRequest, "BUSINESS_RULE", business.Message);
		}
		catch (UnauthorizedAccessException denied)
		{
			logger.LogWarning(denied, "Access denied");
			await WriteErrorAsync(context, HttpStatusCode.Forbidden, "Forbidden", denied.Message);
		}
		catch (Exception exception)
		{
			logger.LogError(exception, "Unhandled exception");
			await WriteErrorAsync(context, HttpStatusCode.InternalServerError, "INTERNAL_ERROR", "An unexpected error occurred.");
		}
	}

	private static async Task WriteErrorAsync(HttpContext context, HttpStatusCode status, string code, string message)
	{
		if (!context.Response.HasStarted)
		{
			context.Response.Clear();
			context.Response.StatusCode = (int)status;
			context.Response.ContentType = "application/json";
			object? cid;
			string traceId = (context.Items.TryGetValue("CorrelationId", out cid) && cid is string s) ? s : context.TraceIdentifier;
			ApiResponse<object> payload = ApiResponse<object>.Fail(traceId, new ApiError[1]
			{
				new ApiError(code, message)
			});
			await HttpResponseWritingExtensions.WriteAsync(text: JsonSerializer.Serialize(payload, new JsonSerializerOptions
			{
				PropertyNamingPolicy = JsonNamingPolicy.CamelCase
			}), response: context.Response);
		}
	}
}
