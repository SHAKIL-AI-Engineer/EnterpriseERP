# Enterprise ERP — Microservices Platform

This folder hosts the **platform skeleton** for migrating [HrHub_backend](../HrHub_backend) to microservices.

## Contents

| Path | Description |
|------|-------------|
| `BuildingBlocks/` | Shared kernel, API envelopes, pagination DTOs, integration event abstractions |
| `ApiGateway/Gateway.Api` | **YARP** reverse proxy: `/api/v1/auth/*` → Auth service; all other paths → legacy monolith |
| `Services/` | Individual microservice solutions (**AuthService**, CompanyService, BranchService, HRService, …) |
| `docs/` | Architecture and deployment documentation |
| `docker-compose.yml` | **Redis**, **RabbitMQ**, **Seq**, optional **Gateway** container |

## Ports (development)

| Component | URL |
|-----------|-----|
| Gateway | http://localhost:5000 |
| Legacy monolith | http://127.0.0.1:5011 |
| AuthService | http://127.0.0.1:5012 |
| Redis | localhost:6379 |
| RabbitMQ AMQP | localhost:5672 (management UI :15672, user `erp` / `erp_dev_password`) |
| Seq | http://localhost:5341 |

## Quick start

1. Start SQL Server (for services that need it), legacy API, and Auth API as today.
2. Auth API: `dotnet run --project Services/AuthService/AuthService.Api/AuthService.Api.csproj` (from this folder), or `docker compose -f Services/AuthService/docker-compose.auth.yml up --build`.
3. Infra: `docker compose up -d redis rabbitmq seq`
4. Gateway: `dotnet run --project ApiGateway/Gateway.Api/Gateway.Api.csproj`

Override upstream URLs via environment variables `ReverseProxy__Clusters__*` if needed.

## Solution file

Build the whole platform tree:

```powershell
dotnet build EnterpriseERP.slnx
```
