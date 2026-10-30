# API design

## Versioning

Public HTTP APIs use the prefix **`/api/v1/`** followed by a **service scope** segment (for example `/api/v1/hr/employees`). The gateway forwards the full path unless a cluster is configured with path transforms.

## Responses

Services should return a consistent envelope modeled after **AuthService** and **Erp.BuildingBlocks.CommonResponses** (`ApiResponse<T>` with success flag, data, and structured errors).

## Pagination and querying

List endpoints accept a constrained query object (see **Erp.BuildingBlocks.Contracts** `PagedRequest` and `PagedResult`) with:

- Page index / page size (or cursor for very large sets).
- Explicit filter and sort fields — avoid unbounded dynamic LINQ/SQL from raw client strings.

## Errors

Map domain failures to stable **error codes** suitable for web and mobile clients; use HTTP status codes consistently (400 validation, 401/403 authz, 404 not found, 409 conflict).

## Idempotency

For imports and financial writes, support an **`Idempotency-Key`** header and store completed responses keyed by tenant and key until TTL expires.

## OpenAPI

Each service exposes Swagger in Development; optional aggregated OpenAPI at the gateway can be added later.

## Auth headers

Clients send **`Authorization: Bearer <access_token>`**. Active branch may be supplied via **`X-Branch-Id`** (or resolved server-side from Auth using cached **UserBranchAccess**).
