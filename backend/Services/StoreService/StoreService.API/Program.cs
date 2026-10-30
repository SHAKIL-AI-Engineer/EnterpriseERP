using System.Text;
using Erp.BuildingBlocks.CommonSecurity;
using Erp.BuildingBlocks.Hosting;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using StoreService.Application;
using StoreService.Infrastructure;
using StoreService.Infrastructure.Persistence;

var builder = WebApplication.CreateBuilder(args);
builder.AddEnterpriseErpConnectionConfiguration();

builder.Services.AddStoreApplication();
builder.Services.AddStoreInfrastructure(builder.Configuration);
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "ERP Store Service", Version = "v1" });
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
    options.FallbackPolicy = new AuthorizationPolicyBuilder()
        .RequireAuthenticatedUser()
        .RequireRole("SuperAdmin", "Admin", "Store", "StoreKeeper")
        .Build();
});
builder.Services.AddEnterpriseTenantSecurity(builder.Configuration);
builder.Services.AddScoped<ITenantCompanyAccessResolver, AuthDbTenantCompanyAccessResolver>();
builder.Services.AddCors(options => options.AddPolicy("default", policy => policy.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod()));
builder.Services.AddHealthChecks().AddDbContextCheck<StoreDbContext>("store-db");

var app = builder.Build();
app.UseSwagger();
app.UseSwaggerUI();
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
    var db = scope.ServiceProvider.GetRequiredService<StoreDbContext>();
    await db.Database.MigrateAsync();
}

await app.RunAsync();
public partial class Program;
