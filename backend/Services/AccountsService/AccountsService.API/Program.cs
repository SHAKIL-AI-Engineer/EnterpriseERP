using System.Text;
using AccountsService.API.Middleware;
using AccountsService.Application;
using AccountsService.Domain;
using AccountsService.Infrastructure;
using AccountsService.Infrastructure.Persistence;
using Asp.Versioning;
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

builder.Services.AddAccountsApplication();
builder.Services.AddAccountsInfrastructure(builder.Configuration);
builder.Services.AddControllers();
builder.Services.AddFluentValidationAutoValidation();
builder.Services.AddApiVersioning(options =>
{
    options.DefaultApiVersion = new ApiVersion(1, 0);
    options.AssumeDefaultVersionWhenUnspecified = true;
    options.ReportApiVersions = true;
}).AddApiExplorer(options =>
{
    options.GroupNameFormat = "'v'V";
    options.SubstituteApiVersionInUrl = true;
});

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "ERP Accounts Service", Version = "v1" });
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme { Type = SecuritySchemeType.Http, Scheme = "bearer", BearerFormat = "JWT", In = ParameterLocation.Header, Name = "Authorization" });
    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        { new OpenApiSecurityScheme { Reference = new OpenApiReference { Id = "Bearer", Type = ReferenceType.SecurityScheme } }, Array.Empty<string>() },
    });
});

var jwtKey = builder.Configuration["Jwt:SigningKey"] ?? "dev_signing_key_at_least_32_chars_long";
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
            ValidIssuer = builder.Configuration["Jwt:Issuer"] ?? "erp_auth_service",
            ValidAudience = builder.Configuration["Jwt:Audience"] ?? "erp_platform",
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
        };
    });

builder.Services.AddAuthorization(options =>
{
    options.AddPolicy(AccountsPermissions.CoaManage, p => p.RequireRole(AccountsRoles.SuperAdmin, AccountsRoles.GroupAdmin, AccountsRoles.CompanyAdmin, AccountsRoles.AccountsManager));
    options.AddPolicy(AccountsPermissions.VoucherCreate, p => p.RequireRole(AccountsRoles.SuperAdmin, AccountsRoles.CompanyAdmin, AccountsRoles.AccountsManager, AccountsRoles.AccountsOfficer));
    options.AddPolicy(AccountsPermissions.VoucherApprove, p => p.RequireRole(AccountsRoles.SuperAdmin, AccountsRoles.CompanyAdmin, AccountsRoles.AccountsManager));
    options.AddPolicy(AccountsPermissions.VoucherPost, p => p.RequireRole(AccountsRoles.SuperAdmin, AccountsRoles.CompanyAdmin, AccountsRoles.AccountsManager, AccountsRoles.AccountsOfficer));
    options.AddPolicy(AccountsPermissions.CashReceiveCreate, p => p.RequireRole(AccountsRoles.SuperAdmin, AccountsRoles.CompanyAdmin, AccountsRoles.AccountsManager, AccountsRoles.AccountsOfficer, AccountsRoles.Cashier));
    options.AddPolicy(AccountsPermissions.CashReceiveApprove, p => p.RequireRole(AccountsRoles.SuperAdmin, AccountsRoles.CompanyAdmin, AccountsRoles.AccountsManager));
    options.AddPolicy(AccountsPermissions.DailyExpenseCreate, p => p.RequireRole(AccountsRoles.SuperAdmin, AccountsRoles.CompanyAdmin, AccountsRoles.AccountsManager, AccountsRoles.AccountsOfficer, AccountsRoles.Cashier));
    options.AddPolicy(AccountsPermissions.DailyExpenseApprove, p => p.RequireRole(AccountsRoles.SuperAdmin, AccountsRoles.CompanyAdmin, AccountsRoles.AccountsManager));
    options.AddPolicy(AccountsPermissions.MoneyRequestCreate, p => p.RequireRole(AccountsRoles.SuperAdmin, AccountsRoles.CompanyAdmin, AccountsRoles.AccountsManager, AccountsRoles.AccountsOfficer));
    options.AddPolicy(AccountsPermissions.MoneyRequestApprove, p => p.RequireRole(AccountsRoles.SuperAdmin, AccountsRoles.CompanyAdmin, AccountsRoles.AccountsManager));
    options.AddPolicy(AccountsPermissions.AdvancePayCreate, p => p.RequireRole(AccountsRoles.SuperAdmin, AccountsRoles.CompanyAdmin, AccountsRoles.AccountsManager, AccountsRoles.AccountsOfficer));
    options.AddPolicy(AccountsPermissions.AdvancePayApprove, p => p.RequireRole(AccountsRoles.SuperAdmin, AccountsRoles.CompanyAdmin, AccountsRoles.AccountsManager));
    options.AddPolicy(AccountsPermissions.AdvanceSalaryPayCreate, p => p.RequireRole(AccountsRoles.SuperAdmin, AccountsRoles.CompanyAdmin, AccountsRoles.AccountsManager, AccountsRoles.AccountsOfficer));
    options.AddPolicy(AccountsPermissions.AdvanceSalaryPayApprove, p => p.RequireRole(AccountsRoles.SuperAdmin, AccountsRoles.CompanyAdmin, AccountsRoles.AccountsManager));
    options.AddPolicy(AccountsPermissions.CompanyTransferCreate, p => p.RequireRole(AccountsRoles.SuperAdmin, AccountsRoles.CompanyAdmin, AccountsRoles.AccountsManager));
    options.AddPolicy(AccountsPermissions.CompanyTransferApprove, p => p.RequireRole(AccountsRoles.SuperAdmin, AccountsRoles.CompanyAdmin, AccountsRoles.AccountsManager));
    options.AddPolicy(AccountsPermissions.LedgerView, p => p.RequireRole(AccountsRoles.SuperAdmin, AccountsRoles.CompanyAdmin, AccountsRoles.AccountsManager, AccountsRoles.AccountsOfficer, AccountsRoles.Auditor, AccountsRoles.Viewer));
    options.AddPolicy(AccountsPermissions.ReportView, p => p.RequireRole(AccountsRoles.SuperAdmin, AccountsRoles.CompanyAdmin, AccountsRoles.AccountsManager, AccountsRoles.Auditor, AccountsRoles.Viewer));
});

builder.Services.AddCors(options => options.AddPolicy("default", policy => policy.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod()));
builder.Services.AddHealthChecks().AddDbContextCheck<AccountsDbContext>("accounts-db");

var app = builder.Build();
app.UseMiddleware<ExceptionMiddleware>();
app.UseSerilogRequestLogging();
app.UseSwagger();
app.UseSwaggerUI(o => o.SwaggerEndpoint("/swagger/v1/swagger.json", "Accounts v1"));
app.UseCors("default");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.MapHealthChecks("/health");

if (app.Environment.IsDevelopment() && app.Configuration.GetValue("Database:AutoMigrate", false))
{
    await using var scope = app.Services.CreateAsyncScope();
    var db = scope.ServiceProvider.GetRequiredService<AccountsDbContext>();
    await db.Database.MigrateAsync();
}

await app.RunAsync();

public partial class Program;
