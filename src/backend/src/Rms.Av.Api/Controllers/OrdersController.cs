using MediatR;
using Microsoft.AspNetCore.Mvc;
using Rms.Av.Application.DTOs;
using Rms.Av.Application.Features.Orders.Commands;
using Rms.Av.Application.Features.Orders.Queries;

namespace Rms.Av.Api.Controllers;

[ApiController]
[Route("api/v1/orders")]
public class OrdersController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly ILogger<OrdersController> _logger;

    public OrdersController(IMediator mediator, ILogger<OrdersController> logger)
    {
        _mediator = mediator;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<OrderDto>>> GetOrders(
        [FromQuery] DateTime? from = null, 
        [FromQuery] DateTime? to = null,
        [FromQuery] string? building = null)
    {
        var query = new GetOrdersByDateRangeQuery(from, to, building);
        var orders = await _mediator.Send(query);
        return Ok(orders);
    }

    [HttpGet("today")]
    public async Task<ActionResult<IEnumerable<OrderDto>>> GetTodayOrders([FromQuery] string? building = null)
    {
        var today = DateTime.Now.Date;
        var query = new GetOrdersByDateRangeQuery(today, today, building);
        var orders = await _mediator.Send(query);
        return Ok(orders);
    }

    /// <summary>
    /// Get order summary with counts by type and address
    /// </summary>
    [HttpGet("summary")]
    public async Task<ActionResult<OrderSummaryDto>> GetOrderSummary(
        [FromQuery] DateTime? date = null,
        [FromQuery] bool all = false)
    {
        try
        {
            // If 'all' parameter is true, get all orders (pass null to query)
            // Otherwise, default to today's date if not provided
            DateTime? filterDate = all ? null : (date ?? DateTime.Now.Date);
            var query = new GetOrderSummaryQuery(filterDate);
            var summary = await _mediator.Send(query);
            return Ok(summary);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving order summary");
            return StatusCode(500, new { message = "An error occurred while retrieving order summary" });
        }
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<OrderDto>> GetOrder(Guid id)
    {
        var query = new GetOrderByIdQuery(id);
        var order = await _mediator.Send(query);

        if (order == null)
        {
            return NotFound();
        }

        return Ok(order);
    }

    [HttpPost]
    public async Task<ActionResult<OrderDto>> CreateOrder(CreateOrderDto orderDto)
    {
        var command = new CreateOrderCommand(orderDto);
        var order = await _mediator.Send(command);

        return CreatedAtAction(nameof(GetOrder), new { id = order.Id }, order);
    }

    [HttpPatch("{id}/status")]
    public async Task<IActionResult> UpdateOrderStatus(Guid id, [FromBody] UpdateOrderStatusRequest request)
    {
        if (!Enum.TryParse<Domain.Entities.OrderStatus>(request.Status, true, out var status))
        {
            return BadRequest(new { message = "Invalid order status" });
        }

        var command = new UpdateOrderStatusCommand(id, status);
        await _mediator.Send(command);
        return Ok(new { message = "Order status updated successfully" });
    }

    [HttpPatch("{id}/cancel")]
    public async Task<IActionResult> CancelOrder(Guid id)
    {
        var command = new CancelOrderCommand(id);
        await _mediator.Send(command);
        return Ok(new { message = "Order cancelled successfully" });
    }
}

public record UpdateOrderStatusRequest(string Status);
