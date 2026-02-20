using MediatR;
using Microsoft.AspNetCore.Mvc;
using Rms.Av.Api.Authorization;
using Rms.Av.Application.DTOs;
using Rms.Av.Application.Features.MealPasses.Commands;
using Rms.Av.Application.Features.MealPasses.Queries;
using Rms.Av.Domain.Entities;

namespace Rms.Av.Api.Controllers;

[ApiController]
[Route("api/v1/meal-passes")]
[RequireRole(EmployeeRole.Admin, EmployeeRole.Manager, EmployeeRole.Employee)]  // Staff level
public class MealPassesController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly ILogger<MealPassesController> _logger;

    public MealPassesController(IMediator mediator, ILogger<MealPassesController> logger)
    {
        _mediator = mediator;
        _logger = logger;
    }

    /// <summary>
    /// Get all meal passes with optional active filter
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<IEnumerable<MealPassDto>>> GetAllMealPasses([FromQuery] bool? isActive = null)
    {
        try
        {
            var query = new GetAllMealPassesQuery(isActive);
            var mealPasses = await _mediator.Send(query);
            return Ok(mealPasses);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving meal passes");
            return StatusCode(500, new { message = "An error occurred while retrieving meal passes" });
        }
    }

    /// <summary>
    /// Get meal pass by ID
    /// </summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<MealPassDto>> GetMealPassById(Guid id)
    {
        try
        {
            var query = new GetMealPassByIdQuery(id);
            var mealPass = await _mediator.Send(query);
            
            if (mealPass == null)
            {
                return NotFound(new { message = $"Meal pass with ID {id} not found" });
            }

            return Ok(mealPass);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving meal pass {Id}", id);
            return StatusCode(500, new { message = "An error occurred while retrieving the meal pass" });
        }
    }

    /// <summary>
    /// Create a new meal pass
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<MealPassDto>> CreateMealPass([FromBody] CreateMealPassDto dto)
    {
        try
        {
            var command = new CreateMealPassCommand(dto);
            var mealPass = await _mediator.Send(command);
            return CreatedAtAction(nameof(GetMealPassById), new { id = mealPass.Id }, mealPass);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating meal pass");
            return StatusCode(500, new { message = "An error occurred while creating the meal pass" });
        }
    }

    /// <summary>
    /// Update an existing meal pass
    /// </summary>
    [HttpPut("{id}")]
    public async Task<ActionResult<MealPassDto>> UpdateMealPass(Guid id, [FromBody] UpdateMealPassDto dto)
    {
        try
        {
            var command = new UpdateMealPassCommand(id, dto);
            var mealPass = await _mediator.Send(command);
            return Ok(mealPass);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating meal pass {Id}", id);
            return StatusCode(500, new { message = "An error occurred while updating the meal pass" });
        }
    }

    /// <summary>
    /// Delete a meal pass
    /// </summary>
    [HttpDelete("{id}")]
    public async Task<ActionResult> DeleteMealPass(Guid id)
    {
        try
        {
            var command = new DeleteMealPassCommand(id);
            var success = await _mediator.Send(command);
            
            if (!success)
            {
                return NotFound(new { message = $"Meal pass with ID {id} not found" });
            }

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting meal pass {Id}", id);
            return StatusCode(500, new { message = "An error occurred while deleting the meal pass" });
        }
    }

    /// <summary>
    /// Use meals from a meal pass
    /// </summary>
    [HttpPost("{id}/use")]
    public async Task<ActionResult<MealPassDto>> UseMeal(Guid id, [FromBody] int mealsToUse = 1)
    {
        try
        {
            var command = new UseMealCommand(id, mealsToUse);
            var mealPass = await _mediator.Send(command);
            return Ok(mealPass);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error using meal from pass {Id}", id);
            return StatusCode(500, new { message = "An error occurred while using the meal" });
        }
    }
}
