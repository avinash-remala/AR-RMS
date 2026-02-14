using Microsoft.EntityFrameworkCore;
using Rms.Av.Domain.Modules.Auth;
using Rms.Av.Domain.Modules.Companies;
using Rms.Av.Domain.Modules.Employees;
using Rms.Av.Domain.Modules.Menu;
using Rms.Av.Domain.Modules.Orders;
using Rms.Av.Domain.Modules.Payments;

namespace Rms.Av.Infrastructure.Persistence;

public class RmsAvDbContext : DbContext
{
    public RmsAvDbContext(DbContextOptions<RmsAvDbContext> options) : base(options)
    {
    }

    // Auth
    public DbSet<User> Users => Set<User>();
    public DbSet<OtpCode> OtpCodes => Set<OtpCode>();
    
    // Core Entities
    public DbSet<Employee> Employees => Set<Employee>();
    public DbSet<Company> Companies => Set<Company>();
    public DbSet<Order> Orders => Set<Order>();
    public DbSet<OrderItem> OrderItems => Set<OrderItem>();
    public DbSet<OrderExtra> OrderExtras => Set<OrderExtra>();
    
    // Menu
    public DbSet<MenuItem> MenuItems => Set<MenuItem>();
    public DbSet<ExtraItem> ExtraItems => Set<ExtraItem>();
    
    // Payments
    public DbSet<Vendor> Vendors => Set<Vendor>();
    public DbSet<VendorInvoice> VendorInvoices => Set<VendorInvoice>();
    public DbSet<VendorPayment> VendorPayments => Set<VendorPayment>();
    public DbSet<EmployeeHours> EmployeeHours => Set<EmployeeHours>();
    public DbSet<EmployeePayment> EmployeePayments => Set<EmployeePayment>();

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
            
        modelBuilder.Entity<User>()
            .Property(u => u.Role)
            .HasConversion<string>();
            
        modelBuilder.Entity<VendorInvoice>()
            .Property(v => v.Status)
            .HasConversion<string>();
    }
}
