using Erp.BuildingBlocks.Contracts.Pagination;
using HRService.Application.Employees;
using HRService.Domain.Entities;
using HRService.Infrastructure.Persistence;
using HRService.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;

namespace HRService.Tests;

public sealed class EmployeePaginationTests
{
    [Fact]
    public async Task ListAsync_default_page_size_is_50()
    {
        await using var db = CreateDb();
        var companyId = await SeedCompanyWithEmployeesAsync(db, 60);
        var service = new EmployeeReadService(db);

        var result = await service.ListAsync(new EmployeeListQuery { CompanyId = companyId });

        Assert.Equal(50, result.Pagination.PageSize);
        Assert.Equal(50, result.Data.Count);
        Assert.Equal(60, result.Pagination.TotalCount);
        Assert.Equal(2, result.Pagination.TotalPages);
        Assert.False(result.Pagination.GetAll);
    }

    [Fact]
    public async Task ListAsync_getAll_returns_all_rows_but_total_pages_uses_page_size_50()
    {
        await using var db = CreateDb();
        var companyId = await SeedCompanyWithEmployeesAsync(db, 60);
        var service = new EmployeeReadService(db);

        var result = await service.ListAsync(new EmployeeListQuery
        {
            CompanyId = companyId,
            Page = 1,
            PageSize = 50,
            GetAll = true,
        });

        Assert.Equal(60, result.Data.Count);
        Assert.Equal(50, result.Pagination.PageSize);
        Assert.Equal(60, result.Pagination.TotalCount);
        Assert.Equal(2, result.Pagination.TotalPages);
        Assert.True(result.Pagination.GetAll);
    }

    [Fact]
    public async Task ListAsync_page_size_10_returns_only_one_page()
    {
        await using var db = CreateDb();
        var companyId = await SeedCompanyWithEmployeesAsync(db, 25);
        var service = new EmployeeReadService(db);

        var result = await service.ListAsync(new EmployeeListQuery
        {
            CompanyId = companyId,
            Page = 2,
            PageSize = 10,
        });

        Assert.Equal(10, result.Data.Count);
        Assert.Equal(2, result.Pagination.Page);
        Assert.Equal(10, result.Pagination.PageSize);
        Assert.Equal(25, result.Pagination.TotalCount);
        Assert.Equal(3, result.Pagination.TotalPages);
    }

    [Fact]
    public async Task ListAsync_status_filter_reduces_total_count()
    {
        await using var db = CreateDb();
        var companyId = await SeedCompanyWithEmployeesAsync(db, 10, activeCount: 4);
        var service = new EmployeeReadService(db);

        var result = await service.ListAsync(new EmployeeListQuery
        {
            CompanyId = companyId,
            Status = "Active",
            PageSize = 10,
        });

        Assert.Equal(4, result.Pagination.TotalCount);
        Assert.Equal(4, result.Data.Count);
    }

    [Fact]
    public async Task ListAsync_sort_by_name_asc()
    {
        await using var db = CreateDb();
        var companyId = Guid.NewGuid();
        db.Employees.AddRange(
            CreateEmployee(companyId, 1, "EMP-003", "Charlie", DateTime.UtcNow.AddDays(-1)),
            CreateEmployee(companyId, 2, "EMP-001", "Alice", DateTime.UtcNow.AddDays(-2)),
            CreateEmployee(companyId, 3, "EMP-002", "Bob", DateTime.UtcNow));
        await db.SaveChangesAsync();

        var service = new EmployeeReadService(db);
        var result = await service.ListAsync(new EmployeeListQuery
        {
            CompanyId = companyId,
            SortBy = "name",
            SortOrder = "asc",
            PageSize = 10,
        });

        Assert.Equal(["Alice", "Bob", "Charlie"], result.Data.Select(x => x.FullName).ToArray());
    }

    private static Employee CreateEmployee(
        Guid companyId,
        int punch,
        string employeeId,
        string fullName,
        DateTime createdAt) =>
        new()
        {
            Id = Guid.NewGuid(),
            CompanyId = companyId,
            PunchNumber = punch,
            EmployeeID = employeeId,
            FullName = fullName,
            JoinDate = DateTime.UtcNow.Date,
            EmploymentType = "Permanent",
            Status = "Active",
            CreatedAt = createdAt,
        };

    private static async Task<Guid> SeedCompanyWithEmployeesAsync(
        HrDbContext db,
        int count,
        int activeCount = -1)
    {
        var companyId = Guid.NewGuid();
        for (var i = 1; i <= count; i++)
        {
            var status = activeCount >= 0 && i > activeCount ? "Inactive" : "Active";
            var employee = CreateEmployee(
                companyId,
                i,
                $"EMP-{i:D4}",
                $"Employee {i}",
                DateTime.UtcNow.AddMinutes(-i));
            employee.Status = status;
            db.Employees.Add(employee);
        }

        await db.SaveChangesAsync();
        return companyId;
    }

    private static HrDbContext CreateDb()
    {
        var options = new DbContextOptionsBuilder<HrDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        return new HrDbContext(options);
    }
}
