using System.Text;
using FluentValidation.AspNetCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using PayrollService.Api.Middleware;
using PayrollService.Application;
using PayrollService.Domain.Enums;
using PayrollService.Infrastructure;
using PayrollService.Infrastructure.Persistence;
using Serilog;
using Erp.BuildingBlocks.Hosting;

var builder = WebApplication.CreateBuilder(args);
builder.AddEnterpriseErpConnectionConfiguration();

builder.Host.UseSerilog((_, cfg) => cfg.WriteTo.Console());

builder.Services.AddPayrollApplication();
builder.Services.AddPayrollInfrastructure(builder.Configuration);
builder.Services.AddControllers();
builder.Services.AddFluentValidationAutoValidation();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "ERP Payroll Service", Version = "v1" });
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Name = "Authorization",
    });
    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        { new OpenApiSecurityScheme { Reference = new OpenApiReference { Id = "Bearer", Type = ReferenceType.SecurityScheme } }, Array.Empty<string>() },
    });
});

var jwtKey = builder.Configuration["Jwt:SigningKey"] ?? "dev_signing_key_at_least_32_chars_long";
var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? "erp_auth_service";
var jwtAudience = builder.Configuration["Jwt:Audience"] ?? "erp_platform";

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(o =>
    {
        o.RequireHttpsMetadata = !builder.Environment.IsDevelopment();
        o.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtIssuer,
            ValidAudience = jwtAudience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
        };
    });

builder.Services.AddAuthorization(options =>
{
    options.AddPolicy(PayrollPermissions.PayrollPolicyManage, p => p.RequireRole(PayrollRoles.SuperAdmin));
    options.AddPolicy(PayrollPermissions.SalaryStructureManage, p => p.RequireRole(PayrollRoles.SuperAdmin, PayrollRoles.CompanyAdmin, PayrollRoles.HRManager));
    options.AddPolicy(PayrollPermissions.EmployeeSalaryManage, p => p.RequireRole(PayrollRoles.SuperAdmin, PayrollRoles.CompanyAdmin, PayrollRoles.HRManager));
    options.AddPolicy(PayrollPermissions.SalaryIncrementRequest, p => p.RequireRole(PayrollRoles.SuperAdmin, PayrollRoles.CompanyAdmin, PayrollRoles.HRManager));
    options.AddPolicy(PayrollPermissions.SalaryIncrementApprove, p => p.RequireRole(PayrollRoles.SuperAdmin, PayrollRoles.CompanyAdmin));
    options.AddPolicy(PayrollPermissions.SalaryAdvanceRequest, p => p.RequireRole(PayrollRoles.SuperAdmin, PayrollRoles.CompanyAdmin, PayrollRoles.HRManager, PayrollRoles.PayrollOfficer));
    options.AddPolicy(PayrollPermissions.SalaryAdvanceApprove, p => p.RequireRole(PayrollRoles.SuperAdmin, PayrollRoles.CompanyAdmin, PayrollRoles.AccountsOfficer));
    options.AddPolicy(PayrollPermissions.PayrollProcess, p => p.RequireRole(PayrollRoles.SuperAdmin, PayrollRoles.CompanyAdmin, PayrollRoles.PayrollOfficer));
    options.AddPolicy(PayrollPermissions.PayrollReprocess, p => p.RequireRole(PayrollRoles.SuperAdmin, PayrollRoles.CompanyAdmin));
    options.AddPolicy(PayrollPermissions.PayrollApprove, p => p.RequireRole(PayrollRoles.SuperAdmin, PayrollRoles.CompanyAdmin));
    options.AddPolicy(PayrollPermissions.PayrollLock, p => p.RequireRole(PayrollRoles.SuperAdmin, PayrollRoles.CompanyAdmin));
    options.AddPolicy(PayrollPermissions.PayrollUnlock, p => p.RequireRole(PayrollRoles.SuperAdmin));
    options.AddPolicy(PayrollPermissions.PayslipView, p => p.RequireRole(PayrollRoles.SuperAdmin, PayrollRoles.CompanyAdmin, PayrollRoles.PayrollOfficer, PayrollRoles.Employee));
    options.AddPolicy(PayrollPermissions.SalarySheetView, p => p.RequireRole(PayrollRoles.SuperAdmin, PayrollRoles.CompanyAdmin, PayrollRoles.PayrollOfficer, PayrollRoles.AccountsOfficer, PayrollRoles.Auditor));
    options.AddPolicy(PayrollPermissions.BankSheetExport, p => p.RequireRole(PayrollRoles.SuperAdmin, PayrollRoles.CompanyAdmin, PayrollRoles.AccountsOfficer));
    options.AddPolicy(PayrollPermissions.FinalSettlementProcess, p => p.RequireRole(PayrollRoles.SuperAdmin, PayrollRoles.CompanyAdmin, PayrollRoles.HRManager));
    options.AddPolicy(PayrollPermissions.FinalSettlementApprove, p => p.RequireRole(PayrollRoles.SuperAdmin, PayrollRoles.CompanyAdmin));
});

builder.Services.AddCors(options =>
{
    options.AddPolicy("default", policy =>
        policy.AllowAnyOrigin()
            .AllowAnyHeader()
            .AllowAnyMethod());
});

builder.Services.AddHealthChecks().AddDbContextCheck<PayrollDbContext>("payroll-db");

var app = builder.Build();

app.UseMiddleware<ExceptionMiddleware>();
app.UseSerilogRequestLogging();
app.UseSwagger();
app.UseSwaggerUI(o => o.SwaggerEndpoint("/swagger/v1/swagger.json", "Payroll v1"));
app.UseCors("default");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.MapHealthChecks("/health");

if (app.Environment.IsDevelopment() && app.Configuration.GetValue("Database:AutoMigrate", false))
{
    await using var scope = app.Services.CreateAsyncScope();
    var db = scope.ServiceProvider.GetRequiredService<PayrollDbContext>();
    await db.Database.MigrateAsync();
}

await app.RunAsync();

public partial class Program;
