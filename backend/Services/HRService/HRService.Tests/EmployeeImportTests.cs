using HRService.Application.Employees;
using HRService.Domain.Entities;
using HRService.Infrastructure.Persistence;
using HRService.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
namespace HRService.Tests;

public sealed class EmployeeImportTests
{
    [Fact]
    public async Task UpsertAsync_creates_then_updates_by_employee_id()
    {
        await using var db = CreateDb();
        var companyId = Guid.NewGuid();
        await SeedOrganogramAsync(db, companyId);

        var employeeService = new EmployeeService(db);
        var scopeFactory = new TestServiceScopeFactory(db, employeeService);
        var import = new EmployeeImportService(
            db,
            scopeFactory,
            Microsoft.Extensions.Options.Options.Create(new EmployeeImportOptions { MaxParallelRows = 1 }));

        var join = new DateTime(2024, 6, 1);
        var row = new EmployeeImportRowDto
        {
            RowIndex = 2,
            PunchNumber = 101,
            EmployeeID = "EMP-IMP-01",
            FullName = "Import Test",
            DepartmentName = "HR",
            DesignationName = "Executive",
            JoinDate = join,
            Status = "Active",
            BasicSalary = 40000,
            Phone = "01711111111",
        };

        var createResult = await import.UpsertAsync(
            companyId,
            new EmployeeImportUpsertRequest([row]),
            CancellationToken.None);

        Assert.Equal(1, createResult.Created);
        Assert.Equal(0, createResult.Updated);
        Assert.Equal(0, createResult.Failed);

        var updateRow = new EmployeeImportRowDto
        {
            RowIndex = 2,
            PunchNumber = 101,
            EmployeeID = "EMP-IMP-01",
            FullName = "Import Test Updated",
            DepartmentName = "HR",
            DesignationName = "Executive",
            JoinDate = join,
            Status = "Active",
            BasicSalary = 45000,
            Phone = "01722222222",
        };
        var updateResult = await import.UpsertAsync(
            companyId,
            new EmployeeImportUpsertRequest([updateRow]),
            CancellationToken.None);

        Assert.Equal(0, updateResult.Created);
        Assert.Equal(1, updateResult.Updated);
        Assert.Equal(0, updateResult.Failed);

        var emp = await db.Employees.SingleAsync(e => e.EmployeeID == "EMP-IMP-01");
        Assert.Equal("Import Test Updated", emp.FullName);
        Assert.Equal("01722222222", emp.Phone);
    }

    private static async Task SeedOrganogramAsync(HrDbContext db, Guid companyId)
    {
        var grade = new Grade { Id = Guid.NewGuid(), Name = "G1", CreatedAt = DateTimeOffset.UtcNow };
        db.Grades.Add(grade);
        var dept = new Department
        {
            Id = Guid.NewGuid(),
            CompanyId = companyId,
            Name = "HR",
            CreatedAt = DateTimeOffset.UtcNow,
        };
        db.Departments.Add(dept);
        db.Designations.Add(new Designation
        {
            Id = Guid.NewGuid(),
            GradeId = grade.Id,
            Name = "Executive",
            CreatedAt = DateTimeOffset.UtcNow,
        });
        await db.SaveChangesAsync();
    }

    private static HrDbContext CreateDb()
    {
        var options = new DbContextOptionsBuilder<HrDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        return new HrDbContext(options);
    }

    private sealed class TestServiceScopeFactory(HrDbContext db, IEmployeeService employeeService) : IServiceScopeFactory
    {
        public IServiceScope CreateScope() => new TestScope(db, employeeService);

        private sealed class TestScope(HrDbContext db, IEmployeeService employeeService) : IServiceScope
        {
            public IServiceProvider ServiceProvider { get; } = new TestProvider(db, employeeService);
            public void Dispose() { }
        }

        private sealed class TestProvider(HrDbContext db, IEmployeeService employeeService) : IServiceProvider
        {
            public object? GetService(Type serviceType) =>
                serviceType == typeof(EmployeeImportRowProcessor)
                    ? new EmployeeImportRowProcessor(db, employeeService, new EmployeeOrganogramResolver(db))
                    : null;
        }
    }
}
