using System.Text;
using Asp.Versioning;
using Erp.BuildingBlocks.Hosting;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using SecurityService.API.Middleware;
using SecurityService.Application;
using SecurityService.Domain;
using SecurityService.Infrastructure;
using SecurityService.Infrastructure.Persistence;
using Serilog;

var builder = WebApplication.CreateBuilder(args);
builder.AddEnterpriseErpConnectionConfiguration();
builder.Host.UseSerilog((_, cfg) => cfg.WriteTo.Console());

builder.Services.AddSecurityApplication();
builder.Services.AddSecurityInfrastructure(builder.Configuration);
builder.Services.AddControllers().AddJsonOptions(options =>
{
    options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
});

builder.Services.AddApiVersioning(options =>
{
    options.DefaultApiVersion = new ApiVersion(1, 0);
    options.AssumeDefaultVersionWhenUnspecified = true;
    options.ReportApiVersions = true;
    options.ApiVersionReader = new UrlSegmentApiVersionReader();
}).AddApiExplorer(options =>
{
    options.GroupNameFormat = "'v'V";
    options.SubstituteApiVersionInUrl = true;
});

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "ERP SecurityService Gate Operations", Version = "v1" });
    c.CustomSchemaIds(type => (type.FullName ?? type.Name).Replace('+', '.'));
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme { Type = SecuritySchemeType.Http, Scheme = "bearer", BearerFormat = "JWT", In = ParameterLocation.Header, Name = "Authorization" });
    c.AddSecurityRequirement(new OpenApiSecurityRequirement { { new OpenApiSecurityScheme { Reference = new OpenApiReference { Id = "Bearer", Type = ReferenceType.SecurityScheme } }, Array.Empty<string>() } });
});

