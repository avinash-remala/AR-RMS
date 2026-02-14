using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Rms.Av.Domain.Entities;
using Rms.Av.Infrastructure.Persistence;

namespace Rms.Av.Api.Controllers;

[ApiController]
[Route("api/v1/customers")]
public class CustomersController : ControllerBase
{
    private readonly RmsAvDbContext _context;
    private readonly ILogger<CustomersController> _logger;

    public CustomersController(RmsAvDbContext context, ILogger<CustomersController> logger)
    {
        _context = context;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Customer>>> GetCustomers()
    {
        return await _context.Customers
            .Where(c => c.IsActive)
            .OrderBy(c => c.FirstName)
            .ThenBy(c => c.LastName)
            .ToListAsync();
    }

    [HttpGet("search")]
    public async Task<ActionResult<IEnumerable<Customer>>> SearchCustomers([FromQuery] string q)
    {
        if (string.IsNullOrWhiteSpace(q))
        {
            return BadRequest(new { message = "Search query cannot be empty" });
        }

        var searchTerm = q.ToLower().Trim();

        var customers = await _context.Customers
            .Where(c => c.IsActive && (
                c.FirstName.ToLower().Contains(searchTerm) ||
                c.LastName.ToLower().Contains(searchTerm) ||
                c.Phone.Contains(searchTerm)
            ))
            .OrderBy(c => c.FirstName)
            .ThenBy(c => c.LastName)
            .ToListAsync();

        return Ok(customers);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Customer>> GetCustomer(Guid id)
    {
        var customer = await _context.Customers.FindAsync(id);

        if (customer == null)
        {
            return NotFound(new { message = "Customer not found" });
        }

        return customer;
    }

    [HttpPost]
    public async Task<ActionResult<Customer>> CreateCustomer(Customer customer)
    {
        // Check if phone already exists
        var existingCustomer = await _context.Customers
            .FirstOrDefaultAsync(c => c.Phone == customer.Phone);

        if (existingCustomer != null)
        {
            return Conflict(new { message = "A customer with this phone number already exists" });
        }

        _context.Customers.Add(customer);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetCustomer), new { id = customer.Id }, customer);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateCustomer(Guid id, Customer customer)
    {
        if (id != customer.Id)
        {
            return BadRequest(new { message = "ID mismatch" });
        }

        var existingCustomer = await _context.Customers.FindAsync(id);
        if (existingCustomer == null)
        {
            return NotFound(new { message = "Customer not found" });
        }

        // Check if phone is being changed and if it conflicts with another customer
        if (existingCustomer.Phone != customer.Phone)
        {
            var phoneExists = await _context.Customers
                .AnyAsync(c => c.Phone == customer.Phone && c.Id != id);

            if (phoneExists)
            {
                return Conflict(new { message = "A customer with this phone number already exists" });
            }
        }

        existingCustomer.FirstName = customer.FirstName;
        existingCustomer.LastName = customer.LastName;
        existingCustomer.Phone = customer.Phone;
        existingCustomer.Email = customer.Email;
        existingCustomer.IsActive = customer.IsActive;
        existingCustomer.UpdatedAt = DateTime.UtcNow;

        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException)
        {
            if (!await CustomerExists(id))
            {
                return NotFound(new { message = "Customer not found" });
            }
            throw;
        }

        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteCustomer(Guid id)
    {
        var customer = await _context.Customers.FindAsync(id);
        if (customer == null)
        {
            return NotFound(new { message = "Customer not found" });
        }

        // Soft delete
        customer.IsActive = false;
        customer.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return NoContent();
    }

    private async Task<bool> CustomerExists(Guid id)
    {
        return await _context.Customers.AnyAsync(e => e.Id == id);
    }
}
