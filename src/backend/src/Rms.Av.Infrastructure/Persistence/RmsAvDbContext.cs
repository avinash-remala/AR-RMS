using Microsoft.EntityFrameworkCore;
using Rms.Av.Domain.Entities;

namespace Rms.Av.Infrastructure.Persistence;

public class RmsAvDbContext : DbContext
{
    public RmsAvDbContext(DbContextOptions<RmsAvDbContext> options) : base(options)
    {
    }

    // Auth
    public DbSet<Customer> Customers => Set<Customer>();
    public DbSet<OtpCode> OtpCodes => Set<OtpCode>();
    public DbSet<OtpUsage> OtpUsages => Set<OtpUsage>();
    
    // Core Entities
    public DbSet<Employee> Employees => Set<Employee>();
    public DbSet<Company> Companies => Set<Company>();
    public DbSet<Order> Orders => Set<Order>();
    public DbSet<OrderItem> OrderItems => Set<OrderItem>();
    public DbSet<OrderExtra> OrderExtras => Set<OrderExtra>();
    
    // Menu
    public DbSet<MenuItem> MenuItems => Set<MenuItem>();
    public DbSet<ExtraItem> ExtraItems => Set<ExtraItem>();
    
    // Pricing
    public DbSet<Pricing> Pricings => Set<Pricing>();
    
    // Meal Passes
    public DbSet<MealPass> MealPasses => Set<MealPass>();
    
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
            
        // Configure unique index on Customer phone number
        modelBuilder.Entity<Customer>()
            .HasIndex(c => c.Phone)
            .IsUnique();
            
        // Configure unique index on OtpUsage phone number
        modelBuilder.Entity<OtpUsage>()
            .HasIndex(o => o.PhoneNumber)
            .IsUnique();
            
        // Configure unique index on Pricing box type
        modelBuilder.Entity<Pricing>()
            .HasIndex(p => p.BoxType)
            .IsUnique();
            
        modelBuilder.Entity<VendorInvoice>()
            .Property(v => v.Status)
            .HasConversion<string>();
    }
}