var jwtKey = builder.Configuration["Jwt:SigningKey"] ?? "dev_signing_key_at_least_32_chars_long";
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.RequireHttpsMetadata = !builder.Environment.IsDevelopment();
        options.TokenValidationParameters = new TokenValidationParameters
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
    options.AddPolicy(SecurityPermissions.GateManage, p => p.RequireRole(SecurityRoles.SuperAdmin, SecurityRoles.GroupAdmin, SecurityRoles.CompanyAdmin, SecurityRoles.SecurityManager));
    options.AddPolicy(SecurityPermissions.VisitorEntryCreate, p => p.RequireRole(SecurityRoles.SuperAdmin, SecurityRoles.CompanyAdmin, SecurityRoles.SecurityManager, SecurityRoles.SecurityOfficer, SecurityRoles.GateOfficer));
    options.AddPolicy(SecurityPermissions.VisitorCheckout, p => p.RequireRole(SecurityRoles.SuperAdmin, SecurityRoles.CompanyAdmin, SecurityRoles.SecurityManager, SecurityRoles.SecurityOfficer, SecurityRoles.GateOfficer));
    options.AddPolicy(SecurityPermissions.EmployeeOutPassCreate, p => p.RequireRole(SecurityRoles.SuperAdmin, SecurityRoles.CompanyAdmin, SecurityRoles.HRManager, SecurityRoles.SecurityOfficer));
    options.AddPolicy(SecurityPermissions.EmployeeOutPassApprove, p => p.RequireRole(SecurityRoles.SuperAdmin, SecurityRoles.CompanyAdmin, SecurityRoles.SecurityManager, SecurityRoles.HRManager));
    options.AddPolicy(SecurityPermissions.VehicleEntryCreate, p => p.RequireRole(SecurityRoles.SuperAdmin, SecurityRoles.CompanyAdmin, SecurityRoles.SecurityManager, SecurityRoles.SecurityOfficer, SecurityRoles.GateOfficer));
    options.AddPolicy(SecurityPermissions.VehicleExit, p => p.RequireRole(SecurityRoles.SuperAdmin, SecurityRoles.CompanyAdmin, SecurityRoles.SecurityManager, SecurityRoles.SecurityOfficer, SecurityRoles.GateOfficer));
    options.AddPolicy(SecurityPermissions.GatePassCreate, p => p.RequireRole(SecurityRoles.SuperAdmin, SecurityRoles.CompanyAdmin, SecurityRoles.SecurityManager, SecurityRoles.StoreManager, SecurityRoles.SecurityOfficer));
    options.AddPolicy(SecurityPermissions.GatePassApprove, p => p.RequireRole(SecurityRoles.SuperAdmin, SecurityRoles.CompanyAdmin, SecurityRoles.SecurityManager, SecurityRoles.StoreManager));
    options.AddPolicy(SecurityPermissions.GatePassIssue, p => p.RequireRole(SecurityRoles.SuperAdmin, SecurityRoles.CompanyAdmin, SecurityRoles.SecurityManager, SecurityRoles.SecurityOfficer, SecurityRoles.GateOfficer));
    options.AddPolicy(SecurityPermissions.ChalanCreate, p => p.RequireRole(SecurityRoles.SuperAdmin, SecurityRoles.CompanyAdmin, SecurityRoles.StoreManager, SecurityRoles.SecurityOfficer));
    options.AddPolicy(SecurityPermissions.ChalanApprove, p => p.RequireRole(SecurityRoles.SuperAdmin, SecurityRoles.CompanyAdmin, SecurityRoles.SecurityManager, SecurityRoles.StoreManager));
    options.AddPolicy(SecurityPermissions.BillEntryCreate, p => p.RequireRole(SecurityRoles.SuperAdmin, SecurityRoles.CompanyAdmin, SecurityRoles.AccountsOfficer, SecurityRoles.SecurityOfficer));
    options.AddPolicy(SecurityPermissions.BillEntryApprove, p => p.RequireRole(SecurityRoles.SuperAdmin, SecurityRoles.CompanyAdmin, SecurityRoles.AccountsOfficer));
    options.AddPolicy(SecurityPermissions.BillSendToAccounts, p => p.RequireRole(SecurityRoles.SuperAdmin, SecurityRoles.CompanyAdmin, SecurityRoles.AccountsOfficer));
    options.AddPolicy(SecurityPermissions.SecurityCheckCreate, p => p.RequireRole(SecurityRoles.SuperAdmin, SecurityRoles.CompanyAdmin, SecurityRoles.SecurityManager, SecurityRoles.SecurityOfficer, SecurityRoles.GateOfficer));
    options.AddPolicy(SecurityPermissions.GateReportView, p => p.RequireRole(SecurityRoles.SuperAdmin, SecurityRoles.CompanyAdmin, SecurityRoles.SecurityManager, SecurityRoles.Auditor, SecurityRoles.Viewer));
    options.AddPolicy(SecurityPermissions.GateReportExport, p => p.RequireRole(SecurityRoles.SuperAdmin, SecurityRoles.CompanyAdmin, SecurityRoles.SecurityManager, SecurityRoles.Auditor));
});

builder.Services.AddCors(options => options.AddPolicy("default", policy => policy.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod()));
builder.Services.AddHealthChecks().AddDbContextCheck<SecurityDbContext>("security-db");

var app = builder.Build();
app.UseMiddleware<ExceptionMiddleware>();
app.UseSerilogRequestLogging();
app.UseSwagger();
app.UseSwaggerUI(o => o.SwaggerEndpoint("/swagger/v1/swagger.json", "SecurityService v1"));
app.UseCors("default");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.MapHealthChecks("/health");

if (app.Environment.IsDevelopment() && app.Configuration.GetValue("Database:AutoMigrate", false))
{
    await using var scope = app.Services.CreateAsyncScope();
    var db = scope.ServiceProvider.GetRequiredService<SecurityDbContext>();
    await db.Database.MigrateAsync();
}

await app.RunAsync();

public partial class Program;
