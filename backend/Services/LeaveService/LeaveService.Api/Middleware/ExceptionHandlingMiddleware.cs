using System.Net;
using System.Linq;
using System.Text.Json;
using Erp.BuildingBlocks.CommonResponses;
using FluentValidation;
using LeaveService.Application.Common.Exceptions;
using Microsoft.AspNetCore.Http;

namespace LeaveService.Api.Middleware;

public sealed class ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
{
    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await next(context);
        }
        catch (ValidationException vex)
        {
            var trace = context.TraceIdentifier;
            var errors = vex.Errors.Select(e => new ApiError(e.PropertyName, e.ErrorMessage)).ToList();
            await WriteAsync(context, HttpStatusCode.BadRequest, ApiResponse<object>.Fail(trace, errors));
        }
        catch (LeaveBusinessException bex)
        {
            var trace = context.TraceIdentifier;
            await WriteAsync(context, HttpStatusCode.BadRequest, ApiResponse<object>.Fail(trace, [new ApiError("BUSINESS_RULE", bex.Message)]));
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Unhandled exception");
            var trace = context.TraceIdentifier;
            await WriteAsync(context, HttpStatusCode.InternalServerError, ApiResponse<object>.Fail(trace, [new ApiError("INTERNAL_ERROR", "An unexpected error occurred.")]));
        }
    }

    private static async Task WriteAsync<T>(HttpContext context, HttpStatusCode status, ApiResponse<T> payload)
    {
        if (context.Response.HasStarted)
        {
            return;
        }

        context.Response.Clear();
        context.Response.StatusCode = (int)status;
        context.Response.ContentType = "application/json; charset=utf-8";
        await context.Response.WriteAsync(JsonSerializer.Serialize(payload, new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase }));
    }
}
