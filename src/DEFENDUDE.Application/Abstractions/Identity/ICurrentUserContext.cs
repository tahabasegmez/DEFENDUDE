namespace DEFENDUDE.Application.Abstractions.Identity;

public interface ICurrentUserContext
{
    bool IsAuthenticated { get; }

    string? UserId { get; }

    string? DisplayName { get; }
}
