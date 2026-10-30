namespace PayrollService.Application;

public static class CacheKeys
{
    public static string EmployeeSalary(Guid companyId, Guid employeeId) => $"payroll:employee-salary:{companyId}:{employeeId}";
    public static string SalaryStructure(Guid companyId) => $"payroll:salary-structure:{companyId}";
}
