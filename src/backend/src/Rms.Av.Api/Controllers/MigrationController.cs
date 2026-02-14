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

    [HttpPost("import-csv")]
    public async Task<IActionResult> ImportCsvData([FromForm] IFormFile file, [FromQuery] string entityType)
    {
        if (file == null || file.Length == 0)
        {
            return BadRequest(new { message = "No file uploaded" });
        }

        if (!file.FileName.EndsWith(".csv", StringComparison.OrdinalIgnoreCase))
        {
            return BadRequest(new { message = "File must be a CSV" });
        }

        try
        {
            var importedCount = 0;

            using var stream = file.OpenReadStream();
            using var reader = new StreamReader(stream);
            using var csv = new CsvReader(reader, new CsvConfiguration(CultureInfo.InvariantCulture)
            {
                HeaderValidated = null,
                MissingFieldFound = null
            });

            switch (entityType?.ToLower())
            {
                case "menuitem":
                case "menuitems":
                    importedCount = await ImportMenuItems(csv);
                    break;

                case "extraitem":
                case "extraitems":
                    importedCount = await ImportExtraItems(csv);
                    break;

                case "company":
                case "companies":
                    importedCount = await ImportCompanies(csv);
                    break;

                case "employee":
                case "employees":
                    importedCount = await ImportEmployees(csv);
                    break;

                case "vendor":
                case "vendors":
                    importedCount = await ImportVendors(csv);
                    break;

                case "order":
                case "orders":
                case "attorders":
                    importedCount = await ImportHistoricalOrders(csv);
                    break;

                default:
                    return BadRequest(new { message = $"Unknown entity type: {entityType}. Supported types: menuitem, extraitem, company, employee, vendor, orders" });
            }

            return Ok(new 
            { 
                message = "Import completed successfully", 
                entityType,
                recordsImported = importedCount 
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error importing CSV data for entity type: {EntityType}", entityType);
            return StatusCode(500, new { message = "Error importing data", error = ex.Message });
        }
    }

    private async Task<int> ImportMenuItems(CsvReader csv)
    {
        var records = csv.GetRecords<MenuItemCsv>().ToList();
        
        foreach (var record in records)
        {
            var menuItem = new MenuItem
            {
                Name = record.Name,
                Description = record.Description ?? "",
                Price = record.Price,
                Category = record.Category ?? "GENERAL",
                IsAvailable = record.IsAvailable ?? true,
                ImageUrl = record.ImageUrl
            };
            
            _context.MenuItems.Add(menuItem);
        }
        
        await _context.SaveChangesAsync();
        return records.Count;
    }

    private async Task<int> ImportExtraItems(CsvReader csv)
    {
        var records = csv.GetRecords<ExtraItemCsv>().ToList();
        
        foreach (var record in records)
        {
            var extraItem = new ExtraItem
            {
                Name = record.Name,
                Description = record.Description ?? "",
                Price = record.Price,
                IsAvailable = record.IsAvailable ?? true
            };
            
            _context.ExtraItems.Add(extraItem);
        }
        
        await _context.SaveChangesAsync();
        return records.Count;
    }

    private async Task<int> ImportCompanies(CsvReader csv)
    {
        var records = csv.GetRecords<CompanyCsv>().ToList();
        
        foreach (var record in records)
        {
            var company = new Company
            {
                Name = record.Name,
                Address = record.Address ?? "",
                ContactPerson = record.ContactPerson ?? "",
                ContactEmail = record.ContactEmail ?? "",
                ContactPhone = record.ContactPhone ?? "",
                IsActive = record.IsActive ?? true
            };
            
            _context.Companies.Add(company);
        }
        
        await _context.SaveChangesAsync();
        return records.Count;
    }

    private async Task<int> ImportEmployees(CsvReader csv)
    {
        var records = csv.GetRecords<EmployeeCsv>().ToList();
        
        foreach (var record in records)
        {
            var employee = new Employee
            {
                FirstName = record.FirstName,
                LastName = record.LastName,
                Email = record.Email,
                PhoneNumber = record.PhoneNumber,
                Role = Enum.Parse<EmployeeRole>(record.Role ?? "Kitchen"),
                IsActive = record.IsActive ?? true,
                HiredDate = record.HiredDate
            };
            
            _context.Employees.Add(employee);
        }
        
        await _context.SaveChangesAsync();
        return records.Count;
    }

    private async Task<int> ImportVendors(CsvReader csv)
    {
        var records = csv.GetRecords<VendorCsv>().ToList();
        
        foreach (var record in records)
        {
            var vendor = new Vendor
            {
                Name = record.Name,
                ContactPerson = record.ContactPerson ?? "",
                Phone = record.Phone ?? "",
                Email = record.Email,
                IsActive = record.IsActive ?? true
            };
            
            _context.Vendors.Add(vendor);
        }
        
        await _context.SaveChangesAsync();
        return records.Count;
    }

    private async Task<int> ImportHistoricalOrders(CsvReader csv)
    {
        var records = csv.GetRecords<HistoricalOrderCsv>().ToList();
        var importedCount = 0;
        var currentDate = DateTime.MinValue;
        
        // Create a dictionary to cache menu items by name
        var menuItemCache = await _context.MenuItems
            .ToDictionaryAsync(m => m.Name.ToLower(), m => m);
        
        // Cache customers by phone number (unique key)
        var customerCache = await _context.Customers
            .ToDictionaryAsync(c => c.Phone, c => c);
        
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
            var normalizedPhone = NormalizePhoneNumber(record.PhoneNumber);
            
            // Skip if phone is invalid
            if (string.IsNullOrWhiteSpace(normalizedPhone))
                continue;
            
            // Split name into first and last name
            var (firstName, lastName) = SplitName(record.FullName);
            
            // Find or create customer
            Customer customer;
            if (customerCache.TryGetValue(normalizedPhone, out var existingCustomer))
            {
                customer = existingCustomer;
            }
            else
            {
                // Create new customer
                customer = new Customer
                {
                    FirstName = firstName,
                    LastName = lastName,
                    Phone = normalizedPhone,
                    IsActive = true
                };
                _context.Customers.Add(customer);
                await _context.SaveChangesAsync();
                
                customerCache[normalizedPhone] = customer;
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

    private string NormalizePhoneNumber(string phoneNumber)
    {
        if (string.IsNullOrWhiteSpace(phoneNumber) || phoneNumber.ToUpper() == "NA")
            return "";
        
        // Remove spaces and non-digit characters
        var cleaned = System.Text.RegularExpressions.Regex.Replace(phoneNumber, @"[^\d]", "");
        
        if (string.IsNullOrWhiteSpace(cleaned))
            return "";
        
        // Handle Indian numbers (12 digits starting with 91)
        if (cleaned.Length == 12 && cleaned.StartsWith("91"))
        {
            return $"+{cleaned}"; // +91xxxxxxxxxx
        }
        
        // Handle US numbers (10 digits)
        if (cleaned.Length == 10)
        {
            return $"+1{cleaned}"; // +1xxxxxxxxxx
        }
        
        // Handle US numbers with country code already (11 digits starting with 1)
        if (cleaned.Length == 11 && cleaned.StartsWith("1"))
        {
            return $"+{cleaned}";
        }
        
        // Return as-is with + if it's a valid length but unknown format
        return cleaned.Length >= 10 ? $"+{cleaned}" : "";
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
        
        // Check for special box (usually served on Fridays)
        if (lowerName.Contains("special"))
        {
            if (lowerName.Contains("non") || lowerName.Contains("nonveg"))
                return "NON_VEG_SPECIAL";
            return "VEG_SPECIAL";
        }
        
        // Regular comfort boxes
        if (lowerName.Contains("non") || lowerName.Contains("nonveg"))
            return "NON_VEG";
        
        return "VEG";
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
}

// CSV mapping classes
public class MenuItemCsv
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public decimal Price { get; set; }
    public string? Category { get; set; }
    public bool? IsAvailable { get; set; }
    public string? ImageUrl { get; set; }
}

public class ExtraItemCsv
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public decimal Price { get; set; }
    public bool? IsAvailable { get; set; }
}

public class CompanyCsv
{
    public string Name { get; set; } = string.Empty;
    public string? Address { get; set; }
    public string? ContactPerson { get; set; }
    public string? ContactEmail { get; set; }
    public string? ContactPhone { get; set; }
    public bool? IsActive { get; set; }
}

public class EmployeeCsv
{
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public string? Role { get; set; }
    public bool? IsActive { get; set; }
    public DateTime? HiredDate { get; set; }
}

public class VendorCsv
{
    public string Name { get; set; } = string.Empty;
    public string? ContactPerson { get; set; }
    public string? Phone { get; set; }
    public string? Email { get; set; }
    public bool? IsActive { get; set; }
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
