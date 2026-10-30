using FluentValidation;
using QualityService.Contracts;
using System.Net;
using System.Text.Json;

namespace QualityService.API.Middleware;

public sealed class ExceptionMiddleware(RequestDelegate next, ILogger<ExceptionMiddleware> logger)
{
    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await next(context);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "An unhandled exception occurred in the QualityService pipeline.");
            await HandleExceptionAsync(context, ex);
        }
    }

    private static async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        context.Response.ContentType = "application/json";
        var statusCode = (int)HttpStatusCode.InternalServerError;
        var message = "An internal server error occurred.";
        string[] errors = [];

        switch (exception)
        {
            case ValidationException valEx:
                statusCode = (int)HttpStatusCode.BadRequest;
                message = "Validation failed.";
                errors = valEx.Errors.Select(x => x.ErrorMessage).ToArray();
                break;

            case KeyNotFoundException keyEx:
                statusCode = (int)HttpStatusCode.NotFound;
                message = keyEx.Message;
                break;

            case InvalidOperationException opEx:
                statusCode = (int)HttpStatusCode.BadRequest;
                message = opEx.Message;
                break;
        }

        context.Response.StatusCode = statusCode;
        var response = ApiResponse<object>.Fail(message, errors);
        var json = JsonSerializer.Serialize(response);
        await context.Response.WriteAsync(json);
    }
}
