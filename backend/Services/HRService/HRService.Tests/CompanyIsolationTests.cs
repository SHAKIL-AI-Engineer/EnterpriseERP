using Erp.BuildingBlocks.CommonSecurity;
using HRService.Domain.Entities;
using HRService.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace HRService.Tests;

public sealed class CompanyIsolationTests
{
    [Fact]
    public async Task Employee_and_owned_records_are_filtered_for_each_context_instance()
    {
        var options = new DbContextOptionsBuilder<HrDbContext>().UseInMemoryDatabase(Guid.NewGuid().ToString()).Options;
        var first = Guid.NewGuid(); var second = Guid.NewGuid(); var employeeId = Guid.NewGuid(); var addressId = Guid.NewGuid();
        await using (var seed = new HrDbContext(options))
        {
            seed.Employees.Add(new Employee { Id = employeeId, CompanyId = first, FullName = "Fixture", EmployeeID = "TEST", PunchNumber = 1 });
            seed.EmployeeAddresses.Add(new EmployeeAddress { Id = addressId, EmployeeId = employeeId, AddressType = "Present", Country = "Bangladesh" });
            await seed.SaveChangesAsync();
        }
        await using var denied = new HrDbContext(options, Scope(second));
        Assert.Empty(await denied.Employees.ToListAsync());
        Assert.Null(await denied.EmployeeAddresses.FindAsync(addressId));
        await using var allowed = new HrDbContext(options, Scope(first));
        Assert.Single(await allowed.Employees.ToListAsync());
        Assert.Single(await allowed.EmployeeAddresses.ToListAsync());
    }

    [Fact]
    public async Task Cannot_insert_another_company_or_attach_child_to_its_employee()
    {
        var options = new DbContextOptionsBuilder<HrDbContext>().UseInMemoryDatabase(Guid.NewGuid().ToString()).Options;
        var first = Guid.NewGuid(); var second = Guid.NewGuid(); var employeeId = Guid.NewGuid();
        await using (var seed = new HrDbContext(options))
        {
            seed.Employees.Add(new Employee { Id = employeeId, CompanyId = first, FullName = "Fixture", EmployeeID = "TEST", PunchNumber = 1 });
            await seed.SaveChangesAsync();
        }
        await using var scoped = new HrDbContext(options, Scope(second));
        scoped.Employees.Add(new Employee { Id = Guid.NewGuid(), CompanyId = first, FullName = "Forbidden", EmployeeID = "TEST2", PunchNumber = 2 });
        await Assert.ThrowsAsync<UnauthorizedAccessException>(() => scoped.SaveChangesAsync());
        scoped.ChangeTracker.Clear();
        scoped.EmployeeAddresses.Add(new EmployeeAddress { Id = Guid.NewGuid(), EmployeeId = employeeId, AddressType = "Present", Country = "Bangladesh" });
        await Assert.ThrowsAsync<UnauthorizedAccessException>(() => scoped.SaveChangesAsync());
    }

    private static ITenantContext Scope(Guid company) => new TestTenant(company);
    private sealed class TestTenant(Guid company) : ITenantContext
    {
        public Guid? UserId => Guid.NewGuid(); public bool IsAuthenticated => true; public bool IsSuperAdmin => false;
        public string TenantScope => "company"; public IReadOnlyList<Guid> AllowedCompanyIds => [company];
        public Guid? DefaultCompanyId => company; public Guid? ActiveCompanyId => company;
        public bool HasAccessToCompany(Guid id) => id == company;
        public void EnsureCompanyAccess(Guid id) { if (id != company) throw new UnauthorizedAccessException(); }
    }
}
