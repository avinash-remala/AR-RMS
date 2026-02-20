# Archived Admin Page - Complete Feature Analysis

> Analysis of the archived lunch box application admin dashboard to guide implementation in the new RMS-AV system.

## Overview

The archived admin page includes **7 main tabs** with comprehensive management features for the lunch box ordering system. It also includes a role-based access control system with two user types.

---

## 🔐 Authentication & Access Control

### User Roles
- **Admin User** (`amruthavilas`): Full access to all tabs
- **Restricted User** (`store`): Limited to PDF Generator and Summary tabs only

### Role Access Matrix
| Feature | Admin | Restricted |
|---------|-------|------------|
| Order Management | ✅ | ❌ |
| Meal Passes | ✅ | ❌ |
| Pricing | ✅ | ❌ |
| Other Items | ✅ | ❌ |
| PDF Generator | ✅ | ✅ |
| Summary | ✅ | ✅ |
| Operating Hours | ✅ | ❌ |

---

## 📋 Tab 1: Order Management (📦)

### Features
- **Statistics Dashboard**
  - Total Orders count
  - Unique Customers count
  - Total Boxes count

- **Order Filtering**
  - Filter by specific date
  - "Show All" button to clear filters
  - Date picker with default to today

- **Order Table Display**
  - Columns: Order ID, Customer Name, Phone, Delivery Address, Box Type, Rice Type, Quantity, Order Date
  - Alternating row colors for readability
  - Responsive table with horizontal scroll on mobile
  - Color-coded badges for box types (blue)
  - Formatted date/time display

### Data Points
- Order ID (auto-generated)
- Full Name
- Phone Number
- Delivery Address
- Box Type (veg_comfort, nonveg_comfort, veg_special, nonveg_special)
- Rice Type (e.g., Basmati, Jasmine, etc.)
- Quantity
- Order Date/Time

---

## 🎟️ Tab 2: Meal Passes

### Features
- **Add New Meal Pass**
  - Form fields:
    - Customer Name (required)
    - Phone Number (required, US format)
  - Default: 10 meals per pass
  - Phone number validation and formatting

- **Meal Pass Management Table**
  - Columns:
    - ID
    - Customer Name
    - Phone
    - Total Meals (default 10)
    - Meals Used
    - Meals Left (calculated)
    - Status (Active/Inactive badge)
    - Last Used date
    - Created date
    - Actions

- **Actions**
  - **Activate/Deactivate**: Toggle pass availability
  - **Delete**: Remove meal pass with confirmation

### Use Case
- Create passes for frequent customers
- Track meal usage automatically when orders are placed
- Customers can order using their meal pass instead of paying per order
- Deactivate passes when meals are exhausted or for other reasons

---

## 💰 Tab 3: Pricing

### Features
- **Price Configuration for 4 Box Types**
  - **Veg Comfort Box** (default: $9.99)
  - **Non-Veg Comfort Box** (default: $9.99)
  - **Veg Special Box - Friday** (default: $10.99)
  - **Non-Veg Special Box - Friday** (default: $10.99)

- **Price Input**
  - Currency input with dollar sign prefix
  - Decimal precision (0.01 step)
  - Minimum value: $0

- **Current Pricing Display**
  - Visual summary cards showing active prices
  - Color-coded: Green for Comfort boxes, Red for Special boxes
  - Real-time update after save

### Visual Organization
- Comfort boxes: Orange border cards
- Special (Friday) boxes: Red border cards
- Grid layout for easy comparison

---

## ✨ Tab 4: Other Items

### Features
- **Add New Item**
  - Form fields:
    - Item Name (required) - e.g., "Samosa", "Chai Tea"
    - Price (required, decimal)
    - Availability checkbox (default: checked)

- **Items Management Table**
  - Columns:
    - ID
    - Item Name
    - Price (formatted with $)
    - Availability Status (Available/Unavailable badge)
    - Created Date
    - Actions

