using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Rms.Av.Domain.Entities;
using Rms.Av.Infrastructure.Persistence;

namespace Rms.Av.Api.Controllers;

[ApiController]
[Route("api/v1/orders")]
public class OrdersController : ControllerBase
{
    private readonly RmsAvDbContext _context;
    private readonly ILogger<OrdersController> _logger;

    public OrdersController(RmsAvDbContext context, ILogger<OrdersController> logger)
    {
        _context = context;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Order>>> GetOrders([FromQuery] bool me = false, [FromQuery] DateTime? date = null)
    {
        var query = _context.Orders.AsQueryable();

        // TODO: Filter by current customer if me=true
        // if (me) query = query.Where(o => o.CustomerId == currentCustomerId);

        if (date.HasValue)
        {
            var dateOnly = date.Value.Date;
            query = query.Where(o => o.OrderDate.Date == dateOnly);
        }

        return await query.OrderByDescending(o => o.CreatedAt).ToListAsync();
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Order>> GetOrder(Guid id)
    {
        var order = await _context.Orders
            .Include(o => o.Items)
            .Include(o => o.Extras)
            .FirstOrDefaultAsync(o => o.Id == id);

        if (order == null)
        {
            return NotFound();
        }

        return order;
    }

    [HttpPost]
    public async Task<ActionResult<Order>> CreateOrder(Order order)
    {
        order.OrderNumber = $"ORD-{DateTime.Now:yyyyMMdd}-{Random.Shared.Next(1000, 9999)}";
        _context.Orders.Add(order);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetOrder), new { id = order.Id }, order);
    }

    [HttpPatch("{id}/cancel")]
    public async Task<IActionResult> CancelOrder(Guid id)
    {
        var order = await _context.Orders.FindAsync(id);
        if (order == null)
        {
            return NotFound();
        }

        order.Status = OrderStatus.Cancelled;
        order.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return Ok(new { message = "Order cancelled successfully" });
    }
}
