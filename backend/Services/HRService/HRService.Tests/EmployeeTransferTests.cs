using HRService.Application.Employees;
using HRService.Domain.Entities;
using HRService.Infrastructure.Persistence;
using HRService.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;

namespace HRService.Tests;

public sealed class EmployeeTransferTests
{
    [Fact]
    public async Task TransferAsync_group_only_change_updates_current_job_in_place()
    {
        await using var db = CreateDb();
        var (employee, deptId, desigId, jobId) = await SeedEmployeeAsync(db);
        var service = new EmployeeService(db);
        var newGroupId = Guid.NewGuid();

        await service.TransferAsync(
            employee.Id,
            new TransferEmployeeDto(
                deptId,
                null,
                desigId,
                null,
                null,
                null,
                null,
                DateTime.Today,
                newGroupId),
            CancellationToken.None);

        var job = await db.EmployeeJobInfos.SingleAsync(j => j.Id == jobId);
        Assert.True(job.IsCurrent);
        Assert.Equal(newGroupId, job.GroupId);
        Assert.Equal(1, await db.EmployeeJobInfos.CountAsync(j => j.EmployeeId == employee.Id));
        Assert.Equal(0, await db.EmployeeTransfers.CountAsync());
    }

    [Fact]
    public async Task TransferAsync_clear_group_sets_null_in_place()
    {
        await using var db = CreateDb();
        var existingGroupId = Guid.NewGuid();
        var (employee, deptId, desigId, jobId) = await SeedEmployeeAsync(db, existingGroupId);
        var service = new EmployeeService(db);

        await service.TransferAsync(
            employee.Id,
            new TransferEmployeeDto(
                deptId,
                null,
                desigId,
                null,
                null,
                null,
                null,
                DateTime.Today,
                null),
            CancellationToken.None);

        var job = await db.EmployeeJobInfos.SingleAsync(j => j.Id == jobId);
        Assert.True(job.IsCurrent);
        Assert.Null(job.GroupId);
        Assert.Equal(0, await db.EmployeeTransfers.CountAsync());
    }

    [Fact]
    public async Task TransferAsync_department_and_group_change_creates_transfer_record()
    {
        await using var db = CreateDb();
        var (employee, deptId, desigId, _) = await SeedEmployeeAsync(db);
        var newDeptId = Guid.NewGuid();
        var newGroupId = Guid.NewGuid();
        db.Departments.Add(new Department
        {
            Id = newDeptId,
            CompanyId = employee.CompanyId,
            Name = "New Dept",
            CreatedAt = DateTimeOffset.UtcNow,
        });
        await db.SaveChangesAsync();

        var service = new EmployeeService(db);
        await service.TransferAsync(
            employee.Id,
            new TransferEmployeeDto(
                newDeptId,
                null,
                desigId,
                null,
                null,
                null,
                null,
                DateTime.Today,
                newGroupId),
            CancellationToken.None);

        Assert.Equal(1, await db.EmployeeTransfers.CountAsync());
        Assert.Equal(2, await db.EmployeeJobInfos.CountAsync(j => j.EmployeeId == employee.Id));
        var current = await db.EmployeeJobInfos.SingleAsync(j => j.EmployeeId == employee.Id && j.IsCurrent);
        Assert.Equal(newDeptId, current.DepartmentId);
        Assert.Equal(newGroupId, current.GroupId);
    }

    [Fact]
    public async Task UpdateSalaryAsync_updates_existing_row_without_execute_update()
    {
        await using var db = CreateDb();
        var (employee, _, _, _) = await SeedEmployeeAsync(db);
        var salaryId = Guid.NewGuid();
        db.EmployeeSalaryInfos.Add(new EmployeeSalaryInfo
        {
            Id = salaryId,
            CompanyId = employee.CompanyId,
            EmployeeId = employee.Id,
            BasicSalary = 1000m,
            HouseRent = 0m,
            MedicalAllowance = 0m,
            ConveyanceAllowance = 0m,
            FoodAllowance = 0m,
            GrossSalary = 1000m,
            EffectiveFrom = DateTime.Today,
            IsCurrent = true,
        });
        await db.SaveChangesAsync();

        var service = new EmployeeService(db);
        await service.UpdateSalaryAsync(
            employee.Id,
            new UpdateSalaryDto(1500m, 0m, 0m, 0m, 0m, DateTime.Today),
            CancellationToken.None);

        var salary = await db.EmployeeSalaryInfos.SingleAsync(s => s.Id == salaryId);
        Assert.Equal(1500m, salary.BasicSalary);
        Assert.Equal(1500m, salary.GrossSalary);
        Assert.Equal(1, await db.EmployeeSalaryInfos.CountAsync(s => s.EmployeeId == employee.Id));
    }

    private static HrDbContext CreateDb()
    {
        var options = new DbContextOptionsBuilder<HrDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        return new HrDbContext(options);
    }

    private static async Task<(Employee employee, Guid deptId, Guid desigId, Guid jobId)> SeedEmployeeAsync(
        HrDbContext db,
        Guid? groupId = null)
    {
        var companyId = Guid.NewGuid();
        var deptId = Guid.NewGuid();
        var desigId = Guid.NewGuid();
        var gradeId = Guid.NewGuid();
        var employeeId = Guid.NewGuid();
        var jobId = Guid.NewGuid();

        db.Grades.Add(new Grade { Id = gradeId, Name = "G1", CreatedAt = DateTimeOffset.UtcNow });
        db.Departments.Add(new Department
        {
            Id = deptId,
            CompanyId = companyId,
            Name = "Dept",
            CreatedAt = DateTimeOffset.UtcNow,
        });
        db.Designations.Add(new Designation
        {
            Id = desigId,
            GradeId = gradeId,
            Name = "Desig",
            CreatedAt = DateTimeOffset.UtcNow,
        });

        var employee = new Employee
        {
            Id = employeeId,
            CompanyId = companyId,
            PunchNumber = 1001,
            EmployeeID = "EMP-0001",
            FullName = "Test Employee",
            JoinDate = DateTime.Today,
            EmploymentType = "Permanent",
            Status = "Active",
            CreatedAt = DateTime.UtcNow,
        };

        employee.JobInfos.Add(new EmployeeJobInfo
        {
            Id = jobId,
            CompanyId = companyId,
            EmployeeId = employeeId,
            DepartmentId = deptId,
            DesignationId = desigId,
            GroupId = groupId,
            EffectiveFrom = DateTime.Today,
            IsCurrent = true,
        });

        db.Employees.Add(employee);
        await db.SaveChangesAsync();
        return (employee, deptId, desigId, jobId);
    }
}