- **Actions**
  - **Toggle Availability**: Make Available/Make Unavailable
  - **Edit**: Update name and price (prompt dialog)
  - **Delete**: Remove item with confirmation

### Use Case
- Sell additional items beyond lunch boxes
- Examples: Snacks, drinks, desserts, extras
- Control availability without deleting items
- Quick editing for price changes

---

## 📄 Tab 5: PDF Generator

### Features
- **Date Selection**
  - Date picker to select order date
  - Required field

- **Preview Orders**
  - "Preview Orders" button shows orders for selected date
  - Order count display
  - Order details table before generation

- **Order Preview Table**
  - Columns:
    - Customer Name
    - Delivery Address
    - Box Type
    - Rice Type
    - Quantity
  - Shows all orders for the selected date

- **Generate Document**
  - Primary format: **DOCX** (Microsoft Word)
  - Secondary format: **PDF** (requires LibreOffice installation)
  - Download buttons after generation
  - "Generate New" button to reset

### Sticker Document Format
- Designed for printing address/delivery labels
- One sticker per order
- Includes customer name, address, box details
- Used by delivery/kitchen staff

---

## 📊 Tab 6: Summary

### Features
- **Date Filtering**
  - Filter summary by specific date
  - "Show All" to see complete summary
  - Default: Today's orders

- **Copy-Paste Format**
  - Plain text summary for easy sharing
  - "Copy to Clipboard" button
  - WhatsApp/SMS friendly format

- **Summary Content**
  - **Header**: Total Boxes count
  - **Section 1**: Boxes by Type
    - Each box type + rice type combination
    - Count per combination
    - Sorted by count (descending)
  - **Section 2**: Boxes by Address
    - Total boxes per delivery address
    - Sorted by count (descending)

### Example Output
```
TOTAL BOXES: 25

Boxes (count by type)
• Veg Comfort Box + Basmati: 10
• Non-Veg Comfort Box + Jasmine: 8
• Veg Special Box + Basmati: 5
• Non-Veg Special Box + Jasmine: 2

Addresses (total boxes per address)
• 123 Main St, Kansas City, MO: 12 boxes
• 456 Oak Ave, Kansas City, MO: 8 boxes
• 789 Elm St, Kansas City, MO: 5 boxes
```

### Use Case
- Quick overview for kitchen staff
- Share daily orders via text/WhatsApp
- Planning and preparation
- Route optimization for delivery

---

## ⏰ Tab 7: Operating Hours

### Features
- **Configure Business Hours**
  - Opening Time (start accepting orders)
    - Default: 05:00 AM
    - Time picker input
  - Closing Time (last order cutoff)
    - Default: 11:30 PM
    - Time picker input

- **Current Hours Display**
  - Visual cards showing active hours
  - Green card for opening time
  - Red card for closing time
  - Formatted time display (12-hour format)

- **Order Restriction**
  - Orders can only be placed between opening and closing times
  - Order form automatically disabled outside hours
  - Customer sees message when closed

### Use Case
- Control when orders can be placed
- Prevent late-night orders
- Weekend/holiday hour adjustments
- Automatic enforcement on customer-facing site

---

## 🎨 UI/UX Features

### Design
- **Tailwind CSS** for styling
- **Responsive layout** (mobile-friendly)
- **Color-coded sections**:
  - Blue: General information
  - Green: Success/Active states
  - Red: Warning/Inactive states
  - Yellow/Orange: Branding colors
  - Purple: Special features
- **Icons** (emoji) for visual navigation
- **Sticky header** with logo and branding

### Interactions
- **Real-time updates** after CRUD operations
- **Confirmation dialogs** for destructive actions
- **Loading spinners** during data fetch
- **Success/Error messages** with color coding
- **Form validation** with required field indicators
- **Hover effects** on buttons and table rows

