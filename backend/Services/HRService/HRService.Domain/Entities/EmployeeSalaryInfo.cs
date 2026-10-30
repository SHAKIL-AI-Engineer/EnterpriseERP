namespace HRService.Domain.Entities;

public sealed class EmployeeSalaryInfo
{
    public Guid Id { get; set; }

    public Guid EmployeeId { get; set; }

    public Employee? Employee { get; set; }

    public Guid CompanyId { get; set; }

    public decimal BasicSalary { get; set; }

    public decimal HouseRent { get; set; }

    public decimal MedicalAllowance { get; set; }

    public decimal ConveyanceAllowance { get; set; }

    public decimal FoodAllowance { get; set; }

    public decimal GrossSalary { get; set; }

    public DateTime EffectiveFrom { get; set; }

    public DateTime? EffectiveTo { get; set; }

    public bool IsCurrent { get; set; } = true;
}
