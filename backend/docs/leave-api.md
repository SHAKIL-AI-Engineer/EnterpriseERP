# Leave Management API

Base path: `/api/v1` (Platform.Host). All endpoints use `ApiResponse<T>` for writes and `PaginatedApiResponse<T>` for paginated lists unless noted.

## Pagination (list endpoints)

| Parameter | Default | Notes |
|-----------|---------|--------|
| `page` | `1` | 1-based |
| `pageSize` | `50` | Allowed: `10`, `20`, `50`, `100` |
| `getAll` | `false` | When `true`, returns all matching rows in `data` |

See [pagination.md](./pagination.md) for the shared envelope.

## Paginated list routes

### `GET /leaves/applications`

Query: `companyId` (required), `status`, `employeeId`, `fromDate`, `toDate`, plus pagination params.

Response rows (`LeaveApplicationListItemDto`) include HR enrichment:

- `employeeCode`, `employeeName`, `departmentName`, `designationName`
- `leaveTypeName` (from leave type)

No separate `POST /hr/Employees/batch` call is required for the list UI.

### `GET /holidays`

Query: `companyId`, `year`, pagination params.

### `GET /leave-encashments`

Query: `companyId`, optional `year`, pagination params.

## HR lookup (internal / standalone Leave service)

### `POST /hr/Employees/lookup`

Body: `{ "ids": ["guid", ...] }`

Returns slim `EmployeeLookupDto` rows for batch enrichment.

## Caching (leave-types, leave-policies, holidays)

By default, reference lists use **in-memory** cache (`MemoryLeaveCache`), not Redis. This avoids ~10s delays when `ConnectionStrings:Redis` points at a stopped Redis instance.

To use Redis: set `Leave:UseRedisCache` to `true` in configuration and ensure Redis is running.

## Other leave routes

| Prefix | Notes |
|--------|--------|
| `/leave-types` | CRUD; list is not paginated (small sets) |
| `/leave-policies` | CRUD + list by company |
| `/leave-balances` | Per-employee balances; batch generate/accrue |
| `/leaves/apply`, `/leaves/applications/{id}` | Detail includes approval `steps` |
| `/weekly-offs`, `/earn-leaves`, `/day-types` | As before |

## Migration notes (frontend)

- Replace `unwrapResponse` list calls with `unwrapPaginatedApiData` + `buildPaginationParams`.
- Use `mapLeaveApplicationListItems` instead of `enrichApplications` for application lists.