### Tables
- **Responsive** with horizontal scroll
- **Alternating row colors** (white/gray)
- **Fixed header** styling
- **Action buttons** inline per row
- **Badge components** for status indicators
- **Formatted dates** and currency

---

## 🔧 Technical Implementation Notes

### Frontend
- Pure JavaScript (no framework)
- Single-page application (SPA) pattern
- Client-side routing with view states
- Local data caching

### Backend API Endpoints (Inferred)
```
GET    /api/admin/orders
GET    /api/admin/orders/date/{date}
POST   /api/orders

GET    /api/meal-passes
POST   /api/meal-passes
PUT    /api/meal-passes/{id}
DELETE /api/meal-passes/{id}

GET    /api/admin/pricing
PUT    /api/admin/pricing

GET    /api/admin/other-items
POST   /api/admin/other-items
PUT    /api/admin/other-items/{id}
DELETE /api/admin/other-items/{id}

POST   /api/admin/generate-pdf
POST   /api/admin/generate-docx

GET    /api/admin/operating-hours
PUT    /api/admin/operating-hours
```

### Data Storage
- Orders table
- Meal passes table
- Pricing configuration
- Other items table
- Operating hours settings

---

## 🎯 Implementation Priority for New System

### Phase 1 (High Priority - Core Operations)
1. ✅ Order Management (already have orders/customers)
2. ✅ Menu Items management (currently "Lunch Boxes")
3. 🔲 Pricing management
4. 🔲 Summary view with copy-paste functionality

### Phase 2 (Medium Priority - Enhanced Features)
5. 🔲 PDF/Document Generator for stickers
6. 🔲 Meal Passes system
7. 🔲 Operating Hours configuration

### Phase 3 (Nice to Have)
8. 🔲 Other Items management (additional products)
9. 🔲 Role-based access control
10. 🔲 Advanced filtering and reporting

---

## 📝 Key Differences from Current System

### What We Already Have
- ✅ Orders management
- ✅ Customers management
- ✅ Menu Items (Lunch Boxes) management
- ✅ Companies management (not in archived version)

### What We Need to Add
- 🔲 **Pricing Management**: Dynamic price configuration by admin
- 🔲 **Meal Passes**: Subscription/pass system for frequent customers
- 🔲 **Other Items**: Additional products beyond lunch boxes
- 🔲 **PDF Generator**: Sticker/label printing for orders
- 🔲 **Summary View**: Copy-paste friendly daily summary
- 🔲 **Operating Hours**: Business hours configuration
- 🔲 **Role-Based Access**: Admin vs restricted user roles

### Enhancements in Current System
- ✅ **Companies**: Multi-company support (new feature)
- ✅ **Better Architecture**: Clean Architecture with CQRS/MediatR
- ✅ **Modern UI**: React with TypeScript
- ✅ **OTP Authentication**: SMS-based auth (new feature)
- ✅ **OTP Usage Tracking**: Analytics for OTP requests (new feature)

---

## 🚀 Next Steps

1. **Review this document** with stakeholders to confirm required features
2. **Prioritize features** based on business needs
3. **Design database schema** for new features (meal passes, pricing, other items)
4. **Create API endpoints** following existing CQRS pattern
5. **Build React components** for each new tab
6. **Implement role-based access** if needed
7. **Add document generation** capability (using similar approach)

---

## 💡 Recommendations

### Must-Have Features
- **Pricing Management**: Critical for business flexibility
- **Summary View**: Highly useful for daily operations
- **PDF Generator**: Important for kitchen/delivery operations

### Consider Adding
- **Meal Passes**: Good for customer retention and recurring revenue
- **Operating Hours**: Useful for automated order control
- **Other Items**: Revenue diversification opportunity

### Can Wait
- **Role-Based Access**: Start with single admin role, add later if needed
- **Other Items Tab**: Can use existing menu items system initially

---

*Document created: February 19, 2026*
*Based on archived website analysis*
