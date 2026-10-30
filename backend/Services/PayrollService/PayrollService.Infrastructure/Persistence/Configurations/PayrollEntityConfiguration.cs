using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PayrollService.Domain.Entities;

namespace PayrollService.Infrastructure.Persistence.Configurations;

public sealed class SalaryStructureConfiguration : IEntityTypeConfiguration<SalaryStructure>
{
    public void Configure(EntityTypeBuilder<SalaryStructure> b)
    {
        b.ToTable("SalaryStructures");
        b.HasKey(x => x.Id);
        b.HasIndex(x => new { x.CompanyId, x.StructureCode }).IsUnique();
        b.Property(x => x.StructureCode).HasMaxLength(50).IsRequired();
        b.Property(x => x.StructureName).HasMaxLength(150).IsRequired();
        b.HasMany(x => x.Components).WithOne().HasForeignKey(x => x.SalaryStructureId).OnDelete(DeleteBehavior.Cascade);
    }
}

public sealed class SalaryStructureComponentConfiguration : IEntityTypeConfiguration<SalaryStructureComponent>
{
    public void Configure(EntityTypeBuilder<SalaryStructureComponent> b)
    {
        b.ToTable("SalaryStructureComponents");
        b.HasKey(x => x.Id);
        b.HasIndex(x => new { x.SalaryStructureId, x.ComponentCode }).IsUnique();
        b.Property(x => x.ComponentCode).HasMaxLength(50).IsRequired();
        b.Property(x => x.ComponentName).HasMaxLength(150).IsRequired();
        b.Property(x => x.ComponentType).HasMaxLength(50).IsRequired();
        b.Property(x => x.CalculationType).HasMaxLength(50).IsRequired();
        b.Property(x => x.Amount).HasPrecision(18, 2);
        b.Property(x => x.Percentage).HasPrecision(18, 2);
        b.Property(x => x.BasedOnComponentCode).HasMaxLength(50);
    }
}

public sealed class EmployeeSalaryConfiguration : IEntityTypeConfiguration<EmployeeSalary>
{
    public void Configure(EntityTypeBuilder<EmployeeSalary> b)
    {
        b.ToTable("EmployeeSalaries");
        b.HasKey(x => x.Id);
        b.HasIndex(x => new { x.CompanyId, x.EmployeeId, x.IsCurrent }).HasFilter("[IsCurrent] = 1").IsUnique();
        b.Property(x => x.SalaryCalculationType).HasMaxLength(50).HasDefaultValue("Monthly");
        ConfigureMoney(b.Property(x => x.GrossSalary));
        ConfigureMoney(b.Property(x => x.BasicSalary));
        ConfigureMoney(b.Property(x => x.HouseRent));
        ConfigureMoney(b.Property(x => x.MedicalAllowance));
        ConfigureMoney(b.Property(x => x.ConveyanceAllowance));
        ConfigureMoney(b.Property(x => x.FoodAllowance));
    }

    private static void ConfigureMoney(PropertyBuilder<decimal> p) => p.HasPrecision(18, 2);
}

public sealed class PayrollPolicyTemplateConfiguration : IEntityTypeConfiguration<PayrollPolicyTemplate>
{
    public void Configure(EntityTypeBuilder<PayrollPolicyTemplate> b)
    {
        b.ToTable("PayrollPolicyTemplates");
        b.HasKey(x => x.Id);
        b.HasIndex(x => x.PolicyCode).IsUnique();
        b.Property(x => x.PolicyCode).HasMaxLength(80).IsRequired();
        b.Property(x => x.PolicyName).HasMaxLength(200).IsRequired();
        b.Property(x => x.Status).HasMaxLength(50).HasDefaultValue("Active");
        b.Property(x => x.ComplianceMode).HasMaxLength(50).IsRequired();
        b.Property(x => x.OtBase).HasMaxLength(20).IsRequired();
        b.Property(x => x.AbsentBase).HasMaxLength(20).IsRequired();
        b.Property(x => x.AbsentDayDivisor).HasMaxLength(30).IsRequired();
        b.Property(x => x.MonthDayCalculationType).HasMaxLength(30).IsRequired();
        b.Property(x => x.FixedMedical).HasPrecision(18, 2);
        b.Property(x => x.FixedFood).HasPrecision(18, 2);
        b.Property(x => x.FixedConveyance).HasPrecision(18, 2);
        b.Property(x => x.BasicDivisor).HasPrecision(18, 4);
        b.Property(x => x.OtDivisor).HasPrecision(18, 2);
        b.Property(x => x.OtMultiplier).HasPrecision(18, 2);
    }
}

