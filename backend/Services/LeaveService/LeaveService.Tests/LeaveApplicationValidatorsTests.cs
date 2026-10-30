using FluentValidation;
using LeaveService.Application.Features.LeaveApplications;
using LeaveService.Contracts.LeaveApplications;
using Xunit;

namespace LeaveService.Tests;

public sealed class LeaveApplicationValidatorsTests
{
    [Fact]
    public void ApplyLeaveCommandValidator_rejects_when_to_before_from()
    {
        var v = new ApplyLeaveCommandValidator();
        var cmd = new ApplyLeaveCommand(new ApplyLeaveRequest(
            Guid.NewGuid(),
            Guid.NewGuid(),
            Guid.NewGuid(),
            new DateOnly(2026, 5, 10),
            new DateOnly(2026, 5, 1),
            false,
            null,
            null,
            null,
            Guid.NewGuid(),
            null));
        var r = v.Validate(cmd);
        Assert.False(r.IsValid);
        Assert.Contains(r.Errors, e => e.PropertyName.Contains("ToDate", StringComparison.Ordinal));
    }
}
