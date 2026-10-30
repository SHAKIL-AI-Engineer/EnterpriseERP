# Enterprise ERP — Architecture

This document describes the platform layout under `EnterpriseERP/` and how it relates to the legacy monolith `HrHub_backend/`.

## High-level flow

Clients (Next.js, mobile) call a single **API Gateway** (YARP) on port **5000**. The gateway routes versioned paths to microservices or falls back to the **legacy** ASP.NET API until each domain is fully extracted.

| Path prefix | Target | Port (local host) |
|-------------|--------|---------------------|
| `/api/v1/auth/*` | AuthService | 5012 |
| `/api/v1/companies/*` | CompanyService | 5020 |
| `/api/v1/branches/*` | BranchService | 5021 |
| `/api/v1/hr/*` | HRService | 5035 |
| `/api/v1/shift/*` | Shift shell | 5036 |
| `/api/v1/attendance/*` | Attendance shell | 5037 |
| `/api/v1/leave/*` | Leave shell | 5038 |
| `/api/v1/payroll/*` | Payroll shell | 5039 |
| `/api/v1/accounts/*` | Accounts shell | 5040 |
| `/api/v1/inventory/*` | Inventory shell | 5041 |
| `/api/v1/production/*` | Production shell | 5042 |
| `/api/v1/merchandising/*` | Merchandising shell | 5043 |
| `/api/v1/cutting/*` | Cutting shell | 5044 |
| `/api/v1/bills/*` | Bills shell | 5045 |
| `/api/v1/report/*` | Report shell | 5046 |
| `/api/v1/notification/*` | Notification shell | 5047 |
| `/api/v1/audit/*` | Audit shell | 5048 |
| `/api/v1/filestorage/*` | File storage shell | 5049 |
| `/*` (catch-all) | HrHub_backend (legacy) | 5011 |

## Building blocks

Shared libraries live under `EnterpriseERP/BuildingBlocks/`:

- **Erp.BuildingBlocks.SharedKernel** — base types (e.g. auditable entities, result pattern).
- **Erp.BuildingBlocks.CommonResponses** — `ApiResponse<T>` and error shapes aligned with Auth contracts.
- **Erp.BuildingBlocks.Contracts** — cross-cutting DTOs such as pagination.
- **Erp.BuildingBlocks.EventBus** — integration event abstractions and stable **event type** string constants for RabbitMQ routing keys.

## Event-driven integration

Services publish domain facts via **outbox → RabbitMQ** (to be wired per service). Consumer services maintain **read models** or trigger workflows; handlers must be **idempotent** (dedupe by `EventId`).

Stable routing key constants are defined in `Erp.BuildingBlocks.EventBus.EventTypes`, including HR, shift, attendance, leave, and payroll events to support downstream projections (for example Attendance consuming `EmployeeUpserted` and `AttendanceDayFinalized` for month-close materialization).

## Strangler pattern

New services own their **database** and **migrations**. The monolith’s multiple `DbContext` types (`ApplicationDbContext`, `CashbookDbContext`, `StoreDbContext`, and so on) are the natural seams for extracting Accounts, Inventory, Production, Merchandising, and Cutting.

## Infrastructure (local)

`EnterpriseERP/docker-compose.yml` provides **Redis**, **RabbitMQ** (management UI on 15672), and **Seq** (5341). An optional **gateway** profile builds the gateway image and points all clusters at `host.docker.internal` for host-run services.

## Security

JWT is issued by **AuthService**; the gateway may validate tokens at the edge; each service continues to validate **issuer**, **audience**, and signing key. **User branch access** is modeled in Auth and exposed for clients to pick an active branch (header or claim strategy per deployment).
