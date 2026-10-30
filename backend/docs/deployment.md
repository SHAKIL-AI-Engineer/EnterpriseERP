# Deployment and local development

## Prerequisites

- [.NET 10 SDK](https://dotnet.microsoft.com/download)
- Docker Desktop (optional, for Redis/RabbitMQ/Seq and gateway container)
- SQL Server (local or Docker) for Auth, Company, Branch, HR, and legacy monolith

## Start infrastructure

From `EnterpriseERP/`:

```bash
docker compose up -d redis rabbitmq seq
```

## Run services on the host (typical dev)

Start processes in separate terminals (ports must match `Gateway.Api/appsettings.json`):

1. **HrHub_backend** — port **5011**
2. **AuthService.Api** — port **5012**
3. **CompanyService.Api** — **5020**
4. **BranchService.Api** — **5021**
5. **HRService.Api** — **5035**
6. **Microservice shells** (optional) — **5036–5049** (`dotnet run` per project under `Services/MicroserviceShells/`)
7. **Gateway.Api** — **5000**

```bash
cd EnterpriseERP/ApiGateway/Gateway.Api
dotnet run
```

## Gateway in Docker

```bash
cd EnterpriseERP
docker compose --profile gateway-docker up -d --build gateway
```

Environment variables in `docker-compose.yml` override cluster addresses to `http://host.docker.internal:<port>/` for each upstream. Ensure all host services are listening on `0.0.0.0` or localhost as appropriate for your OS.

## Migrations (per service)

Examples (adjust connection strings):

```bash
dotnet ef database update --project EnterpriseERP/Services/AuthService/AuthService.Infrastructure --startup-project EnterpriseERP/Services/AuthService/AuthService.Api
dotnet ef database update --project EnterpriseERP/Services/CompanyService/CompanyService.Infrastructure --startup-project EnterpriseERP/Services/CompanyService/CompanyService.Api
dotnet ef database update --project EnterpriseERP/Services/BranchService/BranchService.Infrastructure --startup-project EnterpriseERP/Services/BranchService/BranchService.Api
dotnet ef database update --project EnterpriseERP/Services/HRService/HRService.Infrastructure --startup-project EnterpriseERP/Services/HRService/HRService.Api
```

CI should run `dotnet build`, **tests**, and either `dotnet ef migrations bundle` or scripted updates per environment.

## Observability

Structured logs (Serilog) should include a **correlation id** propagated from the gateway. Seq is exposed on **5341** when using the provided compose file.

## Production sketch

- TLS termination at **Nginx** (or cloud load balancer) → YARP gateway → internal HTTP to services.
- Secrets from a vault; contained SQL users per database; least privilege.
- Redis for permission cache and rate limiting; RabbitMQ for integration events.
