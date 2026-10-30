using FinishingService.Contracts;
using FluentValidation;

namespace FinishingService.Application;

public sealed class CreateFinishingReceiveRequestValidator : AbstractValidator<CreateFinishingReceiveRequest>
{
    public CreateFinishingReceiveRequestValidator()
    {
        RuleFor(x => x.CompanyId).NotEmpty();
        RuleFor(x => x.OrderId).NotEmpty();
        RuleFor(x => x.ReceiveNo).NotEmpty().MaximumLength(100);
        RuleFor(x => x.ReceiveDate).NotEmpty();
        RuleFor(x => x.Items).NotEmpty().WithMessage("Receive items cannot be empty.");
        RuleForEach(x => x.Items).ChildRules(item =>
        {
            item.RuleFor(i => i.OrderId).NotEmpty();
            item.RuleFor(i => i.SizeName).NotEmpty();
            item.RuleFor(i => i.ReceiveQty).GreaterThan(0).WithMessage("Receive quantity must be greater than 0.");
        });
    }
}

public sealed class CreateFinishingBatchRequestValidator : AbstractValidator<CreateFinishingBatchRequest>
{
    public CreateFinishingBatchRequestValidator()
    {
        RuleFor(x => x.CompanyId).NotEmpty();
        RuleFor(x => x.OrderId).NotEmpty();
        RuleFor(x => x.BatchNo).NotEmpty().MaximumLength(100);
        RuleFor(x => x.BatchDate).NotEmpty();
        RuleFor(x => x.TotalInputQty).GreaterThan(0);
    }
}

public sealed class CreateFinishingInputRequestValidator : AbstractValidator<CreateFinishingInputRequest>
{
    public CreateFinishingInputRequestValidator()
    {
        RuleFor(x => x.CompanyId).NotEmpty();
        RuleFor(x => x.FinishingBatchId).NotEmpty();
        RuleFor(x => x.OrderId).NotEmpty();
        RuleFor(x => x.InputDate).NotEmpty();
        RuleFor(x => x.SizeName).NotEmpty();
        RuleFor(x => x.InputQty).GreaterThan(0);
    }
}

public sealed class CreateIroningOutputRequestValidator : AbstractValidator<CreateIroningOutputRequest>
{
    public CreateIroningOutputRequestValidator()
    {
        RuleFor(x => x.CompanyId).NotEmpty();
        RuleFor(x => x.FinishingBatchId).NotEmpty();
        RuleFor(x => x.OrderId).NotEmpty();
        RuleFor(x => x.OutputDate).NotEmpty();
        RuleFor(x => x.SizeName).NotEmpty();
        RuleFor(x => x.IronQty).GreaterThan(0);
        RuleFor(x => x.ReIronQty).GreaterThanOrEqualTo(0);
    }
}

public sealed class CreateFinishingQCRequestValidator : AbstractValidator<CreateFinishingQCRequest>
{
    public CreateFinishingQCRequestValidator()
    {
        RuleFor(x => x.CompanyId).NotEmpty();
        RuleFor(x => x.FinishingBatchId).NotEmpty();
        RuleFor(x => x.OrderId).NotEmpty();
        RuleFor(x => x.QCDate).NotEmpty();
        RuleFor(x => x.SizeName).NotEmpty();
        RuleFor(x => x.CheckedQty).GreaterThan(0);
        RuleFor(x => x.PassedQty).GreaterThanOrEqualTo(0);
        RuleFor(x => x.AlterQty).GreaterThanOrEqualTo(0);
        RuleFor(x => x.RejectQty).GreaterThanOrEqualTo(0);
        RuleForEach(x => x.Defects).ChildRules(d =>
        {
            d.RuleFor(i => i.DefectType).NotEmpty();
            d.RuleFor(i => i.DefectQty).GreaterThan(0);
        });
    }
}

public sealed class CreateFoldingPackingRequestValidator : AbstractValidator<CreateFoldingPackingRequest>
{
    public CreateFoldingPackingRequestValidator()
    {
        RuleFor(x => x.CompanyId).NotEmpty();
        RuleFor(x => x.FinishingBatchId).NotEmpty();
        RuleFor(x => x.OrderId).NotEmpty();
        RuleFor(x => x.PackingDate).NotEmpty();
        RuleFor(x => x.SizeName).NotEmpty();
        RuleFor(x => x.FoldingQty).GreaterThan(0);
        RuleFor(x => x.TaggingQty).GreaterThanOrEqualTo(0);
        RuleFor(x => x.PolyQty).GreaterThanOrEqualTo(0);
    }
}

public sealed class CreateCartonPackingRequestValidator : AbstractValidator<CreateCartonPackingRequest>
{
    public CreateCartonPackingRequestValidator()
    {
        RuleFor(x => x.CompanyId).NotEmpty();
        RuleFor(x => x.OrderId).NotEmpty();
        RuleFor(x => x.CartonNo).NotEmpty().MaximumLength(100);
        RuleFor(x => x.PackingDate).NotEmpty();
        RuleFor(x => x.Items).NotEmpty();
        RuleForEach(x => x.Items).ChildRules(item =>
        {
            item.RuleFor(i => i.OrderId).NotEmpty();
            item.RuleFor(i => i.SizeName).NotEmpty();
            item.RuleFor(i => i.Quantity).GreaterThan(0);
        });
    }
}

public sealed class CreateFinishedGoodsTransferRequestValidator : AbstractValidator<CreateFinishedGoodsTransferRequest>
{
    public CreateFinishedGoodsTransferRequestValidator()
    {
        RuleFor(x => x.CompanyId).NotEmpty();
        RuleFor(x => x.OrderId).NotEmpty();
        RuleFor(x => x.TransferNo).NotEmpty().MaximumLength(100);
        RuleFor(x => x.TransferDate).NotEmpty();
        RuleFor(x => x.Items).NotEmpty();
        RuleForEach(x => x.Items).ChildRules(item =>
        {
            item.RuleFor(i => i.OrderId).NotEmpty();
            item.RuleFor(i => i.SizeName).NotEmpty();
            item.RuleFor(i => i.TransferQty).GreaterThan(0);
        });
    }
}

public sealed class CreateFinishingWastageRequestValidator : AbstractValidator<CreateFinishingWastageRequest>
{
    public CreateFinishingWastageRequestValidator()
    {
        RuleFor(x => x.CompanyId).NotEmpty();
        RuleFor(x => x.OrderId).NotEmpty();
        RuleFor(x => x.WastageDate).NotEmpty();
        RuleFor(x => x.WastageQty).GreaterThan(0);
        RuleFor(x => x.WastageReason).NotEmpty().MaximumLength(300);
    }
}
