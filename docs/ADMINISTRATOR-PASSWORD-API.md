# Administrator user password changes

In **Administrator → Users**, open a user's Actions menu and select **Change Password**. Login History remains available with its icon removed. The dialog requires the acting administrator's current password, a new password and confirmation. It displays validation/API errors inline and the API success message after saving. Changing your own password signs you out.

## Endpoint

`PUT /api/v1/users/{userId}/password`

Requires an authenticated `Admin` or `SuperAdmin` with `auth.users.write`. Use the normal bearer token and company header. The current password belongs to the acting administrator, not the target user.

```json
{
  "currentPassword": "<acting-administrator-password>",
  "newPassword": "<new-user-password>",
  "confirmPassword": "<new-user-password>"
}
```

New passwords must contain 10–128 characters, uppercase and lowercase letters, and a number. Confirmation must match. The user's existing password cannot be reused. Incorrect administrator confirmations count toward the existing account lockout policy.

Successful response (HTTP 200):

```json
{
  "success": true,
  "traceId": "<request-trace-id>",
  "data": {
    "userId": "<target-user-guid>",
    "changed": true,
    "requiresSignIn": true,
    "message": "Password changed successfully. The user must sign in again on all devices."
  }
}
```

Validation error example (HTTP 400):

```json
{
  "success": false,
  "traceId": "<request-trace-id>",
  "data": null,
  "errors": [
    {
      "code": "PASSWORD_MISMATCH",
      "message": "New password and confirmation do not match."
    }
  ]
}
```

Other responses include HTTP 401 for missing/invalid sessions or a locked acting administrator; HTTP 403 for insufficient authority/company access; and HTTP 404 for unknown or deleted target users. Policy/exception responses use the application's existing error handling; validation and successful password changes use the envelopes above.

## Security and persistence

- Identity validates and hashes the password. Reset tokens are generated and consumed internally; passwords, hashes and reset tokens are never returned.
- The target user's password hash, security stamp, modification time and modifying administrator are saved. Existing access and refresh sessions are invalidated, including Go services using live session checks.
- Ordinary users cannot use this administrative endpoint. Non-SuperAdmins cannot reset another administrator or accounts with permissions or company access beyond their own.
- Changing a pending/inactive user's password does not approve or activate the account.
- The existing request audit records the actor, target URL, time and outcome without logging request bodies or passwords.
- Frontend adapter: `authService.changeUserPassword(userId, { currentPassword, newPassword, confirmPassword })`. Existing self-service `authService.changePassword` remains available in Settings.

## Verification

The AuthService regression suite checks real Identity password validation/reset and password-change session revocation using an isolated in-memory database. Runtime checks use temporary accounts that are soft-deleted afterwards; existing account passwords remain unchanged.

Verified on 2026-10-30: backend build (zero warnings/errors), frontend type check, both production Docker builds, 6 passing AuthService tests and 37 passing live API checks. Browser verification confirmed the icon-free Login History item and the three-field Change Password dialog.
