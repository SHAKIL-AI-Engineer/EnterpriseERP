using FinishingService.Application;
using FinishingService.Contracts;

namespace FinishingService.Tests;

public sealed class ValidationTests
{
    [Fact]
    public void Finishing_receive_requires_positive_item_quantities()
    {
        var validator = new CreateFinishingReceiveRequestValidator();
        var request = new CreateFinishingReceiveRequest(
            Guid.NewGuid(), 
            Guid.NewGuid(), 
            null,
            null,
            "FRC-TEST", 
            DateOnly.FromDateTime(DateTime.Today), 
            "Sewing", 
            [new FinishingReceiveItemRequest(Guid.NewGuid(), null, "Black", "M", 0)], // Invalid quantity: 0
            Guid.NewGuid()
        );

        var result = validator.Validate(request);

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, x => x.PropertyName.StartsWith("Items[0].ReceiveQty"));
    }

    [Fact]
    public void Finishing_batch_requires_non_empty_batch_no()
    {
        var validator = new CreateFinishingBatchRequestValidator();
        var request = new CreateFinishingBatchRequest(
            Guid.NewGuid(), 
            Guid.Empty, // Invalid order ID
            null,
            "", // Invalid batch no
            DateOnly.FromDateTime(DateTime.Today), 
            0, // Invalid total input qty
            Guid.NewGuid()
        );

        var result = validator.Validate(request);

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, x => x.PropertyName == nameof(CreateFinishingBatchRequest.BatchNo));
        Assert.Contains(result.Errors, x => x.PropertyName == nameof(CreateFinishingBatchRequest.OrderId));
    }
}
