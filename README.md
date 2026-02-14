# RMS-AV - Restaurant Management System

## Overview
Enterprise-level restaurant management system for Amrutha Vilas to manage employees, corporate lunch box customers, and admin operations.

## Structure
```
rms-av/
├── src/
│   ├── backend/        # .NET backend
│   └── frontend/       # React frontend
├── docs/               # Documentation
├── infra/              # Infrastructure (Docker, etc.)
└── build/              # Build scripts
```

## Getting Started

### Prerequisites
- .NET 8 SDK
- Node.js 18+
- SQLite

### Backend
```bash
cd src/backend
dotnet restore
dotnet run --project src/Rms.Av.Api
```

### Frontend
```bash
cd src/frontend/rms-av-web
npm install
npm run dev
```

## Features
- Employee management
- Corporate customer portal
- Order tracking
- Meal plan subscriptions
- Delivery management
- Reports and analytics

## Tech Stack
- **Backend**: .NET 8, ASP.NET Core, Entity Framework Core, SQLite
- **Frontend**: React 18, Vite, TypeScript
- **Auth**: JWT