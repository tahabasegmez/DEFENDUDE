using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;

namespace DEFENDUDE.Web.Errors;

public sealed class GlobalExceptionHandler : IExceptionHandler
{
    private readonly IHostEnvironment _environment;
    private readonly ILogger<GlobalExceptionHandler> _logger;

    public GlobalExceptionHandler(
        IHostEnvironment environment,
        ILogger<GlobalExceptionHandler> logger)
    {
        _environment = environment;
        _logger = logger;
    }

    public async ValueTask<bool> TryHandleAsync(
        HttpContext httpContext,
        Exception exception,
        CancellationToken cancellationToken)
    {
        _logger.LogError(exception, "Unhandled exception occurred.");

        var problem = new ProblemDetails
        {
            Status = StatusCodes.Status500InternalServerError,
            Title = "Unexpected server error",
            Detail = _environment.IsDevelopment() ? exception.Message : null,
            Instance = httpContext.Request.Path
        };

        httpContext.Response.StatusCode = problem.Status.Value;

        await httpContext.Response.WriteAsJsonAsync(problem, cancellationToken);

        return true;
    }
}
