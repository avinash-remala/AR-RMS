using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Rms.Av.Domain.Entities;

namespace Rms.Av.Api.Authorization;

/// <summary>
/// Authorization attribute to restrict access based on employee role.
/// Note: This requires authentication to be implemented in the future.
/// For now, it serves as documentation of permission requirements.
/// </summary>
[AttributeUsage(AttributeTargets.Class | AttributeTargets.Method, AllowMultiple = false)]
public class RequireRoleAttribute : Attribute, IAuthorizationFilter
{
    private readonly EmployeeRole[] _allowedRoles;

    public RequireRoleAttribute(params EmployeeRole[] allowedRoles)
    {
        _allowedRoles = allowedRoles;
    }

    public void OnAuthorization(AuthorizationFilterContext context)
    {
        // TODO: Implement actual role checking when authentication is added
        // For now, this attribute serves as documentation of permission requirements
        
        // Example implementation for when authentication is added:
        // var userRole = context.HttpContext.User.FindFirst("Role")?.Value;
        // if (string.IsNullOrEmpty(userRole) || !_allowedRoles.Any(r => r.ToString() == userRole))
        // {
        //     context.Result = new ForbidResult();
        // }
    }
}

/// <summary>
/// Predefined role permission groups for common access patterns
/// </summary>
public static class RolePermissions
{
    /// <summary>Admin only</summary>
    public static readonly EmployeeRole[] AdminOnly = { EmployeeRole.Admin };
    
    /// <summary>Admin and Manager</summary>
    public static readonly EmployeeRole[] Management = { EmployeeRole.Admin, EmployeeRole.Manager };
    
    /// <summary>Admin, Manager, and Employee</summary>
    public static readonly EmployeeRole[] Staff = { EmployeeRole.Admin, EmployeeRole.Manager, EmployeeRole.Employee };
    
    /// <summary>All roles (including restricted)</summary>
    public static readonly EmployeeRole[] AllRoles = 
    { 
        EmployeeRole.Admin, 
        EmployeeRole.Manager, 
        EmployeeRole.Employee,
        EmployeeRole.Kitchen,
        EmployeeRole.Packing,
        EmployeeRole.Delivery,
        EmployeeRole.Restricted
    };
    
    /// <summary>Operational roles (Kitchen, Packing, Delivery)</summary>
    public static readonly EmployeeRole[] Operations = 
    { 
        EmployeeRole.Kitchen, 
        EmployeeRole.Packing, 
        EmployeeRole.Delivery 
    };
}
