using Erp.BuildingBlocks.SharedKernel;
using FluentValidation;
using MerchandisingService.Contracts;
using MerchandisingService.Domain;

namespace MerchandisingService.Application;

public sealed class CreateMasterDataCommandValidator : AbstractValidator<CreateMasterDataCommand>
{
    public CreateMasterDataCommandValidator()
    {
        RuleFor(x => x.Resource).Must(r => MasterDataResources.Values.Contains(r, StringComparer.OrdinalIgnoreCase)).WithMessage("Invalid master data resource.");
        RuleFor(x => x.Request.Code).NotEmpty().MaximumLength(50);
        RuleFor(x => x.Request.Name).NotEmpty().MaximumLength(150);
    }
}

public sealed class UpdateMasterDataCommandValidator : AbstractValidator<UpdateMasterDataCommand>
{
    public UpdateMasterDataCommandValidator()
    {
        RuleFor(x => x.Resource).Must(r => MasterDataResources.Values.Contains(r, StringComparer.OrdinalIgnoreCase)).WithMessage("Invalid master data resource.");
        RuleFor(x => x.Request.Name).NotEmpty().MaximumLength(150);
    }
}
