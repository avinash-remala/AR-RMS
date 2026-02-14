# Getting Started with RMS-AV

## Prerequisites
- .NET 8 SDK
- Node.js 18+
- SQLite (included with .NET)

## Quick Start

### Option 1: Using the Dev Script
```bash
./build/scripts/start-dev.sh
```

### Option 2: Manual Start

#### Backend
```bash
cd src/backend
dotnet restore
dotnet run --project src/Rms.Av.Api
```
API will be available at: http://localhost:5000

#### Frontend
```bash
cd src/frontend/rms-av-web
npm install
npm run dev
```
Frontend will be available at: http://localhost:5173

### Option 3: Using Docker
```bash
docker-compose up --build
```
- API: http://localhost:5000
- Frontend: http://localhost:3000

## Project Structure

### Backend (.NET)
- **Rms.Av.Api**: REST API endpoints
- **Rms.Av.Application**: Business logic and use cases
- **Rms.Av.Domain**: Domain entities and business rules
- **Rms.Av.Infrastructure**: Data access and external services

### Frontend (React)
- **features**: Feature-based modules (orders, companies, etc.)
- **components**: Reusable UI components
- **services**: API clients and utilities
- **app**: Application shell and routing

## Initial Setup

The database will be created automatically on first run. It includes:
- Companies table
- Orders table
- Employees table (coming soon)

## API Endpoints

- `GET /api/companies` - List all companies
- `POST /api/companies` - Create a new company
- `GET /api/orders` - List orders (with optional date filter)
- `POST /api/orders` - Create a new order

## Development

### Adding a New Feature
1. Create domain entity in `Rms.Av.Domain/Modules/{Feature}`
2. Add DbSet to `RmsAvDbContext`
3. Create API controller in `Rms.Av.Api/Controllers`
4. Create frontend components in `src/features/{feature}`

### Running Tests
```bash
cd src/backend
dotnet test
```

## Troubleshooting

### Port Already in Use
- Backend: Change port in `Properties/launchSettings.json`
- Frontend: Change port in `vite.config.ts`

### Database Issues
- Delete `rmsav.db` file and restart to recreate database

## Next Steps
- [ ] Add authentication (JWT)
- [ ] Add employee management
- [ ] Add meal plans
- [ ] Add delivery tracking
- [ ] Add reports and analytics
