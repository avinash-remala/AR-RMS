using FluentValidation;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using System.Net;

namespace Rms.Av.Api.Middleware;

/// <summary>
/// Maps known exceptions to RFC 7807 ProblemDetails responses.
/// </summary>
public class GlobalExceptionHandler : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(HttpContext httpContext, Exception exception, CancellationToken cancellationToken)
    {
        var (statusCode, title, detail, type) = exception switch
        {
            ValidationException validationEx => (HttpStatusCode.BadRequest, "Validation failed",
                string.Join("; ", validationEx.Errors.Select(e => e.ErrorMessage)), "validation_error"),
            InvalidOperationException invalidOp => (HttpStatusCode.Conflict, "Conflict", invalidOp.Message, "conflict"),
            KeyNotFoundException notFound => (HttpStatusCode.NotFound, "Not Found", notFound.Message, "not_found"),
            _ => (HttpStatusCode.InternalServerError, "Internal Server Error", "An unexpected error occurred.", "server_error")
        };

        var problem = new ProblemDetails
        {
            Title = title,
            Detail = detail,
            Status = (int)statusCode,
            Type = $"https://httpstatuses.com/{(int)statusCode}"
        };

        httpContext.Response.StatusCode = problem.Status ?? (int)HttpStatusCode.InternalServerError;
        httpContext.Response.ContentType = "application/problem+json";
        await httpContext.Response.WriteAsJsonAsync(problem, cancellationToken);

        return true;
    }
}
