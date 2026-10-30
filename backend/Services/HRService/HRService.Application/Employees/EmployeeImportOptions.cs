namespace HRService.Application.Employees;

public sealed class EmployeeImportOptions
{
    public const string SectionName = "EmployeeImport";

    /// <summary>Max rows processed in parallel per import-upsert request (each row uses its own DB scope).</summary>
    public int MaxParallelRows { get; set; } = 8;
}
