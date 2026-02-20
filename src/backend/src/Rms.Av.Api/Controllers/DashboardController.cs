using MediatR;
using Microsoft.AspNetCore.Mvc;
using Rms.Av.Application.Features.Dashboard.Queries;

namespace Rms.Av.Api.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
public class DashboardController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly ILogger<DashboardController> _logger;

    public DashboardController(IMediator mediator, ILogger<DashboardController> logger)
    {
        _mediator = mediator;
        _logger = logger;
    }

    /// <summary>
    /// Get dashboard statistics including orders, revenue, top items, and recent orders
    /// </summary>
    /// <returns>Dashboard statistics</returns>
    [HttpGet("statistics")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> GetStatistics()
    {
        _logger.LogInformation("Fetching dashboard statistics");
        
        var query = new GetDashboardStatisticsQuery();
        var statistics = await _mediator.Send(query);
        
        return Ok(statistics);
    }
}
