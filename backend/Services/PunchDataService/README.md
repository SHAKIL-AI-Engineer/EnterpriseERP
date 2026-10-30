# PunchDataService

Go (Gin) microservice for **collecting raw punch logs** from biometric devices, imports, and manual entry. It does **not** calculate attendance — that belongs to **AttendanceService**. The service shares JWT identity with `AuthService` and publishes `erp.punch.log.collected.v1` when a new raw punch is stored.

### Business rules

- `deviceCode` is unique per company.
- Inactive devices cannot sync.
- Failed sync attempts are stored in `PunchSyncHistories`.
- Duplicate punches (same company, employee, device, time) are ignored.
- Manual punch is available to any authenticated user.
- CSV/Excel uploads create `PunchImportBatches`; invalid rows are stored in `PunchImportErrors`.
- Company filtering uses `companyId` in the request body or query (`?companyId=1`). No `X-Company-Id` header is required.
- Device sync supports manual `POST .../machines/{id}/sync` and optional background sync (`EnableBackgroundSync`).

- Language: Go (`net/http` + Gin)
- Database: SQL Server (`PunchDataDB`)
- Port: `5050`
- **PunchTime**: stored as **actual device/log wall-clock** (no timezone conversion on ingest)
- **CreatedAt / audit fields**: **Asia/Dhaka (GMT+6)** via `timeutil.Now()`
- Auth: HS256 JWT (Issuer `AuthService`, Audience `Erp.Platform`)
- Gateway route prefix: `/api/v1/punch-data`

## Endpoints

| Method | Path | Description |
| ------ | ---- | ----------- |
| GET    | `/health`                                  | Liveness + DB ping (no auth required) |
| POST   | `/api/v1/punch-data/logs/upload`           | Multipart file upload (`file`, optional `companyId`, `deviceId`, `autoProcess`). CSV or JSON. |
| POST   | `/api/v1/punch-data/logs/batch`            | JSON batch ingest (`{companyId, deviceId, source, records:[...]}`) |
| GET    | `/api/v1/punch-data/logs`                  | List uploaded log files (filters: `companyId`, `deviceId`, `status`, `page`, `pageSize`) |
| GET    | `/api/v1/punch-data/logs/:id`              | Single log file metadata |
| GET    | `/api/v1/punch-data/logs/:id/download`     | Stream the original raw payload back |
| GET    | `/api/v1/punch-data/logs/:id/records`      | Punches that came from a single log file |
| POST   | `/api/v1/punch-data/logs/:id/process`      | (Re-)process a single log file |
| POST   | `/api/v1/punch-data/process?limit=50`      | Process all `Pending` log files |
| GET    | `/api/v1/punch-data/punches`               | List processed punches (filters: `companyId`, `employeeCode`, `deviceId`, `from`, `to`, `logFileId`, `page`, `pageSize`) |
| POST   | `/api/v1/punch-data/punches/manual`        | Manual raw punch |
| GET    | `/api/v1/punch-data/imports`               | List import batch history |
| GET    | `/api/v1/punch-data/imports/:id/errors`    | Row-level import errors |
| GET    | `/api/v1/punch-data/sync-histories`        | Device sync history |
| POST   | `/api/v1/punch-data/machines`              | Create or update one ZKTeco punch machine (`deviceCode`, `deviceName`, `machineNo`, `ipAddress`, `port`) |
| POST   | `/api/v1/punch-data/machines/bulk`         | Create or update multiple punch machines |
| GET    | `/api/v1/punch-data/machines`              | List punch machines (filters: `companyId`, `status`, `isActive`, `page`, `pageSize`) |
| POST   | `/api/v1/punch-data/machines/:id/connect`  | Test LAN connectivity to the machine and update connection status |
| POST   | `/api/v1/punch-data/machines/:id/sync`     | Download ZKTeco attendance records, save a raw log, and process punches |
| POST   | `/api/v1/punch-data/remote/collect`      | **Read-only** import from public ZKTeco SQL (`CHECKINOUT` + `USERINFO`) → `PunchRecords` (deduped; does not write to remote DB) |
| GET    | `/api/v1/punch-data/remote/collect/preview` | Count remote rows in a time window (no import) |
| GET    | `/api/v1/punch-data/remote/collect/histories` | Remote collect run history |

