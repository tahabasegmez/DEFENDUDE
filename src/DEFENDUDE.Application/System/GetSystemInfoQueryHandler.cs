using DEFENDUDE.Application.Abstractions.Clock;
using DEFENDUDE.Application.Abstractions.Messaging;

namespace DEFENDUDE.Application.System;

public sealed class GetSystemInfoQueryHandler : IQueryHandler<GetSystemInfoQuery, SystemInfoResponse>
{
    private readonly IClock _clock;

    public GetSystemInfoQueryHandler(IClock clock)
    {
        _clock = clock;
    }

    public Task<SystemInfoResponse> HandleAsync(
        GetSystemInfoQuery query,
        CancellationToken cancellationToken = default)
    {
        var response = new SystemInfoResponse(
            query.ApplicationName,
            query.EnvironmentName,
            _clock.UtcNow);

        return Task.FromResult(response);
    }
}
