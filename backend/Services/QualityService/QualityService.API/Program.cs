using System.Text;
using Asp.Versioning;
using QualityService.API.Middleware;
using QualityService.Application;
using QualityService.Domain;
using QualityService.Infrastructure;
using QualityService.Infrastructure.Persistence;
using Erp.BuildingBlocks.Hosting;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Serilog;

var builder = WebApplication.CreateBuilder(args);
builder.AddEnterpriseErpConnectionConfiguration();
builder.Host.UseSerilog((_, cfg) => cfg.WriteTo.Console());

builder.Services.AddApplication();
builder.Services.AddInfrastructure(builder.Configuration);
builder.Services.AddControllers();

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
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "ERP Quality Service", Version = "v1" });
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
    options.AddPolicy(QualityPermissions.CheckpointManage, p => 
        p.RequireRole(QualityRoles.SuperAdmin, QualityRoles.CompanyAdmin, QualityRoles.QualityManager));
    options.AddPolicy(QualityPermissions.DefectManage, p => 
        p.RequireRole(QualityRoles.SuperAdmin, QualityRoles.CompanyAdmin, QualityRoles.QualityManager, QualityRoles.QualityOfficer));
    options.AddPolicy(QualityPermissions.InspectionCreate, p => 
        p.RequireRole(QualityRoles.SuperAdmin, QualityRoles.CompanyAdmin, QualityRoles.QualityOfficer, QualityRoles.QualityManager, QualityRoles.ProductionManager));
    options.AddPolicy(QualityPermissions.InspectionApprove, p => 
        p.RequireRole(QualityRoles.SuperAdmin, QualityRoles.CompanyAdmin, QualityRoles.QualityManager));
    options.AddPolicy(QualityPermissions.ReworkCreate, p => 
        p.RequireRole(QualityRoles.SuperAdmin, QualityRoles.CompanyAdmin, QualityRoles.QualityOfficer, QualityRoles.QualityManager, QualityRoles.ProductionManager));
    options.AddPolicy(QualityPermissions.RejectCreate, p => 
        p.RequireRole(QualityRoles.SuperAdmin, QualityRoles.CompanyAdmin, QualityRoles.QualityOfficer, QualityRoles.QualityManager, QualityRoles.ProductionManager));
    options.AddPolicy(QualityPermissions.FinalInspectionCreate, p => 
        p.RequireRole(QualityRoles.SuperAdmin, QualityRoles.CompanyAdmin, QualityRoles.QualityOfficer, QualityRoles.QualityManager));
    options.AddPolicy(QualityPermissions.FinalInspectionApprove, p => 
        p.RequireRole(QualityRoles.SuperAdmin, QualityRoles.CompanyAdmin, QualityRoles.QualityManager));
    options.AddPolicy(QualityPermissions.ReportView, p => 
        p.RequireRole(QualityRoles.SuperAdmin, QualityRoles.CompanyAdmin, QualityRoles.QualityManager, QualityRoles.Auditor, QualityRoles.Viewer));
    options.AddPolicy(QualityPermissions.ReportExport, p => 
        p.RequireRole(QualityRoles.SuperAdmin, QualityRoles.CompanyAdmin, QualityRoles.QualityManager, QualityRoles.Auditor));
});

builder.Services.AddCors(options => options.AddPolicy("default", policy => policy.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod()));
builder.Services.AddHealthChecks().AddDbContextCheck<QualityDbContext>("quality-db");

var app = builder.Build();
app.UseMiddleware<ExceptionMiddleware>();
app.UseSerilogRequestLogging();
app.UseSwagger();
app.UseSwaggerUI(o => o.SwaggerEndpoint("/swagger/v1/swagger.json", "Quality v1"));
app.UseCors("default");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.MapHealthChecks("/health");

if (app.Environment.IsDevelopment() && app.Configuration.GetValue("Database:AutoMigrate", false))
{
    await using var scope = app.Services.CreateAsyncScope();
    var db = scope.ServiceProvider.GetService<QualityDbContext>();
    if (db is not null && !db.Database.IsInMemory())
    {
        await db.Database.MigrateAsync();
    }
}

await app.RunAsync();
public partial class Program;
