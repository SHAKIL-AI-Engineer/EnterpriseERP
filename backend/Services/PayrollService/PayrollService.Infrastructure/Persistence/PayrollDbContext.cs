using Erp.BuildingBlocks.CommonSecurity;
using Microsoft.EntityFrameworkCore;
using PayrollService.Application;
using PayrollService.Domain.Entities;

namespace PayrollService.Infrastructure.Persistence;

public sealed class PayrollDbContext(DbContextOptions<PayrollDbContext> options, ITenantContext? tenant = null) : TenantDbContext(options, tenant), IPayrollDbContext
{
    public DbSet<SalaryStructure> SalaryStructures => Set<SalaryStructure>();
    public DbSet<SalaryStructureComponent> SalaryStructureComponents => Set<SalaryStructureComponent>();
    public DbSet<EmployeeSalary> EmployeeSalaries => Set<EmployeeSalary>();
    public DbSet<SalaryIncrementRequestEntity> SalaryIncrementRequests => Set<SalaryIncrementRequestEntity>();
    public DbSet<PayrollRun> PayrollRuns => Set<PayrollRun>();
    public DbSet<EmployeePayroll> EmployeePayrolls => Set<EmployeePayroll>();
    public DbSet<PayrollEarning> PayrollEarnings => Set<PayrollEarning>();
    public DbSet<PayrollDeduction> PayrollDeductions => Set<PayrollDeduction>();
    public DbSet<SalaryAdvance> SalaryAdvances => Set<SalaryAdvance>();
    public DbSet<SalaryAdvanceInstallment> SalaryAdvanceInstallments => Set<SalaryAdvanceInstallment>();
    public DbSet<AllowanceBill> AllowanceBills => Set<AllowanceBill>();
    public DbSet<FinalSettlement> FinalSettlements => Set<FinalSettlement>();
    public DbSet<PayrollDeductionEntry> PayrollDeductionEntries => Set<PayrollDeductionEntry>();
    public DbSet<PayrollPolicyTemplate> PayrollPolicyTemplates => Set<PayrollPolicyTemplate>();
    public DbSet<CompanyPayrollPolicyAssignment> CompanyPayrollPolicyAssignments => Set<CompanyPayrollPolicyAssignment>();
    public DbSet<PayrollAuditLog> PayrollAuditLogs => Set<PayrollAuditLog>();

    IQueryable<SalaryStructure> IPayrollDbContext.SalaryStructures => SalaryStructures;
    IQueryable<SalaryStructureComponent> IPayrollDbContext.SalaryStructureComponents => SalaryStructureComponents;
    IQueryable<PayrollPolicyTemplate> IPayrollDbContext.PayrollPolicyTemplates => PayrollPolicyTemplates;
    IQueryable<CompanyPayrollPolicyAssignment> IPayrollDbContext.CompanyPayrollPolicyAssignments => CompanyPayrollPolicyAssignments;
    IQueryable<EmployeeSalary> IPayrollDbContext.EmployeeSalaries => EmployeeSalaries;
    IQueryable<SalaryIncrementRequestEntity> IPayrollDbContext.SalaryIncrementRequests => SalaryIncrementRequests;
    IQueryable<PayrollRun> IPayrollDbContext.PayrollRuns => PayrollRuns;
    IQueryable<EmployeePayroll> IPayrollDbContext.EmployeePayrolls => EmployeePayrolls;
    IQueryable<PayrollEarning> IPayrollDbContext.PayrollEarnings => PayrollEarnings;
    IQueryable<PayrollDeduction> IPayrollDbContext.PayrollDeductions => PayrollDeductions;
    IQueryable<SalaryAdvance> IPayrollDbContext.SalaryAdvances => SalaryAdvances;
    IQueryable<SalaryAdvanceInstallment> IPayrollDbContext.SalaryAdvanceInstallments => SalaryAdvanceInstallments;
    IQueryable<AllowanceBill> IPayrollDbContext.AllowanceBills => AllowanceBills;
    IQueryable<FinalSettlement> IPayrollDbContext.FinalSettlements => FinalSettlements;
    IQueryable<PayrollDeductionEntry> IPayrollDbContext.PayrollDeductionEntries => PayrollDeductionEntries;
    IQueryable<PayrollAuditLog> IPayrollDbContext.PayrollAuditLogs => PayrollAuditLogs;

    void IPayrollDbContext.Add<TEntity>(TEntity entity) => Set<TEntity>().Add(entity);

    void IPayrollDbContext.Remove<TEntity>(TEntity entity) => Set<TEntity>().Remove(entity);

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(PayrollDbContext).Assembly);
        modelBuilder.Entity<PayrollPolicyTemplate>().HasData(PayrollPolicyTemplateSeed.CreateTemplates());
        modelBuilder.Entity<SalaryAdvance>().Property(x => x.Status).IsConcurrencyToken();
        modelBuilder.Entity<AllowanceBill>().Property(x => x.Status).IsConcurrencyToken();
        modelBuilder.Entity<FinalSettlement>().Property(x => x.Status).IsConcurrencyToken();
        modelBuilder.Entity<SalaryIncrementRequestEntity>().Property(x => x.Status).IsConcurrencyToken();
        ApplyCompanyFilters(modelBuilder);
    }
}
