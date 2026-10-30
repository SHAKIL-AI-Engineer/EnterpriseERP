using System.Text;
using HRService.Domain.Entities;
using HRService.Infrastructure;
using HRService.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Serilog;
using Erp.BuildingBlocks.Hosting;
using Erp.BuildingBlocks.SharedKernel;

var builder = WebApplication.CreateBuilder(args);
builder.AddEnterpriseErpConnectionConfiguration();

builder.Host.UseSerilog((_, cfg) => cfg.WriteTo.Console());

builder.Services.AddHrInfrastructure(builder.Configuration);
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "ERP HR Service", Version = "v1" });
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

var jwtKey = builder.Configuration["Jwt:SigningKey"] ?? "";
if (jwtKey.Length < 32)
{
    throw new InvalidOperationException("Jwt:SigningKey must be at least 32 characters (same as Auth service for dev).");
}

var jwtIssuer = builder.Configuration["Jwt:Issuer"];
var jwtAudience = builder.Configuration["Jwt:Audience"];
if (string.IsNullOrWhiteSpace(jwtIssuer) || string.IsNullOrWhiteSpace(jwtAudience))
{
    throw new InvalidOperationException("Jwt:Issuer and Jwt:Audience must be set and must match the Auth service.");
}

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
builder.Services.AddAuthorization();

var hrCorsOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? Array.Empty<string>();
builder.Services.AddCors(options =>
{
    options.AddPolicy("default", policy =>
        policy.SetIsOriginAllowed(origin =>
            {
                if (string.IsNullOrEmpty(origin))
                {
                    return false;
                }

                if (hrCorsOrigins.Length > 0)
                {
                    return hrCorsOrigins.Contains(origin, StringComparer.OrdinalIgnoreCase);
                }

                if (!builder.Environment.IsDevelopment())
                {
                    return false;
                }

                try
                {
                    return new Uri(origin).Host is "localhost" or "127.0.0.1";
                }
                catch (UriFormatException)
                {
                    return false;
                }
            })
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials());
});

builder.Services.AddHealthChecks()
    .AddDbContextCheck<HrDbContext>("hr-db");

var app = builder.Build();
app.UseSerilogRequestLogging();
app.UseSwagger();
app.UseSwaggerUI(o => o.SwaggerEndpoint("/swagger/v1/swagger.json", "HR v1"));
app.UseCors("default");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.MapHealthChecks("/health");

await using (var scope = app.Services.CreateAsyncScope())
{
    var db = scope.ServiceProvider.GetRequiredService<HrDbContext>();
    await db.Database.MigrateAsync();
    if (!await db.Employees.AnyAsync())
    {
        var companyId = Guid.NewGuid();
        var grade = new Grade { Id = Guid.NewGuid(), Name = "G1", CreatedAt = BusinessTime.NowOffset };
        var dept = new Department { Id = Guid.NewGuid(), CompanyId = companyId, Name = "Operations", CreatedAt = BusinessTime.NowOffset };
        var desig = new Designation { Id = Guid.NewGuid(), GradeId = grade.Id, Name = "Officer", CreatedAt = BusinessTime.NowOffset };
        db.Grades.Add(grade);
        db.Departments.Add(dept);
        db.Designations.Add(desig);
        await db.SaveChangesAsync();

        var emp = new Employee
        {
            Id = Guid.NewGuid(),
            CompanyId = companyId,
            PunchNumber = 1,
            EmployeeID = "EMP-0001",
            FullName = "Sample Employee",
            Email = "sample@erp.local",
            JoinDate = BusinessTime.Now.Date,
            EmploymentType = "Permanent",
            Status = "Active",
            CreatedAt = BusinessTime.Now,
        };

        emp.JobInfos.Add(new EmployeeJobInfo
        {
            Id = Guid.NewGuid(),
            CompanyId = companyId,
            DepartmentId = dept.Id,
            DesignationId = desig.Id,
            GradeId = grade.Id,
            EffectiveFrom = emp.JoinDate,
            IsCurrent = true
        });

        emp.SalaryInfos.Add(new EmployeeSalaryInfo
        {
            Id = Guid.NewGuid(),
            CompanyId = companyId,
            BasicSalary = 50000,
            GrossSalary = 50000,
            EffectiveFrom = emp.JoinDate,
            IsCurrent = true
        });

        db.Employees.Add(emp);
        await db.SaveChangesAsync();
    }
}

await app.RunAsync();
