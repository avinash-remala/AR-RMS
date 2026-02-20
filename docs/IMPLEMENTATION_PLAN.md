# Implementation Plan: Archived Features → New RMS-AV System

## Current State vs Archived System

### Current Admin Tabs (RMS-AV)
1. ✅ **Dashboard** - Overview/stats
2. ✅ **Orders** - Order management
3. ✅ **Lunch Boxes** - Menu items management
4. ✅ **Vendors** - Vendor management (NEW - not in archived)
5. ✅ **Employees** - Employee management (NEW - not in archived)

### Archived System Tabs
1. 📦 **Order Management** → We have "Orders" ✅
2. 🎟️ **Meal Passes** → Missing 🔴
3. 💰 **Pricing** → Missing 🔴
4. ✨ **Other Items** → Missing 🔴
5. 📄 **PDF Generator** → Missing 🔴
6. 📊 **Summary** → Missing 🔴
7. ⏰ **Operating Hours** → Missing 🔴

---

## 🎯 Implementation Roadmap

### Phase 1: Core Business Features (Week 1-2)

#### 1. Pricing Management 💰
**Priority: HIGH** - Critical for business flexibility

**Backend Tasks:**
- [ ] Create `Pricing` entity
  ```csharp
  public class Pricing : BaseEntity
  {
      public string BoxType { get; set; } // "veg_comfort", "nonveg_comfort", "veg_special", "nonveg_special"
      public decimal Price { get; set; }
      public bool IsActive { get; set; }
  }
  ```
- [ ] Add `Pricings` DbSet to `RmsAvDbContext`
- [ ] Create CQRS commands/queries:
  - `GetAllPricingsQuery`
  - `UpdatePricingCommand`
  - `GetActivePricingQuery` (for customer-facing)
- [ ] Create `PricingController` with endpoints:
  - `GET /api/v1/pricing` - Get all box prices
  - `PUT /api/v1/pricing` - Bulk update all prices
  - `GET /api/v1/pricing/active` - Get active prices for ordering
- [ ] Add migration

**Frontend Tasks:**
- [ ] Create `Pricing.tsx` page
- [ ] Create `pricingApi.ts` service
- [ ] Add to sidebar navigation
- [ ] Add route in `App.tsx`
- [ ] UI Components:
  - Price input fields for 4 box types
  - Current pricing display cards
  - Save button with loading state
  - Success/error messages

**Test:**
- [ ] Update prices and verify on order page
- [ ] Verify prices sync with menu items

---

#### 2. Summary View 📊
**Priority: HIGH** - Highly useful for daily operations

**Backend Tasks:**
- [ ] Create `GetOrderSummaryQuery` with optional date filter
- [ ] Add `OrdersSummaryController` or extend `OrdersController`
- [ ] Endpoint: `GET /api/v1/orders/summary?date={date}`
- [ ] Return summary data:
  ```csharp
  {
      "totalBoxes": 25,
      "boxesByType": { "Veg Comfort + Basmati": 10, ... },
      "boxesByAddress": { "123 Main St": 12, ... },
      "date": "2026-02-19"
  }
  ```

**Frontend Tasks:**
- [ ] Create `Summary.tsx` page
- [ ] Create `summaryApi.ts` service
- [ ] Add to sidebar navigation
- [ ] Add route in `App.tsx`
- [ ] UI Components:
  - Date filter with "Show All" button
  - Pre-formatted text display area
  - "Copy to Clipboard" button
  - Auto-format summary text

**Features:**
- Filter by date or show all
- Format: Plain text for easy WhatsApp/SMS sharing
- Copy to clipboard functionality
- Show total boxes, breakdown by type, breakdown by address

---

### Phase 2: Advanced Features (Week 3-4)

#### 3. Meal Passes System 🎟️
**Priority: MEDIUM** - Good for customer retention

**Backend Tasks:**
- [ ] Create `MealPass` entity
  ```csharp
  public class MealPass : BaseEntity
  {
      public Guid CustomerId { get; set; }
      public Customer Customer { get; set; }
      public int TotalMeals { get; set; } = 10
      public int MealsUsed { get; set; } = 0
      public bool IsActive { get; set; } = true
      public DateTime? LastUsedAt { get; set; }
  }
  ```
- [ ] Add `MealPasses` DbSet to `RmsAvDbContext`
- [ ] Create CQRS commands/queries:
  - `CreateMealPassCommand`
  - `GetAllMealPassesQuery`
  - `UpdateMealPassCommand`
  - `DeleteMealPassCommand`
  - `UseMealCommand` (decrement meals)
- [ ] Create `MealPassesController`
- [ ] Update `OrdersController` to support meal pass usage
- [ ] Add migration

**Frontend Tasks:**
- [ ] Create `MealPasses.tsx` page
- [ ] Create `mealPassesApi.ts` service
- [ ] Add to sidebar navigation
- [ ] Add route in `App.tsx`
- [ ] UI Components:
  - Add meal pass form
  - Meal passes table with actions
  - Activate/Deactivate toggle
  - Delete with confirmation
  - Show meals left calculation

