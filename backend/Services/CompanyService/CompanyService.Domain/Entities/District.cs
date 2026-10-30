namespace CompanyService.Domain.Entities;

public sealed class District
{
    public Guid Id { get; set; }
    public Guid DivisionId { get; set; }
    public Division? Division { get; set; }
    public string NameEn { get; set; } = string.Empty;
    public string NameBn { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
}
