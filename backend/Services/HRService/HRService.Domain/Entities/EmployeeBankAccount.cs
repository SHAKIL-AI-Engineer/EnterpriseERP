namespace HRService.Domain.Entities;

public sealed class EmployeeBankAccount
{
    public Guid Id { get; set; }

    public Guid EmployeeId { get; set; }

    public Employee? Employee { get; set; }

    public string? BankName { get; set; }

    public string? BranchName { get; set; }

    public string? AccountNo { get; set; }

    public string? RoutingNo { get; set; }

    public string? MobileBankingType { get; set; } // e.g., bKash, Nagad

    public string? MobileBankingNo { get; set; }

    public bool IsPrimary { get; set; } = true;
}
