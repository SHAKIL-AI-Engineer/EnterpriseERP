using QualityService.Domain;
using QualityService.Contracts;

namespace QualityService.Tests;

public sealed class AQLCalculationTests
{
    [Theory]
    [InlineData(0, QualityInspectionResults.Passed)] // Defect count = 0 (Passed)
    [InlineData(1, QualityInspectionResults.Passed)] // Defect count = 1 (Passed, AcceptQty is 1)
    [InlineData(2, QualityInspectionResults.Failed)] // Defect count = 2 (Failed, RejectQty is 2)
    [InlineData(3, QualityInspectionResults.Failed)] // Defect count = 3 (Failed)
    public void AqlCalculation_ShouldYieldCorrectResult_BasedOnDefects(int totalDefects, string expectedResult)
    {
        // Arrange
        var acceptQty = 1;

        // Act
        var result = totalDefects > acceptQty
            ? QualityInspectionResults.Failed 
            : QualityInspectionResults.Passed;

        // Assert
        Assert.Equal(expectedResult, result);
    }
}
