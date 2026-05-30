using DEFENDUDE.Application.System;
using DEFENDUDE.Web.Configuration;
using Microsoft.Extensions.Options;

namespace DEFENDUDE.Web.Endpoints;

public static class SystemEndpoints
{
    public static RouteGroupBuilder MapSystemEndpoints(this RouteGroupBuilder api)
    {
        var group = api.MapGroup("/system")
            .WithTags("System");

        group.MapGet("/info", async (
            GetSystemInfoQueryHandler handler,
            IHostEnvironment environment,
            IOptions<AppOptions> options,
            CancellationToken cancellationToken) =>
        {
            var query = new GetSystemInfoQuery(
                options.Value.Name,
                environment.EnvironmentName);

            var response = await handler.HandleAsync(query, cancellationToken);

            return Results.Ok(response);
        });

        return api;
    }
}
