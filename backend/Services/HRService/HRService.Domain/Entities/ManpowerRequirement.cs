namespace HRService.Domain.Entities;

public sealed class ManpowerRequirement
{
    public Guid Id { get; set; }
    public Guid CompanyId { get; set; }
    
    public Guid DepartmentId { get; set; }
    public Department? Department { get; set; }
    
    public Guid DesignationId { get; set; }
    public Designation? Designation { get; set; }
    
    public int RequiredNumber { get; set; }
    public DateTime RequestDate { get; set; }
    public DateTime? ExpectedJoiningDate { get; set; }
    
    public string Status { get; set; } = "Pending"; // Pending, Approved, Rejected, Filled
    public string? Remarks { get; set; }

    public DateTimeOffset CreatedAt { get; set; }
    public Guid? CreatedBy { get; set; }
    public DateTimeOffset? UpdatedAt { get; set; }
    public Guid? UpdatedBy { get; set; }
    public bool IsDeleted { get; set; }
    public DateTimeOffset? DeletedAt { get; set; }
}
