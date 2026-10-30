namespace LeaveService.Domain.Entities;

public sealed class LeaveTransaction
{
    public Guid Id { get; set; }
    public Guid CompanyId { get; set; }
    public Guid EmployeeId { get; set; }
    public Guid LeaveTypeId { get; set; }
    public Guid? LeaveApplicationId { get; set; }
    public DateTime TransactionDate { get; set; }
    public string TransactionType { get; set; } = string.Empty;
    public decimal Days { get; set; }
    public int YearNo { get; set; }
    public string? Remarks { get; set; }
}
