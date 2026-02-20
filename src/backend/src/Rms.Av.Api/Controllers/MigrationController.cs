using CsvHelper;
using CsvHelper.Configuration;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Rms.Av.Domain.Entities;
using Rms.Av.Infrastructure.Persistence;
using System.Globalization;

namespace Rms.Av.Api.Controllers;

[ApiController]
[Route("api/v1/migration")]
public class MigrationController : ControllerBase
{
    private readonly RmsAvDbContext _context;
    private readonly ILogger<MigrationController> _logger;
    private readonly IWebHostEnvironment _environment;

    public MigrationController(
        RmsAvDbContext context, 
        ILogger<MigrationController> logger,
        IWebHostEnvironment environment)
    {
        _context = context;
        _logger = logger;
        _environment = environment;
    }

    [HttpPost("import-att-orders")]
    public async Task<IActionResult> ImportAttOrders()
    {
        try
        {
            // Clear existing orders/items/extras to avoid duplicates
            await _context.Set<OrderExtra>().ExecuteDeleteAsync();
            await _context.Set<OrderItem>().ExecuteDeleteAsync();
            await _context.Orders.ExecuteDeleteAsync();
            await _context.MenuItems.ExecuteDeleteAsync();

            var filePath = Path.GetFullPath(Path.Combine(_environment.ContentRootPath, "..", "Data", "att orders.csv"));
            if (!System.IO.File.Exists(filePath))
            {
                return NotFound(new { message = $"CSV file not found at {filePath}" });
            }

            using var stream = System.IO.File.OpenRead(filePath);
            using var reader = new StreamReader(stream);
            using var csv = new CsvReader(reader, new CsvConfiguration(CultureInfo.InvariantCulture)
            {
                HeaderValidated = null,
                MissingFieldFound = null
            });

            var importedCount = await ImportHistoricalOrders(csv);

            return Ok(new 
            { 
                message = "ATT orders import completed successfully", 
                file = filePath,
                recordsImported = importedCount 
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error importing ATT orders CSV");
            return StatusCode(500, new { message = "Error importing ATT orders", error = ex.Message });
        }
    }

    private async Task<int> ImportHistoricalOrders(CsvReader csv)
    {
        var records = csv.GetRecords<HistoricalOrderCsv>().ToList();
        var importedCount = 0;
        var currentDate = DateTime.MinValue;
        
        // Create a dictionary to cache menu items by name
        var menuItemCache = await _context.MenuItems
            .ToDictionaryAsync(m => m.Name.ToLower(), m => m);
        
        // Cache customers by phone number and by last 10 digits to merge country-code variants
        var customerCache = await _context.Customers
            .ToDictionaryAsync(c => c.Phone, c => c);
        var customerLast10Cache = customerCache.Values
            .Where(c => c.Phone.Length >= 10)
            .GroupBy(c => c.Phone[^10..])
            .ToDictionary(g => g.Key, g => g.First());
        
        foreach (var record in records)
        {
            // Skip empty rows
            if (string.IsNullOrWhiteSpace(record.FullName))
                continue;
                
            // Update date context if present
            if (!string.IsNullOrWhiteSpace(record.Date))
            {
                currentDate = ParseOrderDate(record.Date);
            }
            
            // Skip if we don't have a valid date
            if (currentDate == DateTime.MinValue)
                continue;
            
            // Parse the food type to extract item name and quantity
            var (itemName, quantity) = ParseFoodType(record.TypeOfFood);
            
            // Extract building number from address
            var buildingNumber = ExtractBuildingNumber(record.Address);
            
            // Combine rice type and comments for special instructions
            var comments = string.Join(" | ", new[] { record.TypeOfRice, record.Comments }
                .Where(s => !string.IsNullOrWhiteSpace(s)));
            
            // Normalize phone number with country code
            var (phone, countryCode) = NormalizePhoneNumber(record.PhoneNumber);
            var last10 = phone.Length >= 10 ? phone[^10..] : "";
            
            // Skip if phone is invalid
            if (string.IsNullOrWhiteSpace(phone))
                continue;
            
            // Split name into first and last name
            var (firstName, lastName) = SplitName(record.FullName);
            
            // Find or create customer
            Customer customer;
            if (!string.IsNullOrEmpty(last10) && customerLast10Cache.TryGetValue(last10, out var existingByLast10))
            {
                // Check if phone number needs updating (store only the number, not with country code)
                if (existingByLast10.Phone != phone)
                {
                    if (customerCache.ContainsKey(phone))
                    {
                        // Target phone already exists, just use that customer  
                        customer = customerCache[phone];
                        
                        // Update to longer name if needed
                        await UpdateCustomerNameIfLonger(customer, firstName, lastName, countryCode);
                    }
                    else
                    {
                        // Remove old phone from cache
                        customerCache.Remove(existingByLast10.Phone);
                        
                        // Update customer phone
                        existingByLast10.Phone = phone;
                        existingByLast10.CountryCode = countryCode;
                        existingByLast10.UpdatedAt = DateTime.UtcNow;
                        
                        // Update to longer name if needed
                        await UpdateCustomerNameIfLonger(existingByLast10, firstName, lastName, countryCode);
                        
                        _context.Customers.Update(existingByLast10);
                        await _context.SaveChangesAsync();
                        
                        // Add to cache with new phone
                        customerCache[phone] = existingByLast10;
                        customer = existingByLast10;
                    }
                }
                else
                {
                    customer = existingByLast10;
                    
                    // Update to longer name if needed
                    await UpdateCustomerNameIfLonger(customer, firstName, lastName, countryCode);
                }
            }
            else if (customerCache.TryGetValue(phone, out var existingCustomer))
            {
                customer = existingCustomer;

                // Update to longer name if needed
                await UpdateCustomerNameIfLonger(customer, firstName, lastName, countryCode);
            }
            else
            {
                // Create new customer
                customer = new Customer
                {
                    FirstName = firstName,
                    LastName = lastName,
                    Phone = phone,
                    CountryCode = countryCode,
                    IsActive = true
                };
                _context.Customers.Add(customer);
                await _context.SaveChangesAsync();
                
                customerCache[phone] = customer;
                if (!string.IsNullOrEmpty(last10))
                    customerLast10Cache[last10] = customer;
            }
            
            // Try to find existing menu item, or create a placeholder
            Guid menuItemId;
            decimal itemPrice;
            
            var menuItemKey = itemName.ToLower();
            if (menuItemCache.TryGetValue(menuItemKey, out var existingMenuItem))
            {
                menuItemId = existingMenuItem.Id;
                itemPrice = existingMenuItem.Price;
            }
            else
            {
                // Create menu item if it doesn't exist
                var newMenuItem = new MenuItem
                {
                    Name = itemName,
                    Description = $"Imported from historical data",
                    Price = GetItemPrice(itemName),
                    Category = GetItemCategory(itemName),
                    IsAvailable = true
                };
                _context.MenuItems.Add(newMenuItem);
                await _context.SaveChangesAsync();
                
                menuItemCache[menuItemKey] = newMenuItem;
                menuItemId = newMenuItem.Id;
                itemPrice = newMenuItem.Price;
            }
            
            // Create order linked to customer
            var order = new Order
            {
                OrderNumber = $"ORD-{currentDate:yyyyMMdd}-{record.SNo}",
                OrderDate = currentDate,
                CustomerId = customer.Id,
                BuildingNumber = buildingNumber,
                Status = OrderStatus.Delivered,
                Comments = comments,
                TotalAmount = itemPrice * quantity,
                Items = new List<OrderItem>()
            };
            
            // Add order item
            order.Items.Add(new OrderItem
            {
                MenuItemId = menuItemId,
                Quantity = quantity,
                Price = itemPrice
            });
            
            _context.Orders.Add(order);
            importedCount++;
        }
        
        await _context.SaveChangesAsync();
        return importedCount;
    }

    private async Task UpdateCustomerNameIfLonger(Customer customer, string firstName, string lastName, string countryCode)
    {
        // Prefer the longer/more complete name when duplicates share the same phone
        var existingFull = $"{customer.FirstName} {customer.LastName}".Trim();
        var incomingFull = $"{firstName} {lastName}".Trim();

        if (incomingFull.Length > existingFull.Length)
        {
            customer.FirstName = firstName;
            customer.LastName = lastName;
            customer.CountryCode = countryCode;
            customer.UpdatedAt = DateTime.UtcNow;
            _context.Customers.Update(customer);
            await _context.SaveChangesAsync();
        }
    }

    private DateTime ParseOrderDate(string dateString)
    {
        // Handle multiple date formats: "7/23/25", "08/04/2025"
        var formats = new[] 
        { 
            "M/d/yy", "MM/dd/yy", "M/dd/yy", "MM/d/yy",
            "MM/dd/yyyy", "M/d/yyyy", "M/dd/yyyy", "MM/d/yyyy"
        };
        
        if (DateTime.TryParseExact(dateString.Trim(), formats, 
            CultureInfo.InvariantCulture, DateTimeStyles.None, out var date))
        {
            // If year is < 2000, assume it's 2000+
            if (date.Year < 2000)
                date = date.AddYears(2000);
            return date;
        }
        
        return DateTime.MinValue;
    }

    private (string itemName, int quantity) ParseFoodType(string foodType)
    {
        if (string.IsNullOrWhiteSpace(foodType))
            return ("Unknown", 1);
        
        // Extract quantity from patterns like "Veg Comfort Box (2)"
        var quantityMatch = System.Text.RegularExpressions.Regex.Match(foodType, @"\((\d+)\)");
        var quantity = quantityMatch.Success ? int.Parse(quantityMatch.Groups[1].Value) : 1;
        
        // Remove quantity notation and clean up the name
        var itemName = System.Text.RegularExpressions.Regex.Replace(foodType, @"\(\d+\)", "").Trim();
        
        // Normalize names
        itemName = itemName
            .Replace("Non Veg", "Non-Veg")
            .Replace("Non-Veg", "NonVeg")
            .Replace("Veg ", "Veg")
            .Trim();
        
        return (itemName, quantity);
    }

    private string ExtractBuildingNumber(string address)
    {
        if (string.IsNullOrWhiteSpace(address))
            return "";
        
        // Extract building numbers like "2900" or "3400" from addresses
        var match = System.Text.RegularExpressions.Regex.Match(address, @"(\d{4})");
        return match.Success ? match.Groups[1].Value : address.Trim();
    }

    private (string phone, string countryCode) NormalizePhoneNumber(string phoneNumber)
    {
        if (string.IsNullOrWhiteSpace(phoneNumber) || phoneNumber.ToUpper() == "NA")
            return ("", "");
        
        // Remove spaces and non-digit characters
        var cleaned = System.Text.RegularExpressions.Regex.Replace(phoneNumber, @"[^\d]", "");
        
        if (string.IsNullOrWhiteSpace(cleaned))
            return ("", "");
        
        // Normalize Indian numbers with leading 91 to last 10 digits
        if (cleaned.Length >= 12 && cleaned.StartsWith("91"))
        {
            var last10 = cleaned[^10..];
            return (last10, "91");
        }
        
        // Normalize plain 10-digit numbers:
        // If starting with 6/7/8/9 assume India (91); otherwise default to US (1)
        if (cleaned.Length == 10)
        {
            if ("6789".Contains(cleaned[0]))
                return (cleaned, "91");
            return (cleaned, "1");
        }
        
        // Handle US numbers with country code already (11 digits starting with 1)
        if (cleaned.Length == 11 && cleaned.StartsWith("1"))
        {
            return (cleaned[1..], "1");
        }
        
        // Return as-is if it's a valid length but unknown format
        if (cleaned.Length >= 10)
        {
            var last10 = cleaned[^10..];
            var cc = cleaned.Length > 10 ? cleaned[..(cleaned.Length - 10)] : "";
            return (last10, cc);
        }
        
        return ("", "");
    }

    private string GetCountryCode(string normalizedPhone)
    {
        if (string.IsNullOrWhiteSpace(normalizedPhone) || !normalizedPhone.StartsWith("+"))
            return "";
        var digits = new string(normalizedPhone.Skip(1).TakeWhile(char.IsDigit).ToArray());
        // Country codes are 1-3 digits; take up to length-10 if long enough, else first 2 by default
        if (digits.Length > 10)
            return digits[..(digits.Length - 10)];
        return digits.Length >= 2 ? digits[..2] : digits;
    }

    private (string firstName, string lastName) SplitName(string fullName)
    {
        if (string.IsNullOrWhiteSpace(fullName))
            return ("Unknown", "Customer");
        
        var nameParts = fullName.Trim().Split(new[] { ' ' }, StringSplitOptions.RemoveEmptyEntries);
        
        if (nameParts.Length == 0)
            return ("Unknown", "Customer");
        
        if (nameParts.Length == 1)
            return (nameParts[0], "");
        
        // Last word is last name, everything else is first name
        var lastName = nameParts[^1];
        var firstName = string.Join(" ", nameParts[..^1]);
        
        return (firstName, lastName);
    }

    private string GetItemCategory(string itemName)
    {
        var lowerName = itemName.ToLower();
        
        // Check for desserts
        if (lowerName.Contains("dessert") || lowerName.Contains("sweet") || lowerName.Contains("ice cream"))
        {
            return "Dessert";
        }
        
        // Check for appetizers
        if (lowerName.Contains("appetizer") || lowerName.Contains("starter"))
        {
            return "Appetizer";
        }
        
        // Regular lunch items
        if (lowerName.Contains("non") || lowerName.Contains("nonveg") || lowerName.Contains("chicken") || lowerName.Contains("mutton"))
            return "NonVeg";
        
        return "Veg";
    }

    private decimal GetItemPrice(string itemName)
    {
        // Default pricing based on item type
        if (itemName.Contains("Special Box") || itemName.Contains("Special"))
            return 180m;
        if (itemName.Contains("NonVeg") || itemName.Contains("Non-Veg"))
            return 150m;
        if (itemName.Contains("Veg"))
            return 120m;
        
        return 100m; // Default price
    }

    [HttpGet("clear-data")]
    public async Task<IActionResult> ClearData([FromQuery] string entityType)
    {
        if (_environment.IsProduction())
        {
            return Forbid("Data clearing is not allowed in production");
        }

        try
        {
            var deletedCount = 0;

            switch (entityType?.ToLower())
            {
                case "menuitem":
                case "menuitems":
                    deletedCount = await _context.MenuItems.ExecuteDeleteAsync();
                    break;

                case "extraitem":
                case "extraitems":
                    deletedCount = await _context.ExtraItems.ExecuteDeleteAsync();
                    break;

                case "company":
                case "companies":
                    deletedCount = await _context.Companies.ExecuteDeleteAsync();
                    break;

                case "employee":
                case "employees":
                    deletedCount = await _context.Employees.ExecuteDeleteAsync();
                    break;

                case "vendor":
                case "vendors":
                    deletedCount = await _context.Vendors.ExecuteDeleteAsync();
                    break;

                default:
                    return BadRequest(new { message = $"Unknown entity type: {entityType}" });
            }

            return Ok(new { message = "Data cleared successfully", entityType, recordsDeleted = deletedCount });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error clearing data for entity type: {EntityType}", entityType);
            return StatusCode(500, new { message = "Error clearing data", error = ex.Message });
        }
    }

    [HttpPost("seed-pricing")]
    public async Task<IActionResult> SeedPricing()
    {
        try
        {
            // Check if pricing already exists
            var existingCount = await _context.Pricings.CountAsync();
            if (existingCount > 0)
            {
                return Ok(new { message = "Pricing data already exists", count = existingCount });
            }

            // Create initial pricing for 4 box types
            var pricings = new List<Pricing>
            {
                new Pricing
                {
                    BoxType = "veg_comfort",
                    DisplayName = "Veg Comfort Box",
                    Price = 9.99m,
                    IsActive = true,
                    Description = "Vegetarian comfort meal box"
                },
                new Pricing
                {
                    BoxType = "nonveg_comfort",
                    DisplayName = "Non-Veg Comfort Box",
                    Price = 9.99m,
                    IsActive = true,
                    Description = "Non-vegetarian comfort meal box"
                },
                new Pricing
                {
                    BoxType = "veg_special",
                    DisplayName = "Veg Special Box (Friday)",
                    Price = 10.99m,
                    IsActive = true,
                    Description = "Special vegetarian meal box for Friday"
                },
                new Pricing
                {
                    BoxType = "nonveg_special",
                    DisplayName = "Non-Veg Special Box (Friday)",
                    Price = 10.99m,
                    IsActive = true,
                    Description = "Special non-vegetarian meal box for Friday"
                }
            };

            _context.Pricings.AddRange(pricings);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Pricing data seeded successfully", count = pricings.Count });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error seeding pricing data");
            return StatusCode(500, new { message = "Error seeding pricing data", error = ex.Message });
        }
    }
}

public class HistoricalOrderCsv
{
    public string Date { get; set; } = string.Empty;
    
    [CsvHelper.Configuration.Attributes.Name("S No")]
    public string SNo { get; set; } = string.Empty;
    
    public string Address { get; set; } = string.Empty;
    
    [CsvHelper.Configuration.Attributes.Name("Full Name")]
    public string FullName { get; set; } = string.Empty;
    
    [CsvHelper.Configuration.Attributes.Name("Phone Number")]
    public string PhoneNumber { get; set; } = string.Empty;
    
    [CsvHelper.Configuration.Attributes.Name("Type of Food")]
    public string TypeOfFood { get; set; } = string.Empty;
    
    [CsvHelper.Configuration.Attributes.Name("Type of Rice")]
    public string TypeOfRice { get; set; } = string.Empty;
    
    public string Comments { get; set; } = string.Empty;
}