public sealed class CompanyPayrollPolicyAssignmentConfiguration : IEntityTypeConfiguration<CompanyPayrollPolicyAssignment>
{
    public void Configure(EntityTypeBuilder<CompanyPayrollPolicyAssignment> b)
    {
        b.ToTable("CompanyPayrollPolicyAssignments");
        b.HasKey(x => x.Id);
        b.HasIndex(x => new { x.CompanyId, x.IsActive }).HasFilter("[IsActive] = 1");
        b.Property(x => x.FixedOvertimeRate).HasPrecision(18, 2);
        b.HasOne(x => x.PolicyTemplate)
            .WithMany()
            .HasForeignKey(x => x.PolicyTemplateId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

public sealed class PayrollRunConfiguration : IEntityTypeConfiguration<PayrollRun>
{
    public void Configure(EntityTypeBuilder<PayrollRun> b)
    {
        b.ToTable("PayrollRuns");
        b.HasKey(x => x.Id);
        b.HasIndex(x => new { x.CompanyId, x.YearNo, x.MonthNo, x.RunNo }).IsUnique();
        b.Property(x => x.RunStatus).HasMaxLength(50).IsRequired();
        b.Property(x => x.ProcessingMode).HasMaxLength(50).IsRequired();
        b.Property(x => x.AppliedPolicyCode).HasMaxLength(80);
        b.Property(x => x.OvertimeCalculationType).HasMaxLength(50);
        b.Property(x => x.FixedOvertimeRate).HasPrecision(18, 2);
    }
}

public sealed class EmployeePayrollConfiguration : IEntityTypeConfiguration<EmployeePayroll>
{
    public void Configure(EntityTypeBuilder<EmployeePayroll> b)
    {
        b.ToTable("EmployeePayrolls");
        b.HasKey(x => x.Id);
        b.HasIndex(x => new { x.CompanyId, x.EmployeeId, x.YearNo, x.MonthNo }).IsUnique();
        b.Property(x => x.ProcessingMode).HasMaxLength(50).IsRequired();
        b.Property(x => x.SalaryCalculationType).HasMaxLength(50).IsRequired();
        b.Property(x => x.OvertimeCalculationType).HasMaxLength(50);
        b.Property(x => x.AppliedPolicyCode).HasMaxLength(80);
        b.Property(x => x.AppliedPolicySnapshotJson).HasColumnType("nvarchar(max)");
        b.Property(x => x.Status).HasMaxLength(50).HasDefaultValue("Draft");
        foreach (var property in typeof(EmployeePayroll).GetProperties().Where(p => p.PropertyType == typeof(decimal)))
        {
            b.Property(property.Name).HasPrecision(18, 2);
        }
        b.HasMany(x => x.Earnings).WithOne().HasForeignKey(x => x.EmployeePayrollId).OnDelete(DeleteBehavior.Cascade);
        b.HasMany(x => x.Deductions).WithOne().HasForeignKey(x => x.EmployeePayrollId).OnDelete(DeleteBehavior.Cascade);
    }
}

public sealed class PayrollEarningConfiguration : IEntityTypeConfiguration<PayrollEarning>
{
    public void Configure(EntityTypeBuilder<PayrollEarning> b)
    {
        b.ToTable("PayrollEarnings");
        b.HasKey(x => x.Id);
        b.Property(x => x.EarningCode).HasMaxLength(50).IsRequired();
        b.Property(x => x.EarningName).HasMaxLength(150).IsRequired();
        b.Property(x => x.Amount).HasPrecision(18, 2);
        b.Property(x => x.Remarks).HasMaxLength(300);
    }
}

public sealed class PayrollDeductionConfiguration : IEntityTypeConfiguration<PayrollDeduction>
{
    public void Configure(EntityTypeBuilder<PayrollDeduction> b)
    {
        b.ToTable("PayrollDeductions");
        b.HasKey(x => x.Id);
        b.Property(x => x.DeductionCode).HasMaxLength(50).IsRequired();
        b.Property(x => x.DeductionName).HasMaxLength(150).IsRequired();
        b.Property(x => x.Amount).HasPrecision(18, 2);
        b.Property(x => x.Remarks).HasMaxLength(300);
    }
}

public sealed class RemainingPayrollConfigurations :
    IEntityTypeConfiguration<SalaryIncrementRequestEntity>,
    IEntityTypeConfiguration<SalaryAdvance>,
    IEntityTypeConfiguration<SalaryAdvanceInstallment>,
    IEntityTypeConfiguration<AllowanceBill>,
    IEntityTypeConfiguration<FinalSettlement>,
    IEntityTypeConfiguration<PayrollDeductionEntry>,
    IEntityTypeConfiguration<PayrollAuditLog>
{
    public void Configure(EntityTypeBuilder<SalaryIncrementRequestEntity> b)
    {
        b.ToTable("SalaryIncrementRequests");
        b.HasKey(x => x.Id);
        b.Property(x => x.Status).HasMaxLength(50).HasDefaultValue("Pending");
        b.Property(x => x.Reason).HasMaxLength(500);
        Money(b, nameof(SalaryIncrementRequestEntity.OldGrossSalary), nameof(SalaryIncrementRequestEntity.NewGrossSalary), nameof(SalaryIncrementRequestEntity.OldBasicSalary), nameof(SalaryIncrementRequestEntity.NewBasicSalary), nameof(SalaryIncrementRequestEntity.IncrementAmount), nameof(SalaryIncrementRequestEntity.IncrementPercentage));
    }

    public void Configure(EntityTypeBuilder<SalaryAdvance> b)
    {
        b.ToTable("SalaryAdvances");
        b.HasKey(x => x.Id);
        b.HasIndex(x => new { x.CompanyId, x.AdvanceNo }).IsUnique();
        b.Property(x => x.AdvanceNo).HasMaxLength(100).IsRequired();
        b.Property(x => x.Status).HasMaxLength(50).HasDefaultValue("Pending");
        Money(b, nameof(SalaryAdvance.AdvanceAmount), nameof(SalaryAdvance.PaidAmount), nameof(SalaryAdvance.BalanceAmount), nameof(SalaryAdvance.InstallmentAmount));
        b.HasMany(x => x.Installments).WithOne().HasForeignKey(x => x.SalaryAdvanceId).OnDelete(DeleteBehavior.Cascade);
    }

    public void Configure(EntityTypeBuilder<SalaryAdvanceInstallment> b)
    {
        b.ToTable("SalaryAdvanceInstallments");
        b.HasKey(x => x.Id);
        b.HasIndex(x => new { x.SalaryAdvanceId, x.YearNo, x.MonthNo }).IsUnique();
        b.Property(x => x.Status).HasMaxLength(50).HasDefaultValue("Pending");
        Money(b, nameof(SalaryAdvanceInstallment.InstallmentAmount), nameof(SalaryAdvanceInstallment.PaidAmount));
    }

    public void Configure(EntityTypeBuilder<AllowanceBill> b)
    {
        b.ToTable("AllowanceBills");
        b.HasKey(x => x.Id);
        b.Property(x => x.AllowanceType).HasMaxLength(50).IsRequired();
        b.Property(x => x.Status).HasMaxLength(50).HasDefaultValue("Pending");
        b.Property(x => x.Remarks).HasMaxLength(300);
        Money(b, nameof(AllowanceBill.Quantity), nameof(AllowanceBill.Rate), nameof(AllowanceBill.Amount));
    }

    public void Configure(EntityTypeBuilder<FinalSettlement> b)
    {
        b.ToTable("FinalSettlements");
        b.HasKey(x => x.Id);
        b.Property(x => x.Status).HasMaxLength(50).HasDefaultValue("Pending");
        Money(b, nameof(FinalSettlement.SalaryPayable), nameof(FinalSettlement.EarnLeaveAmount), nameof(FinalSettlement.ServiceBenefitAmount), nameof(FinalSettlement.GratuityAmount), nameof(FinalSettlement.AdvanceDeduction), nameof(FinalSettlement.OtherDeduction), nameof(FinalSettlement.NetPayable));
    }

    public void Configure(EntityTypeBuilder<PayrollDeductionEntry> b)
    {
        b.ToTable("PayrollDeductionEntries");
        b.HasKey(x => x.Id);
        b.Property(x => x.DeductionType).HasMaxLength(50).IsRequired();
        b.Property(x => x.Status).HasMaxLength(50).HasDefaultValue("Approved");
        b.Property(x => x.Remarks).HasMaxLength(300);
        Money(b, nameof(PayrollDeductionEntry.Amount));
    }

    public void Configure(EntityTypeBuilder<PayrollAuditLog> b)
    {
        b.ToTable("PayrollAuditLogs");
        b.HasKey(x => x.Id);
        b.Property(x => x.EntityName).HasMaxLength(150).IsRequired();
        b.Property(x => x.Action).HasMaxLength(100).IsRequired();
        b.Property(x => x.Remarks).HasMaxLength(500);
    }

    private static void Money<T>(EntityTypeBuilder<T> b, params string[] names) where T : class
    {
        foreach (var name in names)
        {
            b.Property<decimal>(name).HasPrecision(18, 2);
        }
    }
}
