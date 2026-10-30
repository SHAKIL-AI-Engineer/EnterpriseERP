# Punch data re-import after timezone change

Punch times are now stored as **actual device/log wall-clock** values. Audit fields (`CreatedAt`, etc.) use **Asia/Dhaka (+06:00)** via `BusinessTime` in .NET and `timeutil.Now()` in PunchDataService.

After deploying the timezone refactor, re-import punches so `PunchRecords.PunchTime` is consistent.

## 1. Backup

```sql
BACKUP DATABASE PunchDataDB TO DISK = 'D:\backups\PunchDataDB_before_reimport.bak';
```

## 2. Clear normalized data (per company or full)

```sql
-- Optional: scope by company
-- DELETE FROM PunchRecords WHERE CompanyId = 1;

DELETE FROM PunchRecords;

-- Optional: reset import metadata
DELETE FROM PunchImportErrors;
DELETE FROM RemoteCollectHistories;
-- DELETE FROM PunchLogFiles;  -- only if you will re-upload/sync all sources
```

See also [`scripts/cleanup-zkteco-remote-punchrecords.sql`](../scripts/cleanup-zkteco-remote-punchrecords.sql).

## 3. Re-import punches

### Remote ZKTeco SQL

```http
POST /api/v1/punch-data/remote/collect
Authorization: Bearer <token>
Content-Type: application/json

{
  "companyId": 1,
  "from": "2026-05-01T00:00:00",
  "to": "2026-05-31T23:59:59",
  "useWatermark": false
}
```

Date strings use **wall-clock** bounds (no `+06:00` shift on stored `PunchTime`).

### ZKTeco machines (LAN)

For each machine: `POST /api/v1/punch-data/machines/{id}/sync`

### CSV / JSON upload

`POST /api/v1/punch-data/logs/upload` with punch times as recorded on the device.

## 4. Re-process attendance

For each affected calendar day and company:

```http
POST /api/v1/attendance/process-daily
```

(or your gateway route for `ProcessDailyAttendance`).

Verify `InTime` / `OutTime` match first and last punch for sample employees.

## 5. Verify

- One punch in DB: `PunchTime` matches the biometric device screen time.
- `CreatedAt` on the same row shows ERP save time in +06:00 (audit).
- Attendance late/OT unchanged for the same shift policy when punches are unchanged on the device.
