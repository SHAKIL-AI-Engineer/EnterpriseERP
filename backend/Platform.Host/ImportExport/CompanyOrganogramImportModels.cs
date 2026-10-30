namespace EnterpriseERP.Platform.Host.ImportExport;

public sealed record CompanyOrganogramImportRow
{
    public int RowIndex { get; init; }
    public string CompanyNameEn { get; init; } = "";
    public string CompanyNameBn { get; init; } = "";
    public string DepartmentNameEn { get; init; } = "";
    public string DepartmentNameBn { get; init; } = "";
    public string SectionNameEn { get; init; } = "";
    public string SectionNameBn { get; init; } = "";
    public string DesignationNameEn { get; init; } = "";
    public string DesignationNameBn { get; init; } = "";
    public string LineNameEn { get; init; } = "";
    public string LineNameBn { get; init; } = "";
    public bool IsActive { get; init; } = true;
}

public sealed class OrganogramRowError
{
    public int Row { get; init; }
    public string? Column { get; init; }
    public string Message { get; init; } = "";
}

public sealed class CompanyOrganogramImportResult
{
    public int TotalRows { get; set; }
    public int SuccessRows { get; set; }
    public int FailedRows { get; set; }
    public int CompaniesCreated { get; set; }
    public int DepartmentsCreated { get; set; }
    public int DepartmentsUpdated { get; set; }
    public int SectionsCreated { get; set; }
    public int SectionsUpdated { get; set; }
    public int DesignationsCreated { get; set; }
    public int DesignationsUpdated { get; set; }
    public int LinesCreated { get; set; }
    public int LinesUpdated { get; set; }
    public List<OrganogramRowError> Errors { get; set; } = [];
}
