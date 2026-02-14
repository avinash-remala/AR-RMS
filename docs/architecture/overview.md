# RMS-AV Architecture Overview

## Restaurant Management System - Amrutha Vilas

### System Purpose
A mini enterprise-level application to manage:
- Restaurant employees (kitchen, packing, delivery staff)
- Corporate lunch box customers
- Admin operations (owners/managers)

### Architecture Pattern
**Modular Monolith with Clean Architecture**

### Technology Stack
- **Backend**: .NET 8 (ASP.NET Core Web API)
- **Frontend**: React 18 with Vite
- **Database**: SQLite (development), SQL Server (production)
- **Authentication**: JWT
- **API Documentation**: OpenAPI/Swagger

### Core Modules
1. **Employees** - Staff management, shifts, roles
2. **Companies** - Corporate client management
3. **Customers** - Individual customer profiles
4. **Orders** - Order creation, tracking, status management
5. **MealPlans** - Subscription-based meal planning
6. **Menu** - Menu items, daily specials
7. **Delivery** - Route management, delivery tracking
8. **Payments** - Invoicing, payment tracking
9. **Reports** - Analytics and operational reports

### User Roles
- **Admin**: Full system access, reports, configuration
- **Employee**: Limited access to assigned tasks (packing, delivery)
- **Corporate Customer**: Access to company orders and meal plans
