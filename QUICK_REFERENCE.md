# RMS-AV Quick Reference

## 🚀 Start Development

```bash
# From project root
./build/scripts/start-dev.sh

# Or manually:
# Terminal 1 - Backend
cd src/backend && dotnet run --project src/Rms.Av.Api

# Terminal 2 - Frontend
cd src/frontend/rms-av-web && npm run dev
```

## 🌐 URLs
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000
- **Swagger/OpenAPI**: http://localhost:5000/swagger (in development)

## 📦 Tech Stack Summary

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript + Vite |
| Backend | .NET 8 + ASP.NET Core |
| Database | SQLite (EF Core) |
| API Style | RESTful |
| Architecture | Clean Architecture + Feature-based |

## 🗂️ Project Layout

```
rms-av/
├── src/backend/                    # .NET Solution
│   ├── src/
│   │   ├── Rms.Av.Api/            # 🔵 API Layer
│   │   ├── Rms.Av.Application/    # 🟢 Business Logic
│   │   ├── Rms.Av.Domain/         # 🟡 Domain Entities
│   │   └── Rms.Av.Infrastructure/ # 🟠 Data Access
│   └── tests/
└── src/frontend/rms-av-web/       # React App
    └── src/
        ├── features/              # Feature modules
        ├── components/            # UI components
        └── services/              # API clients
```

## 🎯 Core Entities

### Employee
- Roles: Admin, Manager, Kitchen, Packing, Delivery
- Fields: Name, Email, Phone, HiredDate

### Company
- Corporate customers
- Fields: Name, Address, Contact details

### Order
- Lunch box orders
- Fields: VegCount, NonVegCount, RiceType, DeliveryDate
- Status: Pending → Confirmed → InPreparation → ReadyForDelivery → OutForDelivery → Delivered

## 📝 Common Tasks

### Add a New API Endpoint
1. Create entity in `Rms.Av.Domain/Modules/{Module}/`
2. Add DbSet to `RmsAvDbContext.cs`
3. Create controller in `Rms.Av.Api/Controllers/`
4. Run migrations if needed

### Add a New Frontend Page
1. Create in `src/features/{module}/pages/`
2. Add API client in `src/features/{module}/api/`
3. Add route in `App.tsx`

### Database Reset
```bash
# Delete database file
rm src/backend/src/Rms.Av.Api/rmsav.db*

# Restart API - will recreate automatically
```

## 🔧 Configuration Files

| File | Purpose |
|------|---------|
| `appsettings.Development.json` | Backend config |
| `.env` | Frontend environment vars |
| `docker-compose.yml` | Container orchestration |

## 📚 Folder Purpose

### Backend
- **Controllers**: HTTP endpoints
- **Common/Abstractions**: Interfaces
- **Modules/{Feature}**: Feature-specific code
- **Persistence**: Database context
- **Identity**: Authentication

### Frontend
- **features/{module}/pages**: Route components
- **features/{module}/api**: API service calls
- **components**: Reusable UI
- **services**: Cross-cutting concerns

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| Port in use | Change in `launchSettings.json` / `vite.config.ts` |
| DB errors | Delete `rmsav.db` and restart |
| CORS errors | Check CORS policy in `Program.cs` |
| Build errors | Run `dotnet restore` and `npm install` |

## 📞 Module Status

| Module | Status |
|--------|--------|
| Companies | ✅ Implemented |
| Orders | ✅ Implemented |
| Employees | 🟡 Domain only |
| MealPlans | ⭕ Planned |
| Menu | ⭕ Planned |
| Delivery | ⭕ Planned |
| Payments | ⭕ Planned |
| Reports | ⭕ Planned |

## 🔐 Authentication (Coming Soon)
- JWT tokens
- Role-based access
- User management

---

**Created**: February 14, 2026  
**Version**: 1.0.0  
**Status**: Development
