using Microsoft.EntityFrameworkCore.Storage;
using Rms.Av.Application.Interfaces;
using Rms.Av.Domain.Entities;
using Rms.Av.Infrastructure.Persistence;

namespace Rms.Av.Infrastructure.Repositories;

public class UnitOfWork : IUnitOfWork
{
    private readonly RmsAvDbContext _context;
    private IDbContextTransaction? _transaction;

    public IRepository<Customer> Customers { get; }
    public IRepository<MenuItem> MenuItems { get; }
    public IRepository<ExtraItem> ExtraItems { get; }
    public IRepository<Pricing> Pricings { get; }
    public IRepository<MealPass> MealPasses { get; }
    public IOrderRepository Orders { get; }
    public IRepository<Company> Companies { get; }
    public IRepository<Employee> Employees { get; }
    public IRepository<Vendor> Vendors { get; }
    public IRepository<OtpUsage> OtpUsages { get; }

    public UnitOfWork(RmsAvDbContext context)
    {
        _context = context;
        
        Customers = new Repository<Customer>(context);
        MenuItems = new Repository<MenuItem>(context);
        ExtraItems = new Repository<ExtraItem>(context);
        Pricings = new Repository<Pricing>(context);
        MealPasses = new Repository<MealPass>(context);
        Orders = new OrderRepository(context);
        Companies = new Repository<Company>(context);
        Employees = new Repository<Employee>(context);
        Vendors = new Repository<Vendor>(context);
        OtpUsages = new Repository<OtpUsage>(context);
    }

    public async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        return await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task BeginTransactionAsync(CancellationToken cancellationToken = default)
    {
        _transaction = await _context.Database.BeginTransactionAsync(cancellationToken);
    }

    public async Task CommitTransactionAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            await _context.SaveChangesAsync(cancellationToken);
            if (_transaction != null)
            {
                await _transaction.CommitAsync(cancellationToken);
            }
        }
        catch
        {
            await RollbackTransactionAsync(cancellationToken);
            throw;
        }
        finally
        {
            if (_transaction != null)
            {
                await _transaction.DisposeAsync();
                _transaction = null;
            }
        }
    }

    public async Task RollbackTransactionAsync(CancellationToken cancellationToken = default)
    {
        if (_transaction != null)
        {
            await _transaction.RollbackAsync(cancellationToken);
            await _transaction.DisposeAsync();
            _transaction = null;
        }
    }

    public void Dispose()
    {
        _transaction?.Dispose();
        _context.Dispose();
    }
}
