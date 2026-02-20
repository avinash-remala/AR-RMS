namespace Rms.Av.Application.DTOs;

public class MealPassDto
{
    public Guid Id { get; set; }
    public Guid CustomerId { get; set; }
    public string CustomerName { get; set; } = string.Empty;
    public string CustomerPhone { get; set; } = string.Empty;
    public int TotalMeals { get; set; }
    public int MealsUsed { get; set; }
    public int MealsRemaining { get; set; }
    public bool IsActive { get; set; }
    public DateTime? LastUsedAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

public class CreateMealPassDto
{
    public Guid CustomerId { get; set; }
    public int TotalMeals { get; set; } = 10;
}

public class UpdateMealPassDto
{
    public int? TotalMeals { get; set; }
    public int? MealsUsed { get; set; }
    public bool? IsActive { get; set; }
}

public class UseMealDto
{
    public Guid MealPassId { get; set; }
    public int MealsToUse { get; set; } = 1;
}
