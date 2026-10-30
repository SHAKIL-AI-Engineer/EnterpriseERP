using System.Text;
using Asp.Versioning;
using SewingService.API.Middleware;
using SewingService.Application;
using SewingService.Domain;
using SewingService.Infrastructure;
using SewingService.Infrastructure.Persistence;
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

builder.Services.AddSewingApplication();
builder.Services.AddSewingInfrastructure(builder.Configuration);
builder.Services.AddControllers();
builder.Services.AddFluentValidationAutoValidation();
builder.Services.AddApiVersioning(o => { o.DefaultApiVersion = new ApiVersion(1, 0); o.AssumeDefaultVersionWhenUnspecified = true; o.ReportApiVersions = true; })
    .AddApiExplorer(o => { o.GroupNameFormat = "'v'V"; o.SubstituteApiVersionInUrl = true; });
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "ERP Sewing Service", Version = "v1" });
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

// Auth-service role names from hrhub (Admin = tenant admin; Production = shop-floor)
const string Admin = "Admin";
const string Production = "Production";

builder.Services.AddAuthorization(options =>
{
    options.AddPolicy(SewingPermissions.LineManage, p => p.RequireRole(SewingRoles.SuperAdmin, SewingRoles.CompanyAdmin, Admin, SewingRoles.SewingManager, SewingRoles.ProductionManager, Production));
    options.AddPolicy(SewingPermissions.AssignmentManage, p => p.RequireRole(SewingRoles.SuperAdmin, SewingRoles.CompanyAdmin, Admin, SewingRoles.SewingManager, SewingRoles.SewingOfficer, SewingRoles.ProductionManager, Production));
    options.AddPolicy(SewingPermissions.TargetManage, p => p.RequireRole(SewingRoles.SuperAdmin, SewingRoles.CompanyAdmin, Admin, SewingRoles.SewingManager, SewingRoles.SewingOfficer, SewingRoles.ProductionManager, Production));
    options.AddPolicy(SewingPermissions.DailyRecordManage, p => p.RequireRole(SewingRoles.SuperAdmin, SewingRoles.CompanyAdmin, Admin, SewingRoles.SewingManager, SewingRoles.SewingOfficer, SewingRoles.ProductionManager, Production));
    options.AddPolicy(SewingPermissions.OutputCreate, p => p.RequireRole(SewingRoles.SuperAdmin, SewingRoles.CompanyAdmin, Admin, SewingRoles.SewingManager, SewingRoles.SewingOfficer, SewingRoles.ProductionManager, Production));
    options.AddPolicy(SewingPermissions.PanelReceive, p => p.RequireRole(SewingRoles.SuperAdmin, SewingRoles.CompanyAdmin, Admin, SewingRoles.SewingManager, SewingRoles.CuttingManager, "Cutting"));
    options.AddPolicy(SewingPermissions.BalanceView, p => p.RequireRole(SewingRoles.SuperAdmin, SewingRoles.CompanyAdmin, Admin, SewingRoles.SewingManager, SewingRoles.ProductionManager, Production, SewingRoles.Auditor, SewingRoles.Viewer));
    options.AddPolicy(SewingPermissions.ReportView, p => p.RequireRole(SewingRoles.SuperAdmin, SewingRoles.CompanyAdmin, Admin, SewingRoles.SewingManager, SewingRoles.ProductionManager, Production, SewingRoles.Auditor, SewingRoles.Viewer));
});

builder.Services.AddEnterpriseTenantSecurity(builder.Configuration);
builder.Services.AddScoped<ITenantCompanyAccessResolver, AuthDbTenantCompanyAccessResolver>();
builder.Services.AddCors(options => options.AddPolicy("default", policy => policy.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod()));
builder.Services.AddHealthChecks().AddDbContextCheck<SewingDbContext>("sewing-db");

var app = builder.Build();
app.UseMiddleware<ExceptionMiddleware>();
app.UseSerilogRequestLogging();
app.UseSwagger();
app.UseSwaggerUI(o => o.SwaggerEndpoint("/swagger/v1/swagger.json", "Sewing v1"));
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
    await scope.ServiceProvider.GetRequiredService<SewingDbContext>().Database.EnsureCreatedAsync();
}

await app.RunAsync();
public partial class Program;
