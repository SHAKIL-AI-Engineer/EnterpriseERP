namespace EnterpriseERP.Platform.Host.ImportExport;

public sealed record AddressImportRow
{
    public int RowIndex { get; init; }
    public string CountryNameEn { get; init; } = "";
    public string CountryNameBn { get; init; } = "";
    public string DivisionNameEn { get; init; } = "";
    public string DivisionNameBn { get; init; } = "";
    public string DistrictNameEn { get; init; } = "";
    public string DistrictNameBn { get; init; } = "";
    public string ThanaNameEn { get; init; } = "";
    public string ThanaNameBn { get; init; } = "";
    public string PostOfficeNameEn { get; init; } = "";
    public string PostOfficeNameBn { get; init; } = "";
    public string PostCode { get; init; } = "";
    public bool IsActive { get; init; } = true;
}

public sealed class AddressImportResult
{
    public int TotalRows { get; set; }
    public int SuccessRows { get; set; }
    public int FailedRows { get; set; }
    public int CountriesCreated { get; set; }
    public int CountriesUpdated { get; set; }
    public int DivisionsCreated { get; set; }
    public int DivisionsUpdated { get; set; }
    public int DistrictsCreated { get; set; }
    public int DistrictsUpdated { get; set; }
    public int ThanasCreated { get; set; }
    public int ThanasUpdated { get; set; }
    public int PostOfficesCreated { get; set; }
    public int PostOfficesUpdated { get; set; }
    public List<OrganogramRowError> Errors { get; set; } = [];
}
