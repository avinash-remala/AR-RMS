using MediatR;
using Microsoft.AspNetCore.Mvc;
using Rms.Av.Application.Features.Pdf.Queries;

namespace Rms.Av.Api.Controllers;

[ApiController]
[Route("api/v1/pdf")]
public class PdfGeneratorController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly ILogger<PdfGeneratorController> _logger;

    public PdfGeneratorController(IMediator mediator, ILogger<PdfGeneratorController> logger)
    {
        _mediator = mediator;
        _logger = logger;
    }

    /// <summary>
    /// Generate order stickers PDF for a specific date
    /// </summary>
    [HttpPost("generate-stickers")]
    public async Task<IActionResult> GenerateOrderStickers([FromQuery] DateTime date)
    {
        try
        {
            var query = new GenerateOrderStickersQuery(date);
            var pdfBytes = await _mediator.Send(query);

            var fileName = $"order-stickers-{date:yyyy-MM-dd}.pdf";
            
            return File(pdfBytes, "application/pdf", fileName);
        }
        catch (InvalidOperationException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating order stickers for date {Date}", date);
            return StatusCode(500, new { message = "An error occurred while generating the PDF" });
        }
    }
}
