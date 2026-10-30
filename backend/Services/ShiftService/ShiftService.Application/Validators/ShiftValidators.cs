using FluentValidation;
using ShiftService.Application.Features.Shifts.Commands;

namespace ShiftService.Application.Validators;

public class ShiftRuleValidator : AbstractValidator<CreateShiftRuleCommand>
{
    public ShiftRuleValidator()
    {
        RuleFor(x => x.ShiftId).NotEmpty();
        RuleFor(x => x.InGraceMinutes).GreaterThanOrEqualTo(0);
        RuleFor(x => x.OutGraceMinutes).GreaterThanOrEqualTo(0);
        RuleFor(x => x.LateAfterMinutes).GreaterThanOrEqualTo(0);
        RuleFor(x => x.MinimumWorkingMinutes).GreaterThan(0);
        RuleFor(x => x.HalfDayWorkingMinutes).LessThan(x => x.MinimumWorkingMinutes);
    }
}

public class ShiftBreakValidator : AbstractValidator<CreateShiftBreakCommand>
{
    public ShiftBreakValidator()
    {
        RuleFor(x => x.BreakName).NotEmpty();
        RuleFor(x => x.BreakStartTime).NotEmpty();
        RuleFor(x => x.BreakEndTime).NotEmpty();
        RuleFor(x => x.BreakMinutes).GreaterThan(0);
    }
}

public class AssignShiftValidator : AbstractValidator<AssignEmployeeShiftCommand>
{
    public AssignShiftValidator()
    {
        RuleFor(x => x.CompanyId).NotEmpty();
        RuleFor(x => x.EmployeeId).NotEmpty();
        RuleFor(x => x.ShiftId).NotEmpty();
        RuleFor(x => x.EffectiveFrom).NotEmpty();
        RuleFor(x => x.EffectiveTo).GreaterThan(x => x.EffectiveFrom).When(x => x.EffectiveTo.HasValue);
    }
}

public class TemporaryShiftValidator : AbstractValidator<AssignTemporaryShiftCommand>
{
    public TemporaryShiftValidator()
    {
        RuleFor(x => x.CompanyId).NotEmpty();
        RuleFor(x => x.EmployeeId).NotEmpty();
        RuleFor(x => x.ShiftId).NotEmpty();
        RuleFor(x => x.ShiftDate).NotEmpty();
    }
}
