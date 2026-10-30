using QualityService.Application;
using QualityService.Contracts;

namespace QualityService.Tests;

public sealed class ValidationTests
{
    private readonly CreateQualityInspectionRequestValidator _validator = new();

    [Fact]
    public void Validation_ShouldFail_WhenSumExceedsInspectedQty()
    {
        // Arrange
        var request = new CreateQualityInspectionRequest(
            CompanyId: Guid.NewGuid(),
            OrderId: Guid.NewGuid(),
            StyleId: Guid.NewGuid(),
            BuyerPurchaseOrderId: Guid.NewGuid(),
            CheckpointId: Guid.NewGuid(),
            InspectionNo: "QC-2026-001",
            InspectionDate: DateOnly.FromDateTime(DateTime.UtcNow),
            InspectionType: "Endline",
            ColorName: "Red",
            SizeName: "L",
            InspectedQty: 100,
            PassedQty: 60,
            DefectQty: 30,
            ReworkQty: 0,
            RejectQty: 20, // Sum = 60 + 30 + 20 = 110 (greater than 100)
            Remarks: "Sum exceeds lot size",
            Defects: [],
            CreatedBy: Guid.NewGuid()
        );

        // Act
        var result = _validator.Validate(request);

        // Assert
        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, e => e.ErrorMessage.Contains("PassedQty + DefectQty + RejectQty cannot exceed InspectedQty."));
    }

    [Fact]
    public void Validation_ShouldPass_WhenSumIsExactlyInspectedQty()
    {
        // Arrange
        var request = new CreateQualityInspectionRequest(
            CompanyId: Guid.NewGuid(),
            OrderId: Guid.NewGuid(),
            StyleId: Guid.NewGuid(),
            BuyerPurchaseOrderId: Guid.NewGuid(),
            CheckpointId: Guid.NewGuid(),
            InspectionNo: "QC-2026-002",
            InspectionDate: DateOnly.FromDateTime(DateTime.UtcNow),
            InspectionType: "Endline",
            ColorName: "Red",
            SizeName: "L",
            InspectedQty: 100,
            PassedQty: 50,
            DefectQty: 40,
            ReworkQty: 0,
            RejectQty: 10, // Sum = 50 + 40 + 10 = 100
            Remarks: "Sum matches perfectly",
            Defects: [],
            CreatedBy: Guid.NewGuid()
        );

        // Act
        var result = _validator.Validate(request);

        // Assert
        Assert.True(result.IsValid);
    }
}