Configure `ConnectionStrings.RemoteZktecoDb` in `Configuration/connectionstrings.json` (local: `SHAKIL\SQLEXPRESS` / database `zkteco`, Windows auth or `sa` with `TrustServerCertificate=True`).

### Remote collect (2+ months)

`POST /remote/collect` **pages through the full `from`–`to` window** automatically (500 rows per remote page by default, up to `MaxRowsPerCollect` 200000 per call). Default lookback when `from` is omitted: **62 days** (`DefaultLookbackDays`).

**Full May example:**

```json
{
  "companyId": 1,
  "from": "2026-05-01T00:00:00+06:00",
  "to": "2026-05-31T23:59:59+06:00",
  "useWatermark": false
}
```

**Last ~2 months (no dates):**

```json
{
  "companyId": 1,
  "useWatermark": false
}
```

Response includes `pages`, `remoteRows`, `inserted`, `duplicates`, `skippedNoBadge`, `unmappedRemote`.

### ZKTeco employee mapping (BADGENUMBER → EmployeeCode)

Remote collect resolves identity as:

`CHECKINOUT.USERID` → `USERINFO.USERID` → `USERINFO.BADGENUMBER` → `PunchRecords.EmployeeCode` → `Employees.EmployeeCode` (HR).

ERP `EmployeeCode` must match ZKTeco `BADGENUMBER` (e.g. badge `38` → `EmployeeCode` `38`). `CHECKINOUT.USERID` is **not** stored as `EmployeeCode`.

Validation and cleanup scripts: [`scripts/validate-zkteco-hr-employee-codes.sql`](scripts/validate-zkteco-hr-employee-codes.sql), [`scripts/cleanup-zkteco-remote-punchrecords.sql`](scripts/cleanup-zkteco-remote-punchrecords.sql).

All authenticated endpoints expect `Authorization: Bearer <token>` from AuthService. Pass `companyId` in the JSON body (create/upload) or query string (lists/filters) when needed.

All authenticated routes only require a valid JWT bearer token (no permission claims required).

## Accepted payload formats

### CSV (file upload)

Header is case-insensitive; underscores are stripped. Required: `employeeCode`, `punchTime`. Optional: `deviceId`, `source`, `companyId`.

```csv
employeeCode,deviceId,punchTime,source
EMP-0001,DEV-01,2026-05-13T08:00:15Z,ZKTeco
EMP-0001,DEV-01,2026-05-13T17:02:40,ZKTeco
```

### JSON (file upload or `/logs/batch`)

```json
{
  "companyId": 1,
  "deviceId": "DEV-01",
  "source": "ZKTeco",
  "records": [
    { "employeeCode": "EMP-0001", "punchTime": "2026-05-13T08:00:15Z" },
    { "employeeCode": "EMP-0001", "punchTime": "2026-05-13T17:02:40Z" }
  ]
}
```

A bare array (`[ {...}, {...} ]`) is also accepted.

## ZKTeco machine sync

Create machines individually or in bulk. `companyId` is required because synced punch rows are written directly into the normal punch pipeline for that company.

```json
{
  "machines": [
    { "companyId": 1, "deviceName": "1", "machineNo": 101, "ipAddress": "192.168.88.224", "port": 4370, "productName": "F18", "serialNumber": "BAY5234201212", "password": 0 },
    { "companyId": 1, "deviceName": "2", "machineNo": 102, "ipAddress": "192.168.88.223", "port": 4370, "productName": "F18", "serialNumber": "BAY5252900155", "password": 0 },
    { "companyId": 1, "deviceName": "3", "machineNo": 103, "ipAddress": "192.168.88.225", "port": 4370, "productName": "F18", "serialNumber": "BAY5252900126", "password": 0 },
    { "companyId": 1, "deviceName": "4", "machineNo": 104, "ipAddress": "192.168.88.227", "port": 4370, "productName": "F18/ID", "serialNumber": "CGT9214760112", "password": 0 },
    { "companyId": 1, "deviceName": "5", "machineNo": 105, "ipAddress": "192.168.88.245", "port": 4370, "productName": "F18/ID", "serialNumber": "CQQC225261297", "password": 0 },
    { "companyId": 1, "deviceName": "6", "machineNo": 106, "ipAddress": "192.168.88.230", "port": 4370, "productName": "F18/ID", "serialNumber": "AIOR205160196", "password": 0 },
    { "companyId": 1, "deviceName": "7", "machineNo": 107, "ipAddress": "192.168.88.246", "port": 4370, "productName": "F18/ID", "serialNumber": "AIOR210460094", "password": 0 }
  ]
}
```

