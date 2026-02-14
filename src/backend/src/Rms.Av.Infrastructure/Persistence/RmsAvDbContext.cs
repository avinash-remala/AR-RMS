using Microsoft.EntityFrameworkCore;
using Rms.Av.Domain.Modules.Companies;
using Rms.Av.Domain.Modules.Employees;
using Rms.Av.Domain.Modules.Orders;

namespace Rms.Av.Infrastructure.Persistence;

public class RmsAvDbContext : DbContext
{
    public RmsAvDbContext(DbContextOptions<RmsAvDbContext> options) : base(options)
    {
    }

    public DbSet<Employee> Employees => Set<Employee>();
    public DbSet<Company> Companies => Set<Company>();
    public DbSet<Order> Orders => Set<Order>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Apply configurations from assemblies
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(RmsAvDbContext).Assembly);

        // Configure enums to be stored as strings
        modelBuilder.Entity<Employee>()
            .Property(e => e.Role)
            .HasConversion<string>();

        modelBuilder.Entity<Order>()
            .Property(o => o.Status)
            .HasConversion<string>();
    }
}
