# HR Hub ↔ HR Service API map

Gateway base: `http://localhost:5000/api/v1` → HR Service (`5035`).

## Employees (`/hr/Employees`)

| Method | Route | HR Hub usage |
|--------|-------|----------------|
| GET | `/` | Employee list, status page, shared pickers |
| GET | `/manpower` | Manpower list |
| GET | `/manpower/summary` | Manpower summary |
| GET | `/transfers` | Migration & transfer |
| GET | `/{id}` | Detail, edit load |
| GET | `/{id}/status-history` | History tab |
| GET | `/{id}/transfers` | History tab |
| POST | `/` | Create, Excel import (via ImportExport) |
| PUT | `/{id}` | Edit personal fields |
| DELETE | `/{id}` | List delete |
| POST | `/{id}/transfer` | Transfer sheet, migration page |
| POST | `/{id}/status` | Status sheet, employee status page |
| POST | `/{id}/salary` | Edit when salary changes |
| POST/PUT/DELETE | `/addresses/*` | Create/edit sync |
| POST/PUT/DELETE | `/bank-accounts/*` | Create/edit sync |
| POST/PUT/DELETE | `/emergency-contacts/*` | Create/edit sync |
| POST/DELETE | `/documents/*` | Detail documents tab |

## Manpower requirements (`/hr/ManpowerRequirements`)

Full CRUD on manpower-requirement page.

## Dashboard (`/dashboard/*`)

Proxied to HR cluster. Used by Management → Analytics.

## Create flow

```
POST /hr/Employees (core + job + salary)
  → POST /addresses (Present, Permanent)
  → POST /bank-accounts (optional)
  → POST /emergency-contacts (optional)
```

## Import flow (ImportExport)

`preview` → `confirm` → ImportExport calls `POST /hr/Employees` per row only (no addresses/bank).

## UI fields not in HR API

Removed from forms: religion, blood group, line/shift/group/floor, family block, profile/signature images, OT flag.
