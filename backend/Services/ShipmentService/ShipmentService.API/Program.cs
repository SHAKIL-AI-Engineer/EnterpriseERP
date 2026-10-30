using System.Text;
using Asp.Versioning;
using Erp.BuildingBlocks.CommonSecurity;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using ShipmentService.Application;
using ShipmentService.Domain;
using ShipmentService.Infrastructure;
using ShipmentService.Infrastructure.Persistence;
using Serilog;

var builder = WebApplication.CreateBuilder(args);
builder.Host.UseSerilog((_, cfg) => cfg.WriteTo.Console());
builder.Services.AddShipmentApplication();
builder.Services.AddShipmentInfrastructure(builder.Configuration);
builder.Services.AddControllers();
builder.Services.AddApiVersioning(o => { o.DefaultApiVersion = new ApiVersion(1, 0); o.AssumeDefaultVersionWhenUnspecified = true; })
    .AddApiExplorer(o => { o.GroupNameFormat = "'v'V"; o.SubstituteApiVersionInUrl = true; });
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c => c.SwaggerDoc("v1", new OpenApiInfo { Title = "ERP Shipment Service", Version = "v1" }));

var jwtKey = builder.Configuration["Jwt:SigningKey"] ?? "dev_signing_key_at_least_32_chars_long";
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme).AddJwtBearer(o =>
{
    o.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true, ValidateAudience = true, ValidateLifetime = true, ValidateIssuerSigningKey = true,
        ValidIssuer = builder.Configuration["Jwt:Issuer"] ?? "erp_auth_service",
        ValidAudience = builder.Configuration["Jwt:Audience"] ?? "erp_platform",
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
    };
});
const string Admin = "Admin";
const string Production = "Production";

builder.Services.AddAuthorization(options =>
{
    options.AddPolicy(ShipmentPermissions.ExecutionManage, p => p.RequireRole(ShipmentRoles.SuperAdmin, ShipmentRoles.CompanyAdmin, Admin, ShipmentRoles.ShipmentManager, Production, "ProductionManager"));
    options.AddPolicy(ShipmentPermissions.ReportView, p => p.RequireRole(ShipmentRoles.SuperAdmin, ShipmentRoles.CompanyAdmin, Admin, ShipmentRoles.ShipmentManager, Production, "ProductionManager", ShipmentRoles.Viewer));
});
builder.Services.AddEnterpriseTenantSecurity(builder.Configuration);
builder.Services.AddScoped<ITenantCompanyAccessResolver, AuthDbTenantCompanyAccessResolver>();
builder.Services.AddHealthChecks().AddDbContextCheck<ShipmentDbContext>("shipment-db");
builder.Services.AddCors(o => o.AddPolicy("default", p => p.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod()));

var app = builder.Build();
app.UseSwagger();
app.UseSwaggerUI();
app.UseCors("default");
app.UseAuthentication();
app.UseEnterpriseTenantSecurity();
app.UseAuthorization();
app.MapControllers();
app.MapHealthChecks("/health");
app.Urls.Add("http://0.0.0.0:5140");
await app.RunAsync();
public partial class Program;
