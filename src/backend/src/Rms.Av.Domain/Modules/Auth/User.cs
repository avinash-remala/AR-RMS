using Rms.Av.Domain.Common.Base;

namespace Rms.Av.Domain.Modules.Auth;

public class User : AuditableEntity
{
    public string FullName { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? PasswordHash { get; set; }
    public UserRole Role { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime? LastLoginAt { get; set; }
}

public enum UserRole
{
    User = 1,      // Customer
    Employee = 2,  // Staff
    Admin = 3      // Admin
}
