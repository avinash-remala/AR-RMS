using MediatR;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Rms.Av.Api.Authorization;
using Rms.Av.Application.DTOs;
using Rms.Av.Application.Features.Pricing.Commands;
using Rms.Av.Application.Features.Pricing.Queries;
using Rms.Av.Domain.Entities;
using Rms.Av.Infrastructure.Persistence;

namespace Rms.Av.Api.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
[RequireRole(EmployeeRole.Admin, EmployeeRole.Manager)]  // Management only
public class PricingController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly ILogger<PricingController> _logger;
    private readonly RmsAvDbContext _context;

    public PricingController(IMediator mediator, ILogger<PricingController> logger, RmsAvDbContext context)
    {
        _mediator = mediator;
        _logger = logger;
        _context = context;
    }

    /// <summary>
    /// Get all pricing configurations
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<IEnumerable<PricingDto>>> GetAllPricing()
    {
        try
        {
            var pricing = await _mediator.Send(new GetAllPricingsQuery());
            return Ok(pricing);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving pricing");
            return StatusCode(500, new { message = "An error occurred while retrieving pricing" });
        }
    }

    /// <summary>
    /// Get active pricing only (for customer-facing pages)
    /// </summary>
    [HttpGet("active")]
    public async Task<ActionResult<IEnumerable<PricingDto>>> GetActivePricing()
    {
        try
        {
            var pricing = await _mediator.Send(new GetActivePricingsQuery());
            return Ok(pricing);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving active pricing");
            return StatusCode(500, new { message = "An error occurred while retrieving active pricing" });
        }
    }

    /// <summary>
    /// Toggle active status for a box type. Also syncs the linked MenuItem.IsAvailable.
    /// </summary>
    [HttpPatch("{boxType}/active")]
    public async Task<IActionResult> ToggleActive(string boxType, [FromBody] bool isActive)
    {
        var pricing = await _context.Pricings.FirstOrDefaultAsync(p => p.BoxType == boxType);
        if (pricing == null)
            return NotFound(new { message = $"Pricing not found for box type '{boxType}'" });

        pricing.IsActive = isActive;
        pricing.UpdatedAt = DateTime.UtcNow;

        // Sync the matching MenuItem.IsAvailable (matched by normalized display name)
        var normalizedDisplay = pricing.DisplayName.Replace("-", " ").Trim().ToLower();
        var menuItems = await _context.MenuItems
            .Where(m => m.Category == "")
            .ToListAsync();

        foreach (var item in menuItems)
        {
            var normalizedItem = item.Name.Replace("-", " ").Trim().ToLower();
            if (normalizedItem == normalizedDisplay)
            {
                item.IsAvailable = isActive;
                item.UpdatedAt = DateTime.UtcNow;
            }
        }

        await _context.SaveChangesAsync();
        return Ok(new { boxType, isActive });
    }

    /// <summary>
    /// Update a specific box type's pricing
    /// </summary>
    [HttpPut("{boxType}")]
    public async Task<ActionResult<PricingDto>> UpdatePricing(string boxType, [FromBody] UpdatePricingDto dto)
    {
        try
        {
            var pricing = await _mediator.Send(new UpdatePricingCommand(boxType, dto.Price));
            return Ok(pricing);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating pricing for {BoxType}", boxType);
            return StatusCode(500, new { message = "An error occurred while updating pricing" });
        }
    }

    /// <summary>
    /// Bulk update all pricing
    /// </summary>
    [HttpPut]
    public async Task<ActionResult<IEnumerable<PricingDto>>> BulkUpdatePricing([FromBody] BulkUpdatePricingDto dto)
    {
        try
        {
            var pricing = await _mediator.Send(new BulkUpdatePricingCommand(dto.Pricings));
            return Ok(pricing);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error bulk updating pricing");
            return StatusCode(500, new { message = "An error occurred while updating pricing" });
        }
    }
}
