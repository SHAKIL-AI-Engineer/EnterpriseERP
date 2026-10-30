using System.Text;
using Asp.Versioning;
using CuttingService.API.Middleware;
using CuttingService.Application;
using CuttingService.Domain;
using CuttingService.Infrastructure;
using CuttingService.Infrastructure.Persistence;
using Erp.BuildingBlocks.CommonSecurity;
using Erp.BuildingBlocks.Hosting;
using FluentValidation.AspNetCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Serilog;

var builder = WebApplication.CreateBuilder(args);
builder.AddEnterpriseErpConnectionConfiguration();
builder.Host.UseSerilog((_, cfg) => cfg.WriteTo.Console());

builder.Services.AddCuttingApplication();
builder.Services.AddCuttingInfrastructure(builder.Configuration);
builder.Services.AddControllers();
builder.Services.AddFluentValidationAutoValidation();
builder.Services.AddApiVersioning(o => { o.DefaultApiVersion = new ApiVersion(1, 0); o.AssumeDefaultVersionWhenUnspecified = true; o.ReportApiVersions = true; })
    .AddApiExplorer(o => { o.GroupNameFormat = "'v'V"; o.SubstituteApiVersionInUrl = true; });
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "ERP Cutting Service", Version = "v1" });
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme { Type = SecuritySchemeType.Http, Scheme = "bearer", BearerFormat = "JWT", In = ParameterLocation.Header, Name = "Authorization" });
    c.AddSecurityRequirement(new OpenApiSecurityRequirement { { new OpenApiSecurityScheme { Reference = new OpenApiReference { Id = "Bearer", Type = ReferenceType.SecurityScheme } }, Array.Empty<string>() } });
});

var jwtKey = builder.Configuration["Jwt:SigningKey"] ?? "dev_signing_key_at_least_32_chars_long";
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme).AddJwtBearer(o =>
{
    o.RequireHttpsMetadata = !builder.Environment.IsDevelopment();
    o.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = builder.Configuration["Jwt:Issuer"] ?? "erp_auth_service",
        ValidAudience = builder.Configuration["Jwt:Audience"] ?? "erp_platform",
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
    };
});

builder.Services.AddAuthorization(options =>
{
    const string Admin = "Admin";
    const string Cutting = "Cutting";
    const string Production = "Production";
    const string ProductionManager = "ProductionManager";

    options.AddPolicy(CuttingPermissions.PlanCreate, p => p.RequireRole(CuttingRoles.SuperAdmin, CuttingRoles.CompanyAdmin, Admin, CuttingRoles.CuttingManager, CuttingRoles.CuttingOfficer, Cutting));
    options.AddPolicy(CuttingPermissions.PlanApprove, p => p.RequireRole(CuttingRoles.SuperAdmin, CuttingRoles.CompanyAdmin, Admin, CuttingRoles.CuttingManager, Cutting));
    options.AddPolicy(CuttingPermissions.PlanUpdate, p => p.RequireRole(CuttingRoles.SuperAdmin, CuttingRoles.CompanyAdmin, Admin, CuttingRoles.CuttingManager, CuttingRoles.CuttingOfficer, Cutting));
    options.AddPolicy(CuttingPermissions.OutputCreate, p => p.RequireRole(CuttingRoles.SuperAdmin, CuttingRoles.CompanyAdmin, Admin, CuttingRoles.CuttingManager, CuttingRoles.CuttingOfficer, Cutting));
    options.AddPolicy(CuttingPermissions.WastageCreate, p => p.RequireRole(CuttingRoles.SuperAdmin, CuttingRoles.CompanyAdmin, Admin, CuttingRoles.CuttingManager, CuttingRoles.CuttingOfficer, Cutting));
    options.AddPolicy(CuttingPermissions.TransferCreate, p => p.RequireRole(CuttingRoles.SuperAdmin, CuttingRoles.CompanyAdmin, Admin, CuttingRoles.CuttingManager, CuttingRoles.CuttingOfficer, Cutting));
    options.AddPolicy(CuttingPermissions.TransferConfirm, p => p.RequireRole(CuttingRoles.SuperAdmin, CuttingRoles.CompanyAdmin, Admin, CuttingRoles.CuttingManager, CuttingRoles.ProductionManager, Production, ProductionManager));
    options.AddPolicy(CuttingPermissions.BalanceView, p => p.RequireRole(CuttingRoles.SuperAdmin, CuttingRoles.CompanyAdmin, Admin, CuttingRoles.CuttingManager, CuttingRoles.CuttingOfficer, Cutting, CuttingRoles.Auditor, CuttingRoles.Viewer));
    options.AddPolicy(CuttingPermissions.ReportView, p => p.RequireRole(CuttingRoles.SuperAdmin, CuttingRoles.CompanyAdmin, Admin, CuttingRoles.CuttingManager, Cutting, CuttingRoles.Auditor, CuttingRoles.Viewer));
    options.AddPolicy(CuttingPermissions.BundleManage, p => p.RequireRole(CuttingRoles.SuperAdmin, CuttingRoles.CompanyAdmin, Admin, CuttingRoles.CuttingManager, CuttingRoles.CuttingOfficer, Cutting));
});

builder.Services.AddEnterpriseTenantSecurity(builder.Configuration);
builder.Services.AddScoped<ITenantCompanyAccessResolver, AuthDbTenantCompanyAccessResolver>();
builder.Services.AddCors(options => options.AddPolicy("default", policy => policy.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod()));
builder.Services.AddHealthChecks().AddDbContextCheck<CuttingDbContext>("cutting-db");

var app = builder.Build();
app.UseMiddleware<ExceptionMiddleware>();
app.UseSerilogRequestLogging();
app.UseSwagger();
app.UseSwaggerUI(o => o.SwaggerEndpoint("/swagger/v1/swagger.json", "Cutting v1"));
app.UseCors("default");
app.UseAuthentication();
app.UseEnterpriseTenantSecurity();
app.UseAuthorization();
app.MapControllers();
app.MapHealthChecks("/health");

if ((app.Environment.IsDevelopment() || app.Environment.IsEnvironment("Docker"))
    && app.Configuration.GetValue("Database:AutoMigrate", false))
{
    await using var scope = app.Services.CreateAsyncScope();
    await scope.ServiceProvider.GetRequiredService<CuttingDbContext>().Database.MigrateAsync();
}

await app.RunAsync();
public partial class Program;
