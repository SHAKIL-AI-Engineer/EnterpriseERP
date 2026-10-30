using FluentValidation;
using ShiftService.Application.Features.Shifts.Commands;

namespace ShiftService.Application.Validators;

public class CreateShiftCommandValidator : AbstractValidator<CreateShiftCommand>
{
    public CreateShiftCommandValidator()
    {
        RuleFor(x => x.CompanyId).NotEmpty();
        RuleFor(x => x.ShiftName).NotEmpty().MaximumLength(150);
        RuleFor(x => x.ShiftType).NotEmpty();
        RuleFor(x => x.PunchWindowBeforeMinutes).GreaterThan(0).LessThanOrEqualTo(180);
        RuleFor(x => x.WeeklyOffDayOfWeek).InclusiveBetween(0, 6).When(x => x.WeeklyOffDayOfWeek.HasValue);
        RuleFor(x => x.StartTime).NotEmpty();
        RuleFor(x => x.EndTime).NotEmpty();
        
        RuleFor(x => x)
            .Must(x => x.IsCrossDay || x.EndTime > x.StartTime)
            .WithMessage("If EndTime is smaller than StartTime, IsCrossDay must be true.");
    }
}
