using System.Text;
using FluentValidation.AspNetCore;
using Erp.BuildingBlocks.CommonSecurity;
using MerchandisingService.API.Authorization;
using MerchandisingService.API.Middleware;
using MerchandisingService.Application;
using MerchandisingService.Infrastructure;
using MerchandisingService.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Serilog;
using Erp.BuildingBlocks.Hosting;

var builder = WebApplication.CreateBuilder(args);
builder.AddEnterpriseErpConnectionConfiguration();

builder.Host.UseSerilog((_, cfg) => cfg.WriteTo.Console());

builder.Services.AddMerchandisingApplication();
builder.Services.AddMerchandisingInfrastructure(builder.Configuration);
builder.Services.AddEnterpriseTenantSecurity(builder.Configuration);
builder.Services.AddScoped<ITenantCompanyAccessResolver, AuthDbTenantCompanyAccessResolver>();
builder.Services.AddControllers();
builder.Services.AddFluentValidationAutoValidation();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "ERP Merchandising Service",
        Version = "v1",
        Description = "Buyer, style, order, PO, color-size, BOM, costing, sample, shipment planning, and merchandising tracking APIs.",
    });
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

var jwtKey = builder.Configuration["Jwt:SigningKey"] ?? "CHANGE_THIS_TO_A_LONG_RANDOM_SECRET_KEY_32+";
var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? "AuthService";
var jwtAudience = builder.Configuration["Jwt:Audience"] ?? "Erp.Platform";

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

builder.Services.AddSingleton<IAuthorizationPolicyProvider, PermissionAuthorizationPolicyProvider>();
builder.Services.AddSingleton<IAuthorizationHandler, PermissionAuthorizationHandler>();
builder.Services.AddAuthorization();

var corsOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? Array.Empty<string>();
builder.Services.AddCors(options =>
{
    options.AddPolicy("default", policy =>
    {
        if (corsOrigins.Length > 0)
        {
            policy.WithOrigins(corsOrigins).AllowAnyHeader().AllowAnyMethod().AllowCredentials();
        }
        else
        {
            policy.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod();
        }
    });
});

builder.Services.AddHealthChecks().AddDbContextCheck<MerchandisingDbContext>("merchandising-db");

var app = builder.Build();

app.UseMiddleware<ExceptionMiddleware>();
app.UseSerilogRequestLogging();
app.UseSwagger();
app.UseSwaggerUI(o => o.SwaggerEndpoint("/swagger/v1/swagger.json", "Merchandising v1"));
app.UseCors("default");
app.UseAuthentication();
app.UseMiddleware<LiveSessionMiddleware>();
app.UseEnterpriseTenantSecurity();
app.UseAuthorization();
app.MapControllers();
app.MapHealthChecks("/health");

if ((app.Environment.IsDevelopment() || app.Environment.IsEnvironment("Docker"))
    && app.Configuration.GetValue("Database:AutoMigrate", false))
{
    await using var scope = app.Services.CreateAsyncScope();
    var db = scope.ServiceProvider.GetRequiredService<MerchandisingDbContext>();
    await db.Database.MigrateAsync();
}

await app.RunAsync();

public partial class Program;
