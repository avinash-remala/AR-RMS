using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Rms.Av.Domain.Entities;
using Rms.Av.Infrastructure.Persistence;

namespace Rms.Av.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CompaniesController : ControllerBase
{
    private readonly RmsAvDbContext _context;
    private readonly ILogger<CompaniesController> _logger;

    public CompaniesController(RmsAvDbContext context, ILogger<CompaniesController> logger)
    {
        _context = context;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Company>>> GetCompanies()
    {
        return await _context.Companies.Where(c => c.IsActive).ToListAsync();
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Company>> GetCompany(Guid id)
    {
        var company = await _context.Companies.FindAsync(id);

        if (company == null)
        {
            return NotFound();
        }

        return company;
    }

    [HttpPost]
    public async Task<ActionResult<Company>> CreateCompany(Company company)
    {
        _context.Companies.Add(company);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetCompany), new { id = company.Id }, company);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateCompany(Guid id, Company company)
    {
        if (id != company.Id)
        {
            return BadRequest();
        }

        company.UpdatedAt = DateTime.UtcNow;
        _context.Entry(company).State = EntityState.Modified;

        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException)
        {
            if (!await _context.Companies.AnyAsync(e => e.Id == id))
            {
                return NotFound();
            }
            throw;
        }

        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteCompany(Guid id)
    {
        var company = await _context.Companies.FindAsync(id);
        if (company == null)
        {
            return NotFound();
        }

        company.IsActive = false;
        company.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return NoContent();
    }
}
