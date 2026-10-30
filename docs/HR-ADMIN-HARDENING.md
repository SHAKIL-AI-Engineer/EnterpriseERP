# HR and Administrator implementation notes

Completed and verified locally on 28 October 2026 (Asia/Dhaka).

## Start and sign in

The canonical development stack is running at http://localhost:5173 with the gateway at http://localhost:5000.

From `backend`, use `docker compose --profile gateway-docker up -d --build` to rebuild and start it.

The existing SuperAdmin development password was rotated. The username is `superadmin`; retrieve the generated password from **`backend/.env`, `ERP_SEED_SUPERADMIN_PASSWORD`**. Its value is deliberately absent from this document and verification evidence. The old password and previously issued sessions were rejected in live checks.

The JWT signing key is also generated locally in `.env`. Git ignores this file and the Docker build context excludes it. Do not copy real values into `.env.example`, source control, issue reports or screenshots. Set unique values before creating a fresh environment; the application no longer supplies a built-in administrator password.

## Account management and approval

- **Administrator → Users → Add User** uses a dedicated administrator endpoint, independent of public self-registration. It creates an inactive, pending account and stores its requested roles and companies atomically.
- **Administrator → Approvals** now reviews user accounts. Merchandising approvals remain available through their separate link.
- Approval applies the requested roles and companies and activates the account in one transaction. Rejection requires a reason. Decisions record requester, reviewer and server timestamps, and repeated decisions are rejected.
- Pending and rejected accounts cannot bypass review through the generic profile or status endpoints.
- Normal requests require a different reviewer. To establish the **first Admin reviewer** when no other active Admin/SuperAdmin exists, SuperAdmin may use the explicit first-reviewer control on an Admin-only request. It requires the current password and an explanation. This exception cannot activate a SuperAdmin request.
- Administrators cannot grant roles beyond their authority or manage SuperAdmin accounts. Only SuperAdmin can edit role definitions/permissions. Recovery SuperAdmin accounts cannot be removed through generic user-administration actions.
- User editing now persists name and email as well as status. Deletion disables and soft-deletes the account, retains its history and revokes access. Role user-counts exclude deleted accounts.

New endpoints include `POST /api/v1/users`, `PATCH /api/v1/users/{id}`, `DELETE /api/v1/users/{id}`, `GET /api/v1/administrator/account-approvals`, and `POST /api/v1/administrator/account-approvals/{id}/decision`.

## API security

- Platform.Host requires authentication by default. Intended login, refresh, two-factor challenge and health endpoints are explicitly public.
- HR, payroll, attendance, leave and shifts have server-side feature permission checks in addition to existing domain policies. Missing a page-level check does not make an API public.
- Company filters and change validation cover HR, attendance, payroll, leave, shift and merchandising database contexts. Employee-owned child records are filtered through their owner. Writes reject related records outside the active company; incoming company and employee references are also checked at the API boundary.
- Access tokens carry a session stamp checked against the live account. Status, password, deletion, company access, role membership and role-permission changes invalidate the affected sessions. Routine sign-in/profile updates do not revoke otherwise valid sessions. Access tokens are short-lived and refresh sessions are revoked on access changes.
- Go punch-data/import-export services and standalone merchandising verify the current session with the authoritative authentication service. Verification fails closed when the account is revoked or the authority is unavailable.
- Punch-data checks actual company GUID membership before mapping to its legacy numeric company IDs. Mappings must be unique; ambiguous mappings are denied. The current single-company mapping is configured in `.env` as `ERP_PUNCH_COMPANY_MAP_JSON`.
- Import/export separates read, import and export access. A Viewer role alone no longer authorizes writes. Address imports require SuperAdmin.
- Approval actors come from the signed-in identity rather than the submitted user ID. Leave and merchandising check assigned/current steps; payroll review endpoints reject repeated decisions. Existing state fields also provide concurrency checks.
- Salary advances reject zero/negative installments and unbounded repayment schedules, preventing endless installment calculations.
- Database conflict responses no longer disclose raw database exception details. The client shows actual server validation messages. Forced logout no longer blocks a subsequent explicit login.

## Completed HR pages and services

- Movement register: stored departures/returns linked to an employee and company; one open movement per employee.
- Lifecycle: stored onboarding, review or offboarding tasks linked to an employee, with completion timestamps and actors.
- Salary information: actual employee payroll salary assignments and effective-date history, with a working assignment form.
- Salary grades: create, edit and deactivate salary structures and components. Historical records are retained. Component validation rejects invalid amounts, unknown/circular percentage references and duplicate codes.
- Monthly processing uses the existing live payroll-processing page instead of a timer that reported simulated success.
- Job-card list uses the real job-card workflow. Continuous attendance status uses the real absenteeism report. Monthly reports link to actual attendance/payroll reports rather than fabricated totals.
- Daily summary no longer generates random chart series.

The movement and lifecycle APIs are under `/api/v1/hr/operations`; salary structure editing/deactivation uses `PUT`/`DELETE /api/v1/salary-structures/{id}`. The new HR operational tables are initialized idempotently in the HR database. Account approval has an EF migration plus an idempotent initializer for the existing Docker mode that skips broad service migrations.

## Backups and uploaded files

Administrator database pages now create real SQL Server backups with checksums and verification. History records the selected database, server file path and result. These are server-side backup files, not simulated browser downloads.

Restore requires SuperAdmin, current-password confirmation, an exact database-name confirmation and an application-recorded backup. Authentication database restoration is deliberately reserved for offline maintenance. SQL Server must have permission to access its backup directory.

**A real HR backup was created and verified. A live database restore was not executed.** Incorrect-password restoration was rejected before data could change. Schedule maintenance and test restoration in an isolated database before relying on it operationally.

Uploads use the named Docker volume `platform-uploads` mounted at `/app/uploads`, so future container rebuilds retain them.

The vulnerable ImageSharp dependency was replaced with SkiaSharp, retaining image resizing, orientation and WebP output and adding bounded input/pixel sizes. Both Windows tests and an actual Docker upload/removal passed. Cryptography resolves to 10.0.14; the running .NET hosts use the 10.0.14 shared frameworks.

Package references: [SkiaSharp](https://www.nuget.org/packages/SkiaSharp), [System.Security.Cryptography.Pkcs](https://www.nuget.org/packages/System.Security.Cryptography.Pkcs).

## Verification and limits

- 63 .NET tests passed across HR, payroll, leave, shift and authentication. New tests cover company isolation, owned records, invalid/repeated advance approvals, image handling and session revocation versus routine updates.
- Full Go test suites passed for punch-data and import/export, including session and company-scope checks.
- Backend build and frontend type check passed. Production Docker builds completed; all 17 stack containers are running.
- 112 static Management/Administrator routes returned HTTP 200 with authenticated route smoke checks. Browser checks verified sign-in, the user approval page, salary structures and its form. HTTP route coverage does not claim every business action was executed.
- 62 controlled live checks passed, including all 13 previously anonymous routes rejecting unauthenticated access, account approval/rejection, privilege escalation denial, immediate token revocation, Docker image encoding, salary-structure CRUD and a real backup/verification.
- Separate credential checks confirmed password change, rejection of the old password/session, and successful sign-in with the saved generated password.
- Temporary account fixtures were retired. Salary-structure fixtures were deactivated so audit/history is retained. Verification did not run a real payroll period, restore a database or reset existing business data.

Evidence files are in the local chat artifacts directory and contain no passwords or access tokens. This work addresses the audited HR/Administrator paths; it is not a claim that every unrelated ERP module or deployment configuration has passed a penetration test.
