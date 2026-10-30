using System.Net;
using System.Text.Json;
using Erp.BuildingBlocks.CommonResponses;
using FluentValidation;
using LeaveService.Application.Common.Exceptions;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;

namespace EnterpriseERP.Platform.Host.Middleware;

/// <summary>
/// Unified API error handling for the composite Platform.Host (replaces Auth-only middleware).
/// </summary>
public sealed class PlatformExceptionHandlingMiddleware(
    RequestDelegate next,
    ILogger<PlatformExceptionHandlingMiddleware> logger)
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
            var errors = vex.Errors
                .Select(e => new ApiError(string.IsNullOrWhiteSpace(e.PropertyName) ? "VALIDATION" : e.PropertyName, e.ErrorMessage))
                .ToList();
            await WriteAsync(context, HttpStatusCode.BadRequest, ApiResponse<object>.Fail(trace, errors));
        }
        catch (LeaveBusinessException bex)
        {
            var trace = context.TraceIdentifier;
            logger.LogWarning("Leave business rule: {Message}", bex.Message);
            await WriteAsync(
                context,
                HttpStatusCode.BadRequest,
                ApiResponse<object>.Fail(trace, [new ApiError("BUSINESS_RULE", bex.Message)]));
        }
        catch (InvalidOperationException business)
        {
            var trace = context.TraceIdentifier;
            logger.LogWarning(business, "Business rule violation");
            await WriteAsync(
                context,
                HttpStatusCode.BadRequest,
                ApiResponse<object>.Fail(trace, [new ApiError("BUSINESS_RULE", business.Message)]));
        }
        catch (UnauthorizedAccessException denied)
        {
            var trace = context.TraceIdentifier;
            logger.LogWarning(denied, "Access denied");
            await WriteAsync(
                context,
                HttpStatusCode.Forbidden,
                ApiResponse<object>.Fail(trace, [new ApiError("FORBIDDEN", denied.Message)]));
        }
        catch (DbUpdateConcurrencyException conflict)
        {
            logger.LogWarning(conflict, "Concurrent change rejected");
            await WriteAsync(context, HttpStatusCode.Conflict, ApiResponse<object>.Fail(context.TraceIdentifier,
                [new ApiError("CONCURRENT_CHANGE", "Another user changed this record. Refresh and try again.")]));
        }
        catch (DbUpdateException dbex)
        {
            var trace = context.TraceIdentifier;
            logger.LogWarning(dbex, "Database update failed");
            var detail = "The change conflicts with an existing record or a related record. Review the values and try again.";
            await WriteAsync(
                context,
                HttpStatusCode.Conflict,
                ApiResponse<object>.Fail(trace, [new ApiError("DATABASE_CONFLICT", detail)]));
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Unhandled exception");
            var trace = context.TraceIdentifier;
            await WriteAsync(
                context,
                HttpStatusCode.InternalServerError,
                ApiResponse<object>.Fail(trace, [new ApiError("INTERNAL_ERROR", "An unexpected error occurred.")]));
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
        await context.Response.WriteAsync(
            JsonSerializer.Serialize(payload, new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase }));
    }
}
