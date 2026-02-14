using Rms.Av.Domain.Common.Base;

namespace Rms.Av.Domain.Modules.Employees;

public class Employee : AuditableEntity
{
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public EmployeeRole Role { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime? HiredDate { get; set; }
}

public enum EmployeeRole
{
    Admin = 1,
    Manager = 2,
    Kitchen = 3,
    Packing = 4,
    Delivery = 5
}
