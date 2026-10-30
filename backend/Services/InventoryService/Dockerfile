FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build

WORKDIR /src
COPY . .
RUN dotnet publish Services/InventoryService/InventoryService.API/InventoryService.API.csproj -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:10.0

WORKDIR /app
COPY --from=build /app/publish .

EXPOSE 5041
ENTRYPOINT ["dotnet", "InventoryService.API.dll"]
