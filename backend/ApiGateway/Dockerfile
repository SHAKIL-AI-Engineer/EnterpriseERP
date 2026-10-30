FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY ApiGateway/Gateway.Api/Gateway.Api.csproj ApiGateway/Gateway.Api/
COPY BuildingBlocks/Erp.BuildingBlocks.Hosting/Erp.BuildingBlocks.Hosting.csproj BuildingBlocks/Erp.BuildingBlocks.Hosting/
RUN dotnet restore ApiGateway/Gateway.Api/Gateway.Api.csproj
COPY ApiGateway/Gateway.Api/ ApiGateway/Gateway.Api/
COPY BuildingBlocks/Erp.BuildingBlocks.Hosting/ BuildingBlocks/Erp.BuildingBlocks.Hosting/
WORKDIR /src/ApiGateway/Gateway.Api
RUN dotnet publish -c Release -o /app/publish --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080
COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "Gateway.Api.dll"]
