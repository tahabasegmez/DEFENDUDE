using DEFENDUDE.Application.Abstractions.Clock;
using DEFENDUDE.Application.Abstractions.Identity;
using DEFENDUDE.Application.Abstractions.Persistence;
using DEFENDUDE.Infrastructure.Identity;
using DEFENDUDE.Infrastructure.Persistence;
using DEFENDUDE.Infrastructure.Time;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace DEFENDUDE.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        _ = configuration;

        services.AddSingleton<IClock, SystemClock>();
        services.AddScoped<ICurrentUserContext, AnonymousCurrentUserContext>();
        services.AddScoped<IUnitOfWork, NoOpUnitOfWork>();

        return services;
    }
}
