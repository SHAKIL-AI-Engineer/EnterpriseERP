# Administrator module

The Administrator workspace lives at `/administrator`. It is a separate module in the module switcher and requires the `Admin` or `SuperAdmin` role. Payroll policies remain restricted to `SuperAdmin`. Previous `/management/administrator/*` URLs redirect to their new addresses, and `/management/database` redirects to `/administrator/database`.

## Services

- User management and role permissions use the existing Auth service.
- Approvals use the existing company-scoped Merchandising approval workflow, including its backend permission checks.
- Logs, error resolution, and bugs use the Platform Host Administrator API.

The API endpoints are under `/api/v1/administrator`: `GET overview`, `GET logs`, `PUT errors/{id}/resolution`, `GET bugs`, `POST bugs`, and `PUT bugs/{id}`. They enforce the administrator role on the server. The gateway forwards these routes to Platform Host.

## Persistence

`AdministratorDbContext` uses `ConnectionStrings:AdministratorDb` when supplied, otherwise the existing `AuthDb` SQL Server database. Startup creates the `administrator.Events` and `administrator.Bugs` tables and their indexes if absent. This is independent of the existing service migration skip flag. The connection identity needs permission to create this schema and its tables on initial startup.

The request audit middleware stores successful API mutations and HTTP failures handled by Platform Host. It omits successful reads, request bodies, query strings, authorization headers, and exception stack traces. Log entries contain UTC time, status, duration, request path, trace ID, and actor ID. The dashboard identifies this source as Platform Host; independent microservices routed directly by the gateway are outside its coverage. Existing console logs remain available for detailed investigation using the trace ID.

The API returns the latest 200 log entries by default (maximum 500), and up to 500 bug reports. Records persist in SQL Server; no sample records or historical events are seeded. Error resolution changes the operational acknowledgement only; it does not change the original response status. Bug reports support Open, InProgress, Resolved, and Closed status, plus Low, Medium, High, and Critical priority.

## Run

From `backend`, rebuild `platform-host`, `gateway`, and `frontend` with the `gateway-docker` compose profile, then start the full profile. The frontend entry point is `http://localhost:3000/administrator` by default. Set `ERP_WEB_PORT` in `backend/.env` to choose a different host port when Windows reserves port 3000. The current local environment uses `ERP_WEB_PORT=5173`, so its entry point is `http://localhost:5173/administrator`.
