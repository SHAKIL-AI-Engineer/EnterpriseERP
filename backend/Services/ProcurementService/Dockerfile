FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build

WORKDIR /src
COPY . .
RUN dotnet publish Services/ProcurementService/ProcurementService.API/ProcurementService.API.csproj -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:10.0

WORKDIR /app
COPY --from=build /app/publish .

EXPOSE 5060
ENTRYPOINT ["dotnet", "ProcurementService.API.dll"]
