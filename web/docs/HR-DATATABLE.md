# HR list pages — DataTable pattern

## Layout shell

Use shared components under `hrhub/components/hr/`:

| Component | Use |
|-----------|-----|
| `HrPageShell` | Page background and padding |
| `HrPageHeader` | Icon, title, description, action buttons |
| `HrFilterCard` + `HrFilterField` | Filter grid with Apply / Reset and record count |
| `HrTableCard` | Card wrapper around `DataTable` (no full-page spinner — pass `isLoading` to `DataTable` for row skeletons) |
| `HrIdLink` / `HrNameLink` / `HrCellText` | Dark-mode-safe table text (see `THEME.md`) |

## Pagination

- **Server lists** (employees, manpower, transfers): `useServerDataTable`, `paginationMode="server"`, `buildPaginationParams`, default page size **50**, Rows **All** uses `getAll=true` with client-side 50-row pages.
- **Client lists** (requirements, separations picker, summary tables): `paginationMode="client"`; same `DataTable` footer (10 / 20 / 50 / 100 / All).

## API

- Prefer `PaginatedApiResponse` (`data` + `pagination`) and `unwrapPaginatedApiData` in services.
- Transfer rows use `employeeEntityId` (Guid) and `employeeCode` (business id) — not duplicate `employeeId` JSON keys.

## Checklist for new HR list pages

1. Wrap in `HrPageShell`.
2. `HrPageHeader` with actions.
3. Optional stats row above filters.
4. `HrFilterCard` when filters exist.
5. `HrTableCard` + `DataTable` with consistent column cell classes (`text-foreground`, links via `HrNameLink`).
