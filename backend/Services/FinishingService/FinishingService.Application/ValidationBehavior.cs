using FluentValidation;
using MediatR;

namespace FinishingService.Application;

public sealed class ValidationBehavior<TRequest, TResponse>(IEnumerable<IValidator<TRequest>> validators) : IPipelineBehavior<TRequest, TResponse>
    where TRequest : notnull
{
    public async Task<TResponse> Handle(TRequest request, RequestHandlerDelegate<TResponse> next, CancellationToken cancellationToken)
    {
        if (!validators.Any()) return await next(cancellationToken);
        var context = new ValidationContext<TRequest>(request);
        var failures = validators.Select(v => v.Validate(context)).SelectMany(x => x.Errors).Where(x => x is not null).ToList();
        if (failures.Count > 0) throw new ValidationException(failures);
        return await next(cancellationToken);
    }
}
