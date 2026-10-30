# Attendance holiday workflow (Eid / special leave)

Company-wide off days (Eid, public holidays, special shutdown) are managed on **Holiday Calendar**, not via individual leave applications. Attendance picks them up during **Daily Process** through shift evaluation.

## Prerequisites (standalone deployment)

| Service | Requirement |
|---------|-------------|
| **LeaveService** | Running; holidays stored in `LeaveServiceDB` |
| **ShiftService** | `ConnectionStrings:LeaveDb` set (same DB as Leave). Without it, shift evaluation ignores holidays. |
| **AttendanceService** | `ExternalServices:ShiftServiceUrl` points at the Shift instance that has LeaveDb configured |

Shared connection strings: `backend/Configuration/connectionstrings.json` (loaded via `AddEnterpriseErpConnectionConfiguration`).

**Platform.Host** already registers `LeaveCalendarProvider`. Standalone **ShiftService** uses `LeaveDbCalendarProvider` when `LeaveDb` is configured.

## Operator steps (Eid example)

1. **Management → Leave → Holiday Calendar**
   - Select company and year.
   - Add date range, name e.g. `Eid-ul-Fitr 2026`, type **Religious / Festival (Eid)**, paid per policy.
2. **Management → Data Process → Daily Process**
   - Same company and date range → **Run Bulk Process**.
3. **Management → Attendance → Daily Attendance Report**
   - Filter dates → expect **Holiday** (no punch) or **HolidayPresent** (with punch).

## Verification

- Shift evaluation: `GET /api/v1/shifts/evaluation?companyId={guid}&employeeId={guid}&date=YYYY-MM-DD` → `isHoliday: true` on holiday dates.
- After process: daily row `status` = `Holiday` or `HolidayPresent`, `dayType` = `Holiday`.

## Limits

- Holidays apply to **all employees** in the company.
- Does **not** reduce leave balance (use **Leave Application** for per-employee paid/unpaid leave).
- Approved leave applications are **not** applied automatically during daily process in the current release.
- Staff working on a holiday with punches may get **HolidayPresent**; overtime follows shift rule **Holiday work all as overtime**.

## UI entry points

- Holiday Calendar: `/management/leave/holiday`
- Daily Process: `/management/data-process/daily-process` (supports `?companyId=&from=&to=` query params from holiday save)
- Daily Report: `/management/attendance/daily-report`
