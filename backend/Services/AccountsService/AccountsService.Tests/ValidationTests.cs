using AccountsService.Application;
using AccountsService.Contracts;

namespace AccountsService.Tests;

public sealed class ValidationTests
{
    [Fact]
    public void Voucher_requires_balanced_debit_and_credit()
    {
        var validator = new CreateVoucherRequestValidator();
        var request = new CreateVoucherRequest(
            Guid.NewGuid(),
            "JV-001",
            DateOnly.FromDateTime(DateTime.Today),
            "Journal",
            null,
            null,
            null,
            [
                new CreateVoucherLineRequest(Guid.NewGuid(), null, 100, 0, null),
                new CreateVoucherLineRequest(Guid.NewGuid(), null, 0, 90, null),
            ]);

        var result = validator.Validate(request);

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, x => x.ErrorMessage.Contains("Total debit"));
    }
}