**Features:**
- Create pass for customer (10 meals default)
- View all passes with usage tracking
- Activate/deactivate passes
- Delete passes
- Auto-decrement on order placement
- Track last used date

---

#### 4. PDF Generator 📄
**Priority: MEDIUM** - Important for operations

**Backend Tasks:**
- [ ] Install PDF generation library (e.g., `QuestPDF`, `iTextSharp`, or `DinkToPdf`)
- [ ] Create `GenerateStickersPdfCommand`
- [ ] Create `PdfGeneratorController`
- [ ] Endpoint: `POST /api/v1/pdf/generate-stickers`
  - Accept date parameter
  - Return PDF file stream
- [ ] Design sticker template layout:
  - Customer name
  - Delivery address
  - Box type
  - Rice type
  - Quantity
  - Order ID/date

**Frontend Tasks:**
- [ ] Create `PdfGenerator.tsx` page
- [ ] Create `pdfApi.ts` service
- [ ] Add to sidebar navigation
- [ ] Add route in `App.tsx`
- [ ] UI Components:
  - Date picker
  - Preview orders button
  - Orders preview table
  - Generate PDF button
  - Download link after generation
  - Order count display

**Features:**
- Select date
- Preview orders for that date
- Generate PDF with stickers
- Download PDF file
- Reset to generate new

**Library Recommendation:**
- **QuestPDF** (preferred) - Modern, fluent API, MIT license
  ```bash
  dotnet add package QuestPDF
  ```

---

#### 5. Other Items Management ✨
**Priority: LOW** - Can use existing menu items initially

**Option A: Extend Current Menu Items System**
- Add "Item Type" field: "LunchBox" vs "Other"
- Filter lunch boxes vs other items in UI
- Reuse all existing CRUD operations

**Option B: Create Separate System**
- Create new `OtherItem` entity (simpler than MenuItem)
- Separate table and controller
- Separate UI page

**Recommendation:** Go with **Option A** initially. Add `ItemType` to `MenuItem`:
```csharp
public enum ItemType
{
    LunchBox,
    Snack,
    Drink,
    Dessert,
    Other
}
```

**Tasks:**
- [ ] Add `ItemType` property to `MenuItem` entity
- [ ] Update database schema
- [ ] Add migration
- [ ] Filter "Lunch Boxes" page to only show `ItemType.LunchBox`
- [ ] Create new "Other Items" page showing other types
- [ ] Update forms to allow selecting item type

---

#### 6. Operating Hours ⏰
**Priority: LOW** - Useful for automation

**Backend Tasks:**
- [ ] Create `BusinessSettings` entity
  ```csharp
  public class BusinessSettings : BaseEntity
  {
      public TimeSpan OpeningTime { get; set; } = new TimeSpan(5, 0, 0); // 5:00 AM
      public TimeSpan ClosingTime { get; set; } = new TimeSpan(23, 30, 0); // 11:30 PM
      public bool IsOrderingEnabled { get; set; } = true;
  }
  ```
- [ ] Add to `RmsAvDbContext`
- [ ] Create CQRS commands/queries
- [ ] Create `BusinessSettingsController`
- [ ] Add migration
- [ ] Create middleware/service to check ordering hours

**Frontend Tasks:**
- [ ] Create `OperatingHours.tsx` admin page
- [ ] Create `businessSettingsApi.ts` service
- [ ] Add to sidebar navigation
- [ ] Update customer order page to check hours
- [ ] Show "Closed" message outside hours

**Features:**
- Configure opening and closing times
- Display current hours
- Automatic order form disabling outside hours
- Override toggle for special cases

---

### Phase 3: Enhanced Features (Week 5+)

#### 7. Role-Based Access Control
**Priority: LOW** - Can wait

**Tasks:**
- [ ] Add `Role` enum to `Employee` or `User` entity
- [ ] Implement authorization policies
- [ ] Add role checking to controllers
- [ ] Update frontend to show/hide features based on role
- [ ] Add role selection in employee management

**Roles:**
- `Admin` - Full access
- `Manager` - Most features except sensitive settings
- `Staff` - View-only or limited actions
- `Restricted` - PDF Generator and Summary only (like archived)

---

#### 8. Enhanced Dashboard
**Tasks:**
- [ ] Add summary statistics widgets
- [ ] Today's orders count
- [ ] Revenue today/this week/this month
- [ ] Top selling items
- [ ] Recent orders list
- [ ] Charts/graphs (optional)

---

## 📋 Database Schema Changes

### New Tables to Create

1. **Pricings**
   - Id (Guid)
   - BoxType (string)
   - Price (decimal)
   - IsActive (bool)
   - CreatedAt, UpdatedAt

2. **MealPasses**
   - Id (Guid)
   - CustomerId (Guid, FK)
   - TotalMeals (int)
   - MealsUsed (int)
   - IsActive (bool)
   - LastUsedAt (DateTime?)
   - CreatedAt, UpdatedAt

