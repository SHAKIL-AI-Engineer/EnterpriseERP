# Enterprise ERP

Enterprise ERP is a modular platform for HR, payroll, attendance, production, merchandising, and related operations. The repository is organized as a monorepo with a **Next.js** web client and a **.NET microservices** backend that is gradually replacing a legacy monolith using a strangler pattern.

## Repository layout

| Path | Description |
|------|-------------|
| [`hrhub/`](hrhub/) | Next.js (App Router) frontend — dashboards, HR, payroll, store, production, merchandising, and more |
| [`backend/`](backend/) | API gateway, shared building blocks, microservices, Docker compose, and platform docs |
| [`backend/docs/architecture.md`](backend/docs/architecture.md) | Routing, ports, event bus, and migration strategy |

## Architecture (overview)

Clients talk to a single **YARP API Gateway** (port **5000**). Versioned routes are forwarded to dedicated services; unmatched paths fall back to the legacy API until each domain is fully extracted.

```
┌─────────────┐     ┌──────────────┐     ┌─────────────────────────────┐
│   hrhub     │────▶│  API Gateway │────▶│  Microservices + legacy API │
│  (Next.js)  │     │   :5000      │     │  Auth, HR, Company, …       │
└─────────────┘     └──────────────┘     └─────────────────────────────┘
                              │
                    Redis · RabbitMQ · Seq
```

Key backend areas:

- **BuildingBlocks/** — shared kernel, API envelopes, pagination, integration events
- **ApiGateway/** — reverse proxy and JWT validation at the edge
- **Services/** — Auth, Company, HR, Shift, Attendance, Leave, Payroll, PunchData (Go), ImportExport (Go), and others
- **MicroserviceShells/** — thin hosts for domains still migrating off the monolith

See [docs/build-run-and-services.md](docs/build-run-and-services.md) for **full build, run, and service management**. For HR/punch/attendance/leave/payroll/import flows and ERDs, see [docs/hr-domain-architecture.md](docs/hr-domain-architecture.md). See also [backend/README.md](backend/README.md) and [backend/docs/architecture.md](backend/docs/architecture.md) for routing and event-driven integration.

## Prerequisites

- **Node.js** 18+ and npm (or pnpm/yarn) for the frontend
- **.NET SDK** 8+ for backend services and the gateway
- **Docker** (optional) for Redis, RabbitMQ, Seq, and containerized services
- **SQL Server** for services that persist data locally

## Quick start

### 1. Platform infrastructure

From `backend/`:

```bash
docker compose up -d redis rabbitmq seq
```

| Service | URL / port |
|---------|------------|
| Gateway | http://localhost:5000 |
| AuthService | http://127.0.0.1:5012 |
| Legacy monolith (fallback) | http://127.0.0.1:5011 |
| Redis | localhost:6379 |
| RabbitMQ | localhost:5672 (management UI :15672) |
| Seq | http://localhost:5341 |

Start individual APIs as needed, for example:

```bash
# From backend/
dotnet run --project Services/AuthService/AuthService.Api/AuthService.Api.csproj
dotnet run --project ApiGateway/Gateway.Api/Gateway.Api.csproj
```

Build the full backend tree:

```bash
dotnet build EnterpriseERP.slnx
```

### 2. Frontend (hrhub)

```bash
cd hrhub
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Point the app at your gateway or service base URL via the project’s environment configuration (see `hrhub/lib/services/` for API clients).

## Domain coverage (frontend)

The `hrhub` app includes modules such as:

- Human resource management (employees, organogram, manpower)
- Attendance, leave, and shift
- Payroll and accounts
- Store and inventory
- Production, cutting, and merchandising

## Contributing

- Keep service boundaries clear: each microservice owns its database and EF migrations.
- Prefer the gateway for client-facing APIs; add new routes in gateway config when exposing a service.
- Use stable integration event types from `Erp.BuildingBlocks.EventBus` for cross-service messaging.

## License

Proprietary — internal use unless otherwise specified by the repository owner.
