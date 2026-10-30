# Start shared infrastructure (Redis, RabbitMQ, Seq) from EnterpriseERP root.
# Usage (repo root containing EnterpriseERP/):
#   pwsh -File EnterpriseERP/Infrastructure/Scripts/local-dev-compose.ps1

$ErrorActionPreference = "Stop"
$ErpRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
Set-Location $ErpRoot
docker compose up -d redis rabbitmq seq
