using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Rms.Av.Domain.Entities;
using Rms.Av.Infrastructure.Persistence;

namespace Rms.Av.Api.Controllers;

[ApiController]
[Route("api/v1/menu-items")]
public class MenuItemsController : ControllerBase
{
    private readonly RmsAvDbContext _context;
    private readonly ILogger<MenuItemsController> _logger;

    public MenuItemsController(RmsAvDbContext context, ILogger<MenuItemsController> logger)
    {
        _context = context;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<MenuItem>>> GetMenuItems([FromQuery] bool availableOnly = false)
    {
        var query = _context.MenuItems.AsQueryable();

        if (availableOnly)
        {
            query = query.Where(m => m.IsAvailable);
        }

        return await query
            .OrderBy(m => m.Category)
            .ThenBy(m => m.Name)
            .ToListAsync();
    }

    [HttpGet("by-category/{category}")]
    public async Task<ActionResult<IEnumerable<MenuItem>>> GetMenuItemsByCategory(string category)
    {
        var validCategories = new[] { "Veg", "NonVeg", "Dessert", "Appetizer" };
        if (!validCategories.Contains(category, StringComparer.OrdinalIgnoreCase))
        {
            return BadRequest(new { message = "Invalid category. Valid values: Veg, NonVeg, Dessert, Appetizer" });
        }

        var menuItems = await _context.MenuItems
            .Where(m => m.Category.ToLower() == category.ToLower() && m.IsAvailable)
            .OrderBy(m => m.Name)
            .ToListAsync();

        return Ok(menuItems);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<MenuItem>> GetMenuItem(Guid id)
    {
        var menuItem = await _context.MenuItems.FindAsync(id);

        if (menuItem == null)
        {
            return NotFound(new { message = "Menu item not found" });
        }

        return menuItem;
    }

    [HttpPost]
    public async Task<ActionResult<MenuItem>> CreateMenuItem(MenuItem menuItem)
    {
        // Check if menu item with same name already exists
        var existingItem = await _context.MenuItems
            .FirstOrDefaultAsync(m => m.Name.ToLower() == menuItem.Name.ToLower());

        if (existingItem != null)
        {
            return Conflict(new { message = "A menu item with this name already exists" });
        }

        _context.MenuItems.Add(menuItem);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetMenuItem), new { id = menuItem.Id }, menuItem);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateMenuItem(Guid id, MenuItem menuItem)
    {
        if (id != menuItem.Id)
        {
            return BadRequest(new { message = "ID mismatch" });
        }

        var existingMenuItem = await _context.MenuItems.FindAsync(id);
        if (existingMenuItem == null)
        {
            return NotFound(new { message = "Menu item not found" });
        }

        // Check if name is being changed and if it conflicts with another item
        if (existingMenuItem.Name.ToLower() != menuItem.Name.ToLower())
        {
            var nameExists = await _context.MenuItems
                .AnyAsync(m => m.Name.ToLower() == menuItem.Name.ToLower() && m.Id != id);

            if (nameExists)
            {
                return Conflict(new { message = "A menu item with this name already exists" });
            }
        }

        existingMenuItem.Name = menuItem.Name;
        existingMenuItem.Description = menuItem.Description;
        existingMenuItem.Price = menuItem.Price;
        existingMenuItem.Category = menuItem.Category;
        existingMenuItem.IsAvailable = menuItem.IsAvailable;
        existingMenuItem.ImageUrl = menuItem.ImageUrl;
        existingMenuItem.UpdatedAt = DateTime.UtcNow;

        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException)
        {
            if (!await MenuItemExists(id))
            {
                return NotFound(new { message = "Menu item not found" });
            }
            throw;
        }

        return NoContent();
    }

    [HttpPatch("{id}/availability")]
    public async Task<IActionResult> UpdateAvailability(Guid id, [FromBody] bool isAvailable)
    {
        var menuItem = await _context.MenuItems.FindAsync(id);
        if (menuItem == null)
        {
            return NotFound(new { message = "Menu item not found" });
        }

        menuItem.IsAvailable = isAvailable;
        menuItem.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return Ok(new { message = $"Menu item availability updated to {isAvailable}" });
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteMenuItem(Guid id)
    {
        var menuItem = await _context.MenuItems.FindAsync(id);
        if (menuItem == null)
        {
            return NotFound(new { message = "Menu item not found" });
        }

        // Soft delete by marking as unavailable
        menuItem.IsAvailable = false;
        menuItem.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return NoContent();
    }

    [HttpDelete("{id}/hard")]
    public async Task<IActionResult> HardDeleteMenuItem(Guid id)
    {
        var menuItem = await _context.MenuItems.FindAsync(id);
        if (menuItem == null)
        {
            return NotFound(new { message = "Menu item not found" });
        }

        // Check if menu item is referenced in any orders
        var hasOrders = await _context.Set<OrderItem>()
            .AnyAsync(oi => oi.MenuItemId == id);

        if (hasOrders)
        {
            return BadRequest(new { message = "Cannot delete menu item that is referenced in orders. Use soft delete instead." });
        }

        _context.MenuItems.Remove(menuItem);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    private async Task<bool> MenuItemExists(Guid id)
    {
        return await _context.MenuItems.AnyAsync(e => e.Id == id);
    }
}
