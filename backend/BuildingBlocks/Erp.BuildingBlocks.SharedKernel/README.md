# Shared kernel

## BusinessTime (audit timestamps)

Use `BusinessTime` for **CreatedAt**, **UpdatedAt**, and other ERP audit fields across services:

- `BusinessTime.NowOffset` — `DateTimeOffset` with **Asia/Dhaka (+06:00)**
- `BusinessTime.Now` — `DateTime` wall-clock in Dhaka (Unspecified kind)
- `BusinessTime.UtcNow` / `UtcNowOffset` — only for JWT expiry, token validity, and wire protocols that require UTC

**Do not** use `BusinessTime` for biometric punch log times; those are stored as actual device wall-clock in PunchDataService.
