# Pagination standard (Enterprise ERP)

Shared pagination for list GET APIs and `hrhub` DataTable (server mode).

## Query parameters

| Parameter | Default | Notes |
|-----------|---------|--------|
| `page` | `1` | 1-based |
| `pageSize` | `50` | Allowed: `10`, `20`, `50`, `100` |
| `getAll` | `false` | When `true`, return all rows; still send `pageSize=50` for metadata |
| `sortBy` | (entity default) | Whitelisted per endpoint |
| `sortOrder` | `desc` | `asc` or `desc` |
| `search` | — | Free-text search where supported |

### “All” rows (UI)

Frontend sends:

```http
GET /api/v1/hr/Employees?page=1&pageSize=50&getAll=true
```

Backend returns every matching row in `data`, but `pagination.pageSize` stays `50` and `totalPages = ceil(totalCount / 50)`.

## Response envelope

```json
{
  "success": true,
  "message": "Data loaded successfully",
  "data": [],
  "pagination": {
    "page": 1,
    "pageSize": 50,
    "totalCount": 0,
    "totalPages": 0,
    "hasNextPage": false,
    "hasPreviousPage": false,
    "getAll": false
  },
  "traceId": "..."
}
```

Use `PaginatedApiResponse<T>` and `PaginationMetadata` from building blocks.

## Backend implementation

1. Extend query DTO from `PagedRequest` (`Erp.BuildingBlocks.Contracts.Pagination`).
2. Apply filters, then `CountAsync`, then sort.
3. `await query.ToPaginatedListAsync(request, cancellationToken)` **or** manual skip/take when projection is complex (see manpower list).
4. Return `PaginatedApiResponse<T>.Ok(data, pagination, message, traceId)`.

### Calculation (reference)

```csharp
request.Normalize();
var totalCount = await query.CountAsync(ct);
var data = request.GetAll
    ? await query.ToListAsync(ct)
    : await query.Skip((request.Page - 1) * request.PageSize).Take(request.PageSize).ToListAsync(ct);
var pagination = PaginationMetadata.Create(request.Page, request.PageSize, totalCount, request.GetAll);
```

## Frontend

- `lib/pagination/` — `buildPaginationParams`, `unwrapPaginatedApiData`, `toLegacyPagedResult`
- `hooks/use-server-data-table.ts` — page index, page size, getAll, sorting
- `DataTable` — rows `10 | 20 | 50 | 100 | All`, `paginationMode="server"`

## Pilot endpoints (migrated)

- `GET /api/v1/hr/Employees`
- `GET /api/v1/hr/Employees/manpower`

## Pilot endpoints (leave)

- `GET /api/v1/leaves/applications` (enriched list items)
- `GET /api/v1/holidays`
- `GET /api/v1/leave-encashments`

## Migration checklist (remaining)

- [ ] `GET /api/v1/companies`
- [ ] `GET /api/v1/shifts/...` (temporary assignments list)
- [ ] `GET /api/v1/hr/manpower-requirements`
- [ ] Go ImportExport list routes (separate doc if needed)

Legacy `ApiResponse<PagedResult<T>>` (`data.items`) remains on unmigrated endpoints until updated.