After saving a machine, call `POST /api/v1/punch-data/machines/{id}/connect` to test the device, then `POST /api/v1/punch-data/machines/{id}/sync` to download attendance events. The sync endpoint stores a `PunchLogFile` with source type `ZKTecoSync`, then processes it into `PunchRecords`; the imported rows can be read with `/api/v1/punch-data/punches?deviceId=101`.

In/out times for attendance are inferred from punch times (first = in, last = out when multiple punches per day). `PunchRecords` does not store a direction column.

### Timestamps

**PunchTime** (ingest): RFC3339, `2006-01-02T15:04:05`, `2006-01-02 15:04:05`, `02/01/2006 15:04:05`, `01/02/2006 15:04:05`, `2006/01/02 15:04:05`, unix seconds, unix milliseconds. Values are stored as the **wall-clock face value** from the log (not shifted to Dhaka).

**CreatedAt** (audit): `Asia/Dhaka` (+06:00) when the row is saved in ERP.

After changing punch time rules, **re-import** punches (see `docs/punch-data-reimport.md`).

## Configuration

Reads `appsettings.json` and overlays `appsettings.<ASPNETCORE_ENVIRONMENT>.json` (defaults to `Development`). Environment overrides:

| Env var | Path |
| ------- | ---- |
| `PUNCHDATA_SERVER_ADDRESS`   | `Server.Address` (e.g. `:5050`) |
| `PUNCHDATA_CONNECTIONSTRING` | `ConnectionStrings.PunchDataDb` |
| `PUNCHDATA_JWT_SIGNINGKEY`   | `Jwt.SigningKey` |
| `PUNCHDATA_JWT_ISSUER`       | `Jwt.Issuer` |
| `PUNCHDATA_JWT_AUDIENCE`     | `Jwt.Audience` |

The SQL Server connection string accepts the standard ADO style (same shape as the other .NET service settings).

## Run locally

```powershell
cd Services/PunchDataService
go mod tidy
go run ./cmd/server
```

The service auto-migrates `PunchLogFiles` and `PunchRecords` on startup.

## Swagger UI

OpenAPI/Swagger 2.0 documentation is generated with [`swaggo/swag`](https://github.com/swaggo/swag) and served by the running service.

- Direct: `http://localhost:5050/swagger/index.html`
- Spec JSON: `http://localhost:5050/swagger/doc.json`
- Through the API Gateway: `http://localhost:5000/api/v1/punch-data/swagger/index.html`
- A request to `/` redirects to the swagger UI for convenience.

The Swagger spec lives in `internal/docs/` and is **generated** — regenerate it whenever you change a handler annotation:

```powershell
# Install the CLI once (puts swag.exe in $env:USERPROFILE\go\bin)
go install github.com/swaggo/swag/cmd/swag@latest

# Regenerate the spec
swag init -g cmd/server/main.go --output internal/docs --parseDependency --parseInternal --parseDepth 2
```

To call protected endpoints from the Swagger UI, click **Authorize** and paste the access token returned by `POST /api/v1/auth/login` on AuthService (e.g. `Bearer eyJhbGciOi...`).

## Docker

```powershell
docker build -t enterprise-erp/punchdata Services/PunchDataService
docker run --rm -p 5050:5050 \
  -e PUNCHDATA_CONNECTIONSTRING="Server=host.docker.internal,1433;Database=PunchDataDB;User Id=sa;Password=...;TrustServerCertificate=True" \
  -e PUNCHDATA_JWT_SIGNINGKEY="..." \
  enterprise-erp/punchdata
```
