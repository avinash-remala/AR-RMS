using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace Rms.Av.Application.Services;

public class OrderStickerData
{
    public string OrderNumber { get; set; } = string.Empty;
    public DateTime OrderDate { get; set; }
    public string CustomerName { get; set; } = string.Empty;
    public string BuildingNumber { get; set; } = string.Empty;
    public string MenuItemName { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public int StickerNumber { get; set; }
    public string? Comments { get; set; }
    public string Status { get; set; } = string.Empty;
}

public interface IPdfGeneratorService
{
    byte[] GenerateOrderStickers(IEnumerable<OrderStickerData> stickers);
}

public class PdfGeneratorService : IPdfGeneratorService
{
    public byte[] GenerateOrderStickers(IEnumerable<OrderStickerData> stickers)
    {
        var document = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.Letter);
                page.Margin(0.5f, Unit.Inch);
                page.DefaultTextStyle(x => x.FontSize(10));

                page.Content().Column(column =>
                {
                    foreach (var sticker in stickers)
                    {
                        column.Item().Element(c => RenderSticker(c, sticker));
                        
                        // Add spacing between stickers
                        column.Item().PaddingBottom(0.2f, Unit.Inch);
                    }
                });
            });
        });

        return document.GeneratePdf();
    }

    private void RenderSticker(IContainer container, OrderStickerData sticker)
    {
        container
            .Border(2)
            .BorderColor(Colors.Grey.Darken2)
            .Padding(10)
            .Column(column =>
            {
                // Header with order number and date
                column.Item().Row(row =>
                {
                    row.RelativeItem().Text($"Order #{sticker.OrderNumber}")
                        .FontSize(8)
                        .Bold();
                    
                    row.RelativeItem().AlignRight().Text(sticker.OrderDate.ToString("MMM dd, yyyy"))
                        .FontSize(8);
                });

                column.Item().PaddingTop(5).LineHorizontal(1).LineColor(Colors.Grey.Lighten1);

                // Customer name (larger, bold)
                column.Item().PaddingTop(8).Text(text =>
                {
                    text.Span("Customer: ").FontSize(9);
                    text.Span(sticker.CustomerName).FontSize(12).Bold();
                });

                // Delivery address
                column.Item().PaddingTop(5).Text(text =>
                {
                    text.Span("Building: ").FontSize(9);
                    text.Span(sticker.BuildingNumber).FontSize(11).Bold();
                });

                // Menu item name
                column.Item().PaddingTop(8).Text(text =>
                {
                    text.Span("Item: ").FontSize(9);
                    text.Span(sticker.MenuItemName).FontSize(11).Bold();
                });

                // Quantity indicator (which box of total)
                if (sticker.Quantity > 1)
                {
                    column.Item().PaddingTop(5).Text($"Box {sticker.StickerNumber} of {sticker.Quantity}")
                        .FontSize(9)
                        .Italic();
                }

                // Comments section (if any)
                if (!string.IsNullOrWhiteSpace(sticker.Comments))
                {
                    column.Item().PaddingTop(8).Text(text =>
                    {
                        text.Span("Notes: ").FontSize(8).Italic();
                        text.Span(sticker.Comments).FontSize(8);
                    });
                }

                // Footer with status
                column.Item().PaddingTop(8).AlignRight().Text($"Status: {sticker.Status}")
                    .FontSize(7)
                    .FontColor(Colors.Grey.Darken1);
            });
    }
}
