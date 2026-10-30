using PayrollService.Domain.Entities;

namespace PayrollService.Application;

public sealed record SalaryStructureResult(
    decimal GrossSalary,
    decimal BasicSalary,
    decimal HouseRent,
    decimal MedicalAllowance,
    decimal FoodAllowance,
    decimal ConveyanceAllowance);

public sealed class SalaryStructureCalculator : ISalaryStructureCalculator
{
    public SalaryStructureResult Calculate(decimal grossSalary, PayrollPolicyTemplate template)
    {
        var fixedTotal = template.FixedMedical + template.FixedFood + template.FixedConveyance;
        var divisor = template.BasicDivisor <= 0 ? 1.5m : template.BasicDivisor;
        var basic = decimal.Round((grossSalary - fixedTotal) / divisor, 2, MidpointRounding.AwayFromZero);
        var houseRent = decimal.Round(grossSalary - basic - fixedTotal, 2, MidpointRounding.AwayFromZero);

        return new SalaryStructureResult(
            grossSalary,
            basic,
            houseRent,
            template.FixedMedical,
            template.FixedFood,
            template.FixedConveyance);
    }
}
