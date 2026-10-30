using System.Text;
using Asp.Versioning;
using FinishingService.API.Middleware;
using FinishingService.Application;
using FinishingService.Domain;
using FinishingService.Infrastructure;
using FinishingService.Infrastructure.Persistence;
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

builder.Services.AddFinishingApplication();
builder.Services.AddFinishingInfrastructure(builder.Configuration);
builder.Services.AddControllers();
builder.Services.AddFluentValidationAutoValidation();

builder.Services.AddApiVersioning(o => 
{ 
    o.DefaultApiVersion = new ApiVersion(1, 0); 
    o.AssumeDefaultVersionWhenUnspecified = true; 
    o.ReportApiVersions = true; 
})
.AddApiExplorer(o => 
{ 
    o.GroupNameFormat = "'v'V"; 
    o.SubstituteApiVersionInUrl = true; 
});

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "ERP Finishing Service", Version = "v1" });
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme 
    { 
        Type = SecuritySchemeType.Http, 
        Scheme = "bearer", 
        BearerFormat = "JWT", 
        In = ParameterLocation.Header, 
        Name = "Authorization" 
    });
    c.AddSecurityRequirement(new OpenApiSecurityRequirement 
    { 
        { 
            new OpenApiSecurityScheme 
            { 
                Reference = new OpenApiReference { Id = "Bearer", Type = ReferenceType.SecurityScheme } 
            }, 
            Array.Empty<string>() 
        } 
    });
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
    options.AddPolicy(FinishingPermissions.ReceiveCreate, p => 
        p.RequireRole(FinishingRoles.SuperAdmin, FinishingRoles.CompanyAdmin, FinishingRoles.FinishingManager, FinishingRoles.FinishingOfficer));
    options.AddPolicy(FinishingPermissions.ReceiveConfirm, p => 
        p.RequireRole(FinishingRoles.SuperAdmin, FinishingRoles.CompanyAdmin, FinishingRoles.FinishingManager));
    options.AddPolicy(FinishingPermissions.BatchCreate, p => 
        p.RequireRole(FinishingRoles.SuperAdmin, FinishingRoles.CompanyAdmin, FinishingRoles.FinishingManager, FinishingRoles.FinishingOfficer));
    options.AddPolicy(FinishingPermissions.InputCreate, p => 
        p.RequireRole(FinishingRoles.SuperAdmin, FinishingRoles.CompanyAdmin, FinishingRoles.FinishingManager, FinishingRoles.FinishingOfficer));
    options.AddPolicy(FinishingPermissions.IroningCreate, p => 
        p.RequireRole(FinishingRoles.SuperAdmin, FinishingRoles.CompanyAdmin, FinishingRoles.FinishingManager, FinishingRoles.FinishingOfficer));
    options.AddPolicy(FinishingPermissions.QCCreate, p => 
        p.RequireRole(FinishingRoles.SuperAdmin, FinishingRoles.CompanyAdmin, FinishingRoles.QualityOfficer, FinishingRoles.FinishingManager));
    options.AddPolicy(FinishingPermissions.CartonCreate, p => 
        p.RequireRole(FinishingRoles.SuperAdmin, FinishingRoles.CompanyAdmin, FinishingRoles.FinishingManager, FinishingRoles.FinishingOfficer));
    options.AddPolicy(FinishingPermissions.CartonClose, p => 
        p.RequireRole(FinishingRoles.SuperAdmin, FinishingRoles.CompanyAdmin, FinishingRoles.FinishingManager, FinishingRoles.StoreManager));
    options.AddPolicy(FinishingPermissions.TransferCreate, p => 
        p.RequireRole(FinishingRoles.SuperAdmin, FinishingRoles.CompanyAdmin, FinishingRoles.FinishingManager, FinishingRoles.FinishingOfficer));
    options.AddPolicy(FinishingPermissions.TransferConfirm, p => 
        p.RequireRole(FinishingRoles.SuperAdmin, FinishingRoles.CompanyAdmin, FinishingRoles.StoreManager, FinishingRoles.FinishingManager));
    options.AddPolicy(FinishingPermissions.WastageCreate, p => 
        p.RequireRole(FinishingRoles.SuperAdmin, FinishingRoles.CompanyAdmin, FinishingRoles.FinishingManager, FinishingRoles.FinishingOfficer));
    options.AddPolicy(FinishingPermissions.BalanceView, p => 
        p.RequireRole(FinishingRoles.SuperAdmin, FinishingRoles.CompanyAdmin, FinishingRoles.FinishingManager, FinishingRoles.FinishingOfficer, FinishingRoles.Auditor, FinishingRoles.Viewer));
    options.AddPolicy(FinishingPermissions.ReportView, p => 
        p.RequireRole(FinishingRoles.SuperAdmin, FinishingRoles.CompanyAdmin, FinishingRoles.FinishingManager, FinishingRoles.Auditor, FinishingRoles.Viewer));
});

builder.Services.AddCors(options => options.AddPolicy("default", policy => policy.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod()));
builder.Services.AddHealthChecks().AddDbContextCheck<FinishingDbContext>("finishing-db");

var app = builder.Build();
app.UseMiddleware<ExceptionMiddleware>();
app.UseSerilogRequestLogging();
app.UseSwagger();
app.UseSwaggerUI(o => o.SwaggerEndpoint("/swagger/v1/swagger.json", "Finishing v1"));
app.UseCors("default");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.MapHealthChecks("/health");

if (app.Environment.IsDevelopment() && app.Configuration.GetValue("Database:AutoMigrate", false))
{
    await using var scope = app.Services.CreateAsyncScope();
    await scope.ServiceProvider.GetRequiredService<FinishingDbContext>().Database.MigrateAsync();
}

await app.RunAsync();
public partial class Program;
