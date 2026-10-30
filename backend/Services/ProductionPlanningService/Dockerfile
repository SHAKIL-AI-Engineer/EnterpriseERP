FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build

WORKDIR /src
COPY . .
RUN dotnet publish Services/ProductionPlanningService/ProductionPlanningService.API/ProductionPlanningService.API.csproj -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:10.0

WORKDIR /app
COPY --from=build /app/publish .

EXPOSE 5043
ENTRYPOINT ["dotnet", "ProductionPlanningService.API.dll"]
