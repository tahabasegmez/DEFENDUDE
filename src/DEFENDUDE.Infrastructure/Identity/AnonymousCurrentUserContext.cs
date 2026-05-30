using DEFENDUDE.Application.Abstractions.Identity;

namespace DEFENDUDE.Infrastructure.Identity;

public sealed class AnonymousCurrentUserContext : ICurrentUserContext
{
    public bool IsAuthenticated => false;

    public string? UserId => null;

    public string? DisplayName => null;
}
