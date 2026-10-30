using System.Text;
using Asp.Versioning;
using MediatR;
using Erp.BuildingBlocks.CommonSecurity;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using ProductionPlanningService.Application;
using ProductionPlanningService.Domain;
using ProductionPlanningService.Infrastructure;
using ProductionPlanningService.Infrastructure.Persistence;
using Serilog;

var builder = WebApplication.CreateBuilder(args);
builder.Host.UseSerilog((_, cfg) => cfg.WriteTo.Console());

builder.Services.AddProductionPlanningApplication();
builder.Services.AddProductionPlanningInfrastructure(builder.Configuration);
builder.Services.AddControllers();
builder.Services.AddApiVersioning(o => { o.DefaultApiVersion = new ApiVersion(1, 0); o.AssumeDefaultVersionWhenUnspecified = true; })
    .AddApiExplorer(o => { o.GroupNameFormat = "'v'V"; o.SubstituteApiVersionInUrl = true; });
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c => c.SwaggerDoc("v1", new OpenApiInfo { Title = "ERP Production Planning", Version = "v1" }));

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
    options.AddPolicy(PlanningPermissions.PlanManage, p => p.RequireRole(PlanningRoles.SuperAdmin, PlanningRoles.CompanyAdmin, Admin, PlanningRoles.ProductionManager, Production));
    options.AddPolicy(PlanningPermissions.PlanApprove, p => p.RequireRole(PlanningRoles.SuperAdmin, PlanningRoles.CompanyAdmin, Admin, PlanningRoles.ProductionManager));
    options.AddPolicy(PlanningPermissions.BalanceView, p => p.RequireRole(PlanningRoles.SuperAdmin, PlanningRoles.CompanyAdmin, Admin, PlanningRoles.ProductionManager, Production, PlanningRoles.Viewer));
});

builder.Services.AddEnterpriseTenantSecurity(builder.Configuration);
builder.Services.AddScoped<ITenantCompanyAccessResolver, AuthDbTenantCompanyAccessResolver>();
builder.Services.AddHealthChecks().AddDbContextCheck<PlanningDbContext>("planning-db");
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
app.Urls.Add("http://0.0.0.0:5043");

if ((app.Environment.IsDevelopment() || app.Environment.IsEnvironment("Docker"))
    && app.Configuration.GetValue("Database:AutoMigrate", false))
{
    await using var scope = app.Services.CreateAsyncScope();
    await scope.ServiceProvider.GetRequiredService<PlanningDbContext>().Database.MigrateAsync();
}

await app.RunAsync();

public partial class Program;
