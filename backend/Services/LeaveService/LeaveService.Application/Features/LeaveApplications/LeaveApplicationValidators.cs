using FluentValidation;

namespace LeaveService.Application.Features.LeaveApplications;

public sealed class ApplyLeaveCommandValidator : AbstractValidator<ApplyLeaveCommand>
{
    public ApplyLeaveCommandValidator()
    {
        RuleFor(x => x.Request.CompanyId).NotEmpty();
        RuleFor(x => x.Request.EmployeeId).NotEmpty();
        RuleFor(x => x.Request.LeaveTypeId).NotEmpty();
        RuleFor(x => x.Request.AppliedBy).NotEmpty();
        RuleFor(x => x.Request.ToDate).GreaterThanOrEqualTo(x => x.Request.FromDate);
        RuleFor(x => x.Request.Reason).MaximumLength(500);
    }
}

public sealed class ApproveLeaveCommandValidator : AbstractValidator<ApproveLeaveCommand>
{
    public ApproveLeaveCommandValidator()
    {
        RuleFor(x => x.Request.LeaveApplicationId).NotEmpty();
        RuleFor(x => x.Request.ApprovedBy).NotEmpty();
    }
}

public sealed class RejectLeaveCommandValidator : AbstractValidator<RejectLeaveCommand>
{
    public RejectLeaveCommandValidator()
    {
        RuleFor(x => x.Request.LeaveApplicationId).NotEmpty();
        RuleFor(x => x.Request.RejectedBy).NotEmpty();
        RuleFor(x => x.Request.Remarks).NotEmpty().MaximumLength(300);
    }
}

public sealed class CancelLeaveCommandValidator : AbstractValidator<CancelLeaveCommand>
{
    public CancelLeaveCommandValidator()
    {
        RuleFor(x => x.Request.LeaveApplicationId).NotEmpty();
        RuleFor(x => x.Request.CancelledBy).NotEmpty();
    }
}
