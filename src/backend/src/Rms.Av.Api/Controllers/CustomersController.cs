using MediatR;
using Microsoft.AspNetCore.Mvc;
using Rms.Av.Application.DTOs;
using Rms.Av.Application.Features.Customers.Commands;
using Rms.Av.Application.Features.Customers.Queries;

namespace Rms.Av.Api.Controllers;

[ApiController]
[Route("api/v1/customers")]
public class CustomersController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly ILogger<CustomersController> _logger;

    public CustomersController(IMediator mediator, ILogger<CustomersController> logger)
    {
        _mediator = mediator;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<CustomerDto>>> GetCustomers()
    {
        var query = new GetAllCustomersQuery();
        var customers = await _mediator.Send(query);
        return Ok(customers);
    }

    [HttpGet("search")]
    public async Task<ActionResult<IEnumerable<CustomerDto>>> SearchCustomers([FromQuery] string q)
    {
        if (string.IsNullOrWhiteSpace(q))
        {
            return BadRequest(new { message = "Search query cannot be empty" });
        }

        var query = new SearchCustomersQuery(q);
        var customers = await _mediator.Send(query);
        return Ok(customers);
    }

    [HttpGet("with-order-stats")]
    public async Task<ActionResult<IEnumerable<CustomerWithOrderStatsDto>>> GetCustomersWithOrderStats()
    {
        var query = new GetCustomersWithOrderStatsQuery();
        var customers = await _mediator.Send(query);
        return Ok(customers);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<CustomerDto>> GetCustomer(Guid id)
    {
        var query = new GetCustomerByIdQuery(id);
        var customer = await _mediator.Send(query);

        if (customer == null)
        {
            return NotFound(new { message = "Customer not found" });
        }

        return Ok(customer);
    }

    [HttpPost]
    public async Task<ActionResult<CustomerDto>> CreateCustomer(CreateCustomerDto customerDto)
    {
        try
        {
            var command = new CreateCustomerCommand(customerDto);
            var customer = await _mediator.Send(command);

            return CreatedAtAction(nameof(GetCustomer), new { id = customer.Id }, customer);
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { message = ex.Message });
        }
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateCustomer(Guid id, UpdateCustomerDto customerDto)
    {
        if (id != customerDto.Id)
        {
            return BadRequest(new { message = "ID mismatch" });
        }

        try
        {
            var command = new UpdateCustomerCommand(customerDto);
            await _mediator.Send(command);
            return NoContent();
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { message = ex.Message });
        }
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteCustomer(Guid id)
    {
        try
        {
            var command = new DeleteCustomerCommand(id);
            await _mediator.Send(command);
            return NoContent();
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }
}
