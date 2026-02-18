# Data Migration Guide

## Overview
The MigrationController provides endpoints to import historical data from CSV files into the SQLite database.

## Endpoints

### Import CSV Data
`POST /api/v1/migration/import-csv?entityType={type}`

Uploads and imports data from a CSV file.

**Supported Entity Types:**
- `orders` / `attorders` - Historical order data
- `menuitems` - Menu items catalog
- `extraitems` - Extra items (add-ons)
- `companies` - Corporate clients
- `employees` - Staff members
- `vendors` - Suppliers

### Clear Data (Non-Production Only)
`GET /api/v1/migration/clear-data?entityType={type}`

Removes all records for the specified entity type.

## Importing Historical Orders

### CSV Format
The historical orders CSV should have these columns:
- **Date** - Order date (formats: `M/d/yy`, `MM/dd/yyyy`)
- **S No** - Serial number for that date
- **Address** - Building address (e.g., "2900 Plano Pkwy")
- **Full Name** - Customer name
- **Phone Number** - Contact number
- **Type of Food** - Menu item name with optional quantity `(2)`
- **Type of Rice** - Rice type and special instructions
- **Comments** - Additional notes

### Example CSV
```csv
Date,S No,Address,Full Name,Phone Number,Type of Food,Type of Rice,Comments,
7/23/25,1,3400 W Plano Pkwy,John Doe,5123752297,Non Veg Comfort Box,Pulav Rice,11:17,
,2,2900 Plano Pkwy,Jane Smith,6464311295,Veg Comfort Box (2),White Rice,11:18,
```

### Import Process

1. **Start the API**
   ```bash
   cd src/backend/src/Rms.Av.Api
   dotnet run
   ```

2. **Import Orders Using cURL**
   ```bash
   curl -X POST "http://localhost:5000/api/v1/migration/import-csv?entityType=orders" \
     -F "file=@src/backend/src/Data/att orders.csv"
   ```

3. **Import Using Postman**
   - Method: `POST`
   - URL: `http://localhost:5000/api/v1/migration/import-csv?entityType=orders`
   - Body: `form-data`
     - Key: `file` (type: File)
     - Value: Select your CSV file

### What Happens During Import

1. **Date Parsing** - Handles multiple date formats (M/d/yy, MM/dd/yyyy)
2. **Customer Management**:
   - **Name Splitting** - Splits full name into FirstName and LastName (last word = LastName)
   - **Phone Normalization** - Adds country codes:
     - 10 digits → +1xxxxxxxxxx (US)
     - 12 digits starting with 91 → +91xxxxxxxxxx (India)
   - **Unique Phone** - Uses phone as unique key, creates customer if not exists
   - **Customer Creation** - Automatically creates Customer records
3. **Menu Item Creation** - Automatically creates menu items if they don't exist
4. **Quantity Extraction** - Parses quantities from "Item Name (2)" format
5. **Building Number** - Extracts building number from address (2900, 3400)
6. **Comments Consolidation** - Combines rice type and comments
7. **Order Linking** - Links orders to customers via CustomerId
8. **Price Calculation** - Assigns prices based on item type:
   - Special Box: $180 (Friday specials)
   - Non-Veg Comfort: $150
   - Veg Comfort: $120
9. **Category Assignment**:
   - VEG - Veg Comfort Box
   - NON_VEG - Non-Veg Comfort Box
   - VEG_SPECIAL - Veg Special Box (Fridays)
   - NON_VEG_SPECIAL - Non-Veg Special Box (Fridays)

### Response Format

**Success:**
```json
{
  "message": "Import completed successfully",
  "entityType": "orders",
  "recordsImported": 1685
}
```

**Error:**
```json
{
  "message": "Error importing data",
  "error": "Detailed error message"
}
```

## Importing Other Entity Types

### Menu Items CSV
```csv
Name,Description,Price,Category,IsAvailable,ImageUrl
Veg Lunch Box,Rice with dal and vegetables,120,VEG,true,
Non-Veg Lunch Box,Rice with chicken curry,150,NON_VEG,true,
```

```bash
curl -X POST "http://localhost:5000/api/v1/migration/import-csv?entityType=menuitems" \
  -F "file=@menuitems.csv"
```

### Extra Items CSV
```csv
Name,Description,Price,IsAvailable
Extra Rice,Additional portion,20,true
Pickle,Mango pickle,10,true
```

```bash
curl -X POST "http://localhost:5000/api/v1/migration/import-csv?entityType=extraitems" \
  -F "file=@extraitems.csv"
```

### Companies CSV
```csv
Name,Address,ContactPerson,ContactEmail,ContactPhone,IsActive
Acme Corp,123 Main St,John Manager,john@acme.com,555-0100,true
```

```bash
curl -X POST "http://localhost:5000/api/v1/migration/import-csv?entityType=companies" \
  -F "file=@companies.csv"
```

## Clearing Data (Development Only)

```bash
# Clear all orders
curl "http://localhost:5000/api/v1/migration/clear-data?entityType=orders"

# Clear all menu items
curl "http://localhost:5000/api/v1/migration/clear-data?entityType=menuitems"
```

**Note:** This endpoint is disabled in production environments.

## Troubleshooting

### Common Issues

1. **Date parsing fails**
   - Ensure dates are in `M/d/yy` or `MM/dd/yyyy` format
   - Check for leading/trailing spaces

2. **Menu items not found**
   - The importer auto-creates menu items, but verify the names are consistent

3. **Phone number issues**
   - Phone numbers with "NA" are converted to empty strings
   - All non-digit characters are removed automatically

4. **Empty rows**
   - Rows without a Full Name are automatically skipped

### Logs
Check the API logs for detailed error messages:
```bash
cd src/backend/src/Rms.Av.Api
dotnet run
# Watch console output for import progress and errors
```
