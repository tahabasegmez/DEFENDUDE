using DEFENDUDE.Application.Abstractions.Persistence;

namespace DEFENDUDE.Infrastructure.Persistence;

public sealed class NoOpUnitOfWork : IUnitOfWork
{
    public Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        return Task.FromResult(0);
    }
}
