# RMS-AV — Restaurant Management System

Enterprise-level restaurant management system for **Amrutha Vilas**, handling corporate lunch box orders, employee management, meal pass subscriptions, vendor tracking, and admin operations.

---

## Table of Contents

- [Project Structure](#project-structure)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Architecture](#architecture)
- [API Endpoints](#api-endpoints)
- [Configuration](#configuration)
- [Docker / Deployment](#docker--deployment)
- [Known Issues](#known-issues)
- [Features](#features)

---

## Project Structure

```
AR_RMS/
├── src/
│   ├── backend/                        # .NET 10 Clean Architecture API
│   │   ├── src/
│   │   │   ├── Rms.Av.Domain/          # Entities, base classes (no dependencies)
│   │   │   ├── Rms.Av.Application/     # CQRS, MediatR, validators, DTOs
│   │   │   ├── Rms.Av.Infrastructure/  # EF Core, repositories, AWS SNS, PDF
│   │   │   └── Rms.Av.Api/             # ASP.NET Core Web API, controllers
│   │   ├── Dockerfile
│   │   └── railway.toml
│   └── frontend/                       # React 19 Turbo monorepo
│       ├── apps/
│       │   ├── admin/                  # Admin portal (port 5173)
│       │   └── customer/               # Customer portal (port 5174)
│       └── packages/
│           └── styles/                 # Shared styles
├── docs/                               # Architecture documentation
├── docker-compose.yml
├── Makefile
└── dev.sh
```

---

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Backend runtime | .NET | 10.0 |
| Web framework | ASP.NET Core Web API | 10.0 |
| Database | SQLite | — |
| ORM | Entity Framework Core | 10.0.3 |
| CQRS / Mediator | MediatR | 14.0.0 |
| Validation | FluentValidation | 12.1.1 |
| Object mapping | AutoMapper | 12.0.1 |
| Authentication | JWT Bearer | 10.0.3 |
| SMS / OTP | AWS SNS SDK | 4.0.2.16 |
| PDF generation | QuestPDF | 2026.2.1 |
| Frontend | React | 19.2.4 |
| Language | TypeScript | 5.9.3 |
| Build tool | Vite | 7.3.1 |
| Monorepo | Turbo | 2.8.8 |
| Routing | React Router DOM | 7.13.0 |
| Package manager | pnpm | 10.29.3 |

---

## Getting Started

### Prerequisites

- [.NET 10 SDK](https://dotnet.microsoft.com/download/dotnet/10.0)
- [Node.js 20+](https://nodejs.org/)
- [pnpm](https://pnpm.io/installation) (`npm install -g pnpm`)
- SQLite (bundled via EF Core — no separate install needed)
- AWS account with SNS enabled (for OTP/SMS in production)

### Quickstart (Recommended)

```bash
# Run full stack (backend + both frontend apps) with one command
make dev
```

This kills any existing processes on ports 5002, 5173, 5174, then starts everything.

### Manual Setup

**Backend**

```bash
cd src/backend
dotnet restore
cd src/Rms.Av.Api
dotnet run --launch-profile http
# API available at http://localhost:5002
```

**Frontend**

```bash
cd src/frontend
pnpm install
pnpm dev
# Admin portal:    http://localhost:5173
# Customer portal: http://localhost:5174
```

**Environment Variables (Backend)**

Copy and fill in the required values before running:

```bash
# src/backend/src/Rms.Av.Api/appsettings.json (or override via environment)
ConnectionStrings__DefaultConnection=Data Source=/data/rmsav.db
AWS__AccessKey=<your-aws-access-key>
AWS__SecretKey=<your-aws-secret-key>
AWS__Region=us-east-1
AllowedOrigins=http://localhost:5173,http://localhost:5174
```

**Environment Variables (Frontend)**

```bash
# src/frontend/apps/admin/.env
VITE_API_BASE_URL=http://localhost:5002/api

# src/frontend/apps/customer/.env
VITE_API_BASE_URL=http://localhost:5002/api
```

---

## Architecture

The backend follows **Clean Architecture** with strict dependency rules:

```
Domain ← Application ← Infrastructure ← API
```

- **Domain**: Entities only (`Customer`, `Order`, `MenuItem`, `Employee`, `MealPass`, `OtpCode`, etc.). No framework dependencies.
- **Application**: Use cases via MediatR commands/queries, FluentValidation validators, AutoMapper profiles, service interfaces.
- **Infrastructure**: EF Core `RmsAvDbContext`, repository implementations, `AwsSnsService`, `OtpService`, `PdfGeneratorService`.
- **API**: ASP.NET Core controllers, middleware (`GlobalExceptionHandler`), DI composition root, JWT config, CORS.

Database migrations run automatically on API startup via `context.Database.MigrateAsync()`.

---

## API Endpoints

Base URL: `http://localhost:5002/api/v1`

### Auth

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/auth/send-otp` | Send OTP to a phone number via AWS SNS |
| POST | `/auth/verify-otp` | Verify OTP code |
| GET | `/auth/otp-usage` | OTP usage statistics |
| GET | `/auth/top-users` | Top OTP requesters |

### Orders

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/orders` | List orders (date range + building filter) |
| GET | `/orders/today` | Today's orders |
| GET | `/orders/summary` | Summary by order type / address |
| GET | `/orders/customer/{customerId}/last` | Last order for a customer |
| GET | `/orders/{id}` | Get specific order |
| POST | `/orders` | Create order |
| PATCH | `/orders/{id}/status` | Update order status |
| PATCH | `/orders/{id}/cancel` | Cancel order |

Additional controllers: **Customers**, **Companies**, **Employees**, **MenuItems**, **MealPasses**, **Pricing**, **Dashboard**, **PdfGenerator**, **Migration**.

---

## Configuration

### Ports

| Service | Development | Docker |
|---------|-------------|--------|
| Backend API | 5002 | 5000 → 8080 (internal) |
| Admin frontend | 5173 | 3000 → 80 |
| Customer frontend | 5174 | — |

### Database

SQLite file is located at:
- **Development**: `src/backend/src/Rms.Av.Api/rmsav.db` (local run) or `/data/rmsav.db` (Docker)
- **Migrations**: 8 migrations, applied automatically on startup

### AWS SNS (OTP)

OTP codes are sent via AWS SNS. Set `AWS__AccessKey` and `AWS__SecretKey` via environment variables or a secrets manager — never hardcode them.

---

## Docker / Deployment

### Docker Compose (local)

```bash
docker-compose up --build
# API: http://localhost:5000
# Web: http://localhost:3000
```

> **Note**: The docker-compose.yml currently references `./src/frontend/rms-av-web` which no longer exists. Update the frontend service `context` to `./src/frontend/apps/admin` (or build a combined image) before using Docker Compose. See [Known Issues](#known-issues).

### Railway

The backend is configured for Railway deployment via `src/backend/railway.toml`:

```toml
[build]
builder = "dockerfile"
dockerfilePath = "Dockerfile"

[deploy]
restartPolicyType = "on_failure"
restartPolicyMaxRetries = 3
```

Set all required environment variables in Railway's dashboard (especially `AWS__AccessKey`, `AWS__SecretKey`, `ConnectionStrings__DefaultConnection`).

---

## Known Issues

The following issues are present and should be resolved before any production deployment.

### Critical

| # | Issue | Location | Impact |
|---|-------|----------|--------|
| 1 | **Hardcoded emergency OTP bypass** — `"123456"` bypasses all OTP verification | `AuthController.cs:15` | Anyone can authenticate as any user |
| 2 | **AWS credentials empty** in committed config | `appsettings.json` | OTP/SMS will fail without override |
| 3 | **Database files committed to git** (`rmsav.db`, `rms_av.db`) | `src/backend/` | Live data in version control; should be in `.gitignore` |
| 4 | **OTP verification does not issue a JWT token** — auth flow is incomplete | `AuthController.cs:68-71` | Authenticated users receive no token |
| 5 | **In-memory rate limiting** for OTP — resets on restart, not distributed | `OtpService.cs:32-46` | Bypassable; breaks across multiple instances |

### High

| # | Issue | Location | Impact |
|---|-------|----------|--------|
| 6 | **docker-compose.yml references deleted path** `./src/frontend/rms-av-web` | `docker-compose.yml:19` | Docker Compose frontend build fails |
| 7 | **Port inconsistency** — dev uses 5002, Docker exposes 5000 | Multiple files | Frontend `.env` must match environment |
| 8 | **menuApi.ts fallback port is 8080** (Docker port), not 5002 (dev port) | `menuApi.ts:14` | Wrong backend target in local development |
| 9 | **No `[Authorize]` on protected endpoints** — auth middleware missing | Multiple controllers | Endpoints are unauthenticated |
| 10 | **No phone number format validation** | `AuthController.cs`, `AwsSnsService.cs` | Invalid SNS requests possible |

### Medium

| # | Issue | Location | Impact |
|---|-------|----------|--------|
| 11 | Silent broad exception catch in OTP tracking | `OtpService.cs:119-123` | Errors swallowed, no observability |
| 12 | OTP codes not persisted to database | `OtpService.cs` | Codes lost on app restart |
| 13 | No `.env.example` files | Frontend apps | Onboarding friction |
| 14 | No test projects | Entire solution | No automated coverage |
| 15 | `menuApi.ts` uses `/api` prefix instead of `/api/v1` | `menuApi.ts` | Route mismatch with backend |

### Low

| # | Issue | Location | Impact |
|---|-------|----------|--------|
| 16 | Multiple duplicate db files (`rms_av.db`, `rmsav.db`) | `src/backend/` | Unclear which is authoritative |
| 17 | New files untracked in git (`Makefile`, `dev.sh`, `railway.toml`, `apps/customer/`) | Root & subdirs | Not committed; will be lost |
| 18 | No health check endpoints | API | Deployment platforms can't verify liveness |
| 19 | No Swagger/OpenAPI UI configured | API | No interactive docs |

---

## Features

- **OTP Authentication** — Passwordless login via SMS (AWS SNS)
- **Order Management** — Create, track, filter, and cancel orders; today's view and date-range queries
- **Employee Management** — Employee records, hours tracking, payment history
- **Customer Management** — Corporate and individual customers with unique phone index
- **Meal Pass Subscriptions** — Recurring meal plan management
- **Menu Items** — Available/unavailable menu control
- **Pricing Configuration** — Box-type pricing with unique constraints
- **Vendor Management** — Vendor invoices and payment tracking
- **PDF Generation** — Order/summary PDFs via QuestPDF
- **Dashboard** — Aggregated analytics and reporting
- **Admin Portal** — Full management interface (React, port 5173)
- **Customer Portal** — Self-service ordering interface (React, port 5174)
