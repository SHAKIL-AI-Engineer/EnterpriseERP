using HRService.Application.Employees;

namespace HRService.Tests;

public sealed class EmployeeDetailsDtoTests
{
    [Fact]
    public void EmployeeDetailsDto_includes_sub_resource_collections()
    {
        var dto = new EmployeeDetailsDto
        {
            Id = Guid.NewGuid(),
            CompanyId = Guid.NewGuid(),
            PunchNumber = 1,
            EmployeeID = "EMP-0001",
            FullName = "Test",
            JoinDate = DateTime.UtcNow.Date,
            EmploymentType = "Permanent",
            Status = "Active",
            Addresses =
            [
                new EmployeeAddressItemDto(
                    Guid.NewGuid(), "Present", "Bangladesh", null, null, null, null, null, "Line 1"),
            ],
        };

        Assert.Single(dto.Addresses);
        Assert.Equal("Present", dto.Addresses[0].AddressType);
    }

    [Fact]
    public void TransferEmployeeDto_includes_reason()
    {
        var dto = new TransferEmployeeDto(
            Guid.NewGuid(), null, Guid.NewGuid(), null, null, null, "Promotion", DateTime.UtcNow.Date);

        Assert.Equal("Promotion", dto.Reason);
    }
}
