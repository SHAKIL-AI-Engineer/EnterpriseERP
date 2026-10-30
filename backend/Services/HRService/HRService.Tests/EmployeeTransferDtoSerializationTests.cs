using System.Text.Json;
using Erp.BuildingBlocks.CommonResponses;
using Erp.BuildingBlocks.Contracts.Pagination;
using HRService.Application.Employees;

namespace HRService.Tests;

public sealed class EmployeeTransferDtoSerializationTests
{
    private static readonly JsonSerializerOptions CamelCase = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
    };

    [Fact]
    public void Serialize_paginated_transfer_response_does_not_throw()
    {
        var employeeEntityId = Guid.Parse("11111111-1111-1111-1111-111111111111");
        var dto = new EmployeeTransferDto
        {
            Id = Guid.NewGuid(),
            EmployeeEntityId = employeeEntityId,
            EmployeeCode = "EMP-0042",
            FullName = "Test",
            EffectiveDate = DateTime.UtcNow.Date,
            CreatedAt = DateTimeOffset.UtcNow,
        };
        var response = PaginatedApiResponse<EmployeeTransferDto>.Ok(
            [dto],
            PaginationMetadata.Create(1, 50, 1, false),
            "ok",
            "trace");

        var ex = Record.Exception(() => JsonSerializer.Serialize(response, CamelCase));
        Assert.Null(ex);
    }

    [Fact]
    public void Serialize_employee_transfer_dto_uses_distinct_json_names_for_ids()
    {
        var employeeEntityId = Guid.Parse("11111111-1111-1111-1111-111111111111");
        var dto = new EmployeeTransferDto
        {
            Id = Guid.Parse("22222222-2222-2222-2222-222222222222"),
            EmployeeEntityId = employeeEntityId,
            EmployeeCode = "EMP-0042",
            FullName = "Test Employee",
            FromDepartmentName = "Old Dept",
            ToDepartmentName = "New Dept",
            EffectiveDate = new DateTime(2026, 1, 15),
            Reason = "Promotion",
            CreatedAt = DateTimeOffset.UtcNow,
        };

        var json = JsonSerializer.Serialize(dto, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        });

        Assert.Contains("\"employeeEntityId\":\"11111111-1111-1111-1111-111111111111\"", json);
        Assert.Contains("\"employeeCode\":\"EMP-0042\"", json);
        Assert.DoesNotContain("\"employeeId\":", json, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("\"employeeID\":", json, StringComparison.Ordinal);
    }
}
