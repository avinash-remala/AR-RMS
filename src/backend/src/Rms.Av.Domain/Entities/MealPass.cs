using Rms.Av.Domain.Common.Base;

namespace Rms.Av.Domain.Entities;

public class MealPass : AuditableEntity
{
    public Guid CustomerId { get; set; }
    public Customer? Customer { get; set; }
    public int TotalMeals { get; set; } = 10;
    public int MealsUsed { get; set; } = 0;
    public bool IsActive { get; set; } = true;
    public DateTime? LastUsedAt { get; set; }
    
    public int MealsRemaining => TotalMeals - MealsUsed;
}
