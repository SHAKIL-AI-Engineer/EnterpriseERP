# Database design (per service)

## Principles

- **One logical SQL Server database per service** (one server instance is acceptable in development).
- **Foreign keys only inside a single database.** Cross-service references use stable identifiers (`CompanyId`, `BranchId`, `EmployeeId`, and so on) without EF navigation across service boundaries.
- **New platform IDs:** prefer **GUID** for globally unique references in greenfield tables; the legacy monolith uses **int** in places — bridge tables or import mappings are required during migration.

## Current databases

| Service | Context / notes |
|---------|-----------------|
| **AuthService** | **AuthServiceDB** (connection key `AuthDb`) — Identity, roles, permissions, refresh tokens, **UserBranchAccess**. |
| **CompanyService** | **CompanyServiceDB** (connection key `CompanyDb`) — company master. |
| **BranchService** | **BranchServiceDB** (connection key `BranchDb`) — branches scoped by company. |
| **HRService** | **HRServiceDB** (connection key `HrDb`) — grades, departments, designations, employees, documents, transfers, status history. Company and branch appear as **reference IDs** only (no FK to Company/Branch DB). |
| **Shell services** | No persistence yet; each future service will introduce its own `DbContext` and migrations aligned with monolith seams (for example **CashbookDbContext** for Accounts, **StoreDbContext** for Inventory). |

## Indexing (HR example)

Hot list queries should use composite indexes such as:

- `(BranchId, EmployeeCode)` unique where codes are branch-scoped.
- `(BranchId, Status, IsDeleted)` for employee grids.
- `(DepartmentId, IsDeleted)` for organogram and department filters.

Use filtered indexes on `IsDeleted = 0` where soft-delete is universal.

## Reporting

Heavy cross-domain reporting should land in a dedicated **Report** database fed asynchronously from integration events, not live joins across many OLTP databases.

## Migrations in CI

Build pipelines should run `dotnet ef database update` (or generate SQL scripts) per service using that service’s startup project and connection string secret. See `deployment.md`.
