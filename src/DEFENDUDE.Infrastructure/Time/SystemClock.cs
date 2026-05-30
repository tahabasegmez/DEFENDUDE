using DEFENDUDE.Application.Abstractions.Clock;

namespace DEFENDUDE.Infrastructure.Time;

public sealed class SystemClock : IClock
{
    public DateTimeOffset UtcNow => DateTimeOffset.UtcNow;
}
