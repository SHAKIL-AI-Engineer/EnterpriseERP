using Erp.BuildingBlocks.ReportExport;
using HRService.Application.Employees;

namespace HRService.Tests;

public sealed class ReportExportMapperTests
{
    [Fact]
    public void Build_MapsEmployeeListColumns()
    {
        var rows = new List<EmployeeListItemDto>
        {
            new()
            {
                EmployeeID = "E001",
                FullName = "Jane Doe",
                DepartmentName = "HR",
                Status = "Active",
                JoinDate = new DateTime(2024, 1, 15),
            },
        };

        var request = ReportExportMapper.Build(
            "Employee List",
            "Excel",
            rows,
            [
                new ReportColumn<EmployeeListItemDto>("Employee ID", r => r.EmployeeID),
                new ReportColumn<EmployeeListItemDto>("Name", r => r.FullName),
                new ReportColumn<EmployeeListItemDto>("Department", r => r.DepartmentName ?? ""),
            ],
            ReportExportMapper.MetaWithFilters(new Dictionary<string, string> { ["CompanyId"] = Guid.NewGuid().ToString() }));

        Assert.Equal("Employee List", request.Title);
        Assert.Equal("Excel", request.Format);
        Assert.Equal(3, request.Columns.Count);
        Assert.Single(request.Rows);
        Assert.Equal("E001", request.Rows[0][0]);
        Assert.Contains("GeneratedAt", request.Meta!.Keys);
    }
}