3. **BusinessSettings** (singleton table)
   - Id (Guid)
   - OpeningTime (TimeSpan)
   - ClosingTime (TimeSpan)
   - IsOrderingEnabled (bool)
   - CreatedAt, UpdatedAt

### Tables to Modify

1. **MenuItems** (if using Option A for Other Items)
   - Add: ItemType (enum/string)

2. **Employees** (if implementing RBAC)
   - Add: Role (enum/string)

---

## 🔄 Migration Strategy

For each new feature:
```bash
cd src/backend/src/Rms.Av.Infrastructure
dotnet ef migrations add Add{FeatureName} --startup-project ../Rms.Av.Api
dotnet ef database update --startup-project ../Rms.Av.Api
```

Order of migrations:
1. AddPricingTable
2. AddMealPassesTable
3. AddBusinessSettingsTable
4. AddItemTypeToMenuItems (if Option A)

---

## 🎨 UI/Navigation Updates

### Proposed Sidebar Structure

```
Admin
Amrutha Vilas
─────────────────
📊 Dashboard
📦 Orders
🍱 Lunch Boxes
✨ Other Items      [NEW]
💰 Pricing          [NEW]
📄 Summary          [NEW]
🎟️ Meal Passes     [NEW]
─────────────────
👥 Customers        [Move from Orders if separate]
🏢 Companies
👨‍💼 Employees
🚚 Vendors
─────────────────
⏰ Operating Hours  [NEW]
📄 PDF Generator    [NEW]
⚙️ Settings
```

### Alternatively (Grouped):

```
📊 Dashboard
─────────────────
Orders & Sales
  📦 Orders
  📄 Summary
  📄 PDF Generator
─────────────────
Menu Management
  🍱 Lunch Boxes
  ✨ Other Items
  💰 Pricing
─────────────────
Customers
  👥 Customers
  🎟️ Meal Passes
─────────────────
Business
  🏢 Companies
  👨‍💼 Employees
  🚚 Vendors
─────────────────
Settings
  ⏰ Operating Hours
  ⚙️ General Settings
```

---

## 🚀 Quick Start Guide

### Step 1: Choose Features
Review with stakeholders and select which features to implement first.

### Step 2: Start with Phase 1
Begin with **Pricing** and **Summary** as they provide immediate value.

### Step 3: Implement Backend First
For each feature:
1. Create entity
2. Add DbSet
3. Create migration and apply
4. Create CQRS handlers
5. Create controller
6. Test with Postman

### Step 4: Then Build Frontend
1. Create page component
2. Create API service
3. Add route
4. Add to sidebar
5. Test UI

### Step 5: Deploy and Gather Feedback
Deploy each feature incrementally to production for feedback.

---

## 📊 Estimated Timeline

| Feature | Backend | Frontend | Total | Priority |
|---------|---------|----------|-------|----------|
| Pricing | 1 day | 1 day | 2 days | HIGH |
| Summary | 0.5 day | 1 day | 1.5 days | HIGH |
| Meal Passes | 2 days | 2 days | 4 days | MEDIUM |
| PDF Generator | 2 days | 1 day | 3 days | MEDIUM |
| Other Items | 1 day | 1 day | 2 days | LOW |
| Operating Hours | 1 day | 1 day | 2 days | LOW |
| RBAC | 2 days | 1 day | 3 days | LOW |

**Phase 1 Total:** ~4 days (1 week)
**Phase 2 Total:** ~9 days (2 weeks)
**Phase 3 Total:** ~5 days (1 week)
**Complete Project:** ~4 weeks

---

## ✅ Definition of Done

For each feature:
- [ ] Backend entity created
- [ ] Database migration applied
- [ ] CQRS commands/queries implemented
- [ ] Controller endpoints created
- [ ] Postman collection updated
- [ ] Frontend page created
- [ ] API service created
- [ ] Navigation updated
- [ ] Manual testing completed
- [ ] Documentation updated
- [ ] Code reviewed
- [ ] Deployed to production

---

## 📝 Notes

1. **Pricing Integration**: When implementing Pricing, ensure it syncs with the customer-facing order page so customers see current prices.

2. **Meal Pass Usage**: When a customer places an order with a meal pass, automatically decrement `MealsUsed` and update `LastUsedAt`.

3. **PDF Library**: QuestPDF is recommended for its ease of use and modern API. Alternatively, consider using a cloud service like DocRaptor or PDF Generator API.

4. **Summary Export**: Consider adding Excel export in addition to copy-paste text format for more detailed analysis.

5. **Business Settings**: Consider adding more settings beyond operating hours (delivery fee, tax rate, service fee, etc.).

6. **Notifications**: Consider adding email/SMS notifications for low meal pass balance or daily order summaries.

---

*Created: February 19, 2026*
*Based on archived admin dashboard feature analysis*
