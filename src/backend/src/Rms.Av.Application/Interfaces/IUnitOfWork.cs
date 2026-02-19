using Rms.Av.Domain.Entities;

namespace Rms.Av.Application.Interfaces;

public interface IUnitOfWork : IDisposable
{
    IRepository<Customer> Customers { get; }
    IRepository<MenuItem> MenuItems { get; }
    IRepository<ExtraItem> ExtraItems { get; }
    IOrderRepository Orders { get; }
    IRepository<Company> Companies { get; }
    IRepository<Employee> Employees { get; }
    IRepository<Vendor> Vendors { get; }
    IRepository<OtpUsage> OtpUsages { get; }
    
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
    Task BeginTransactionAsync(CancellationToken cancellationToken = default);
    Task CommitTransactionAsync(CancellationToken cancellationToken = default);
    Task RollbackTransactionAsync(CancellationToken cancellationToken = default);
}
