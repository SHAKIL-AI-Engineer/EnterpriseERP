using CuttingService.Contracts;
using MediatR;

namespace CuttingService.Application;

public sealed record CreateCuttingPlanCommand(CreateCuttingPlanRequest Request) : IRequest<CuttingPlanDto>;
public sealed record UpdateCuttingPlanCommand(Guid Id, UpdateCuttingPlanRequest Request) : IRequest<CuttingPlanDto>;
public sealed record ApproveCuttingPlanCommand(Guid Id, Guid? ApprovedBy) : IRequest<CuttingPlanDto>;
public sealed record StartCuttingPlanCommand(Guid Id, Guid? UserId) : IRequest<CuttingPlanDto>;
public sealed record CompleteCuttingPlanCommand(Guid Id, Guid? UserId) : IRequest<CuttingPlanDto>;
public sealed record CancelCuttingPlanCommand(Guid Id, Guid? UserId) : IRequest<CuttingPlanDto>;
public sealed record AddCuttingPlanSizeBreakdownCommand(Guid PlanId, AddCuttingPlanSizeBreakdownRequest Request) : IRequest<CuttingPlanSizeBreakdownDto>;
public sealed record UpdateCuttingPlanSizeBreakdownCommand(Guid Id, UpdateCuttingPlanSizeBreakdownRequest Request) : IRequest<CuttingPlanSizeBreakdownDto>;
public sealed record DeleteCuttingPlanSizeBreakdownCommand(Guid Id) : IRequest<Unit>;
public sealed record CreateFabricIssueToCuttingCommand(CreateFabricIssueToCuttingRequest Request) : IRequest<FabricIssueToCuttingDto>;
public sealed record CreateCuttingLayCommand(CreateCuttingLayRequest Request) : IRequest<CuttingLayDto>;
public sealed record UpdateCuttingLayCommand(Guid Id, UpdateCuttingLayRequest Request) : IRequest<CuttingLayDto>;
public sealed record CreateCuttingOutputCommand(CreateCuttingOutputRequest Request) : IRequest<CuttingOutputDto>;
public sealed record CreateCuttingWastageCommand(CreateCuttingWastageRequest Request) : IRequest<CuttingWastageDto>;
public sealed record CreateCuttingPanelTransferCommand(CreatePanelTransferRequest Request) : IRequest<CuttingPanelTransferDto>;
public sealed record ConfirmCuttingPanelTransferCommand(Guid Id) : IRequest<CuttingPanelTransferDto>;
public sealed record CancelCuttingPanelTransferCommand(Guid Id) : IRequest<CuttingPanelTransferDto>;
public sealed record CreateCuttingBundleCommand(CreateCuttingBundleRequest Request) : IRequest<CuttingBundleDto>;
public sealed record UpdateCuttingBundleCommand(Guid Id, UpdateCuttingBundleRequest Request) : IRequest<CuttingBundleDto>;
public sealed record UpdateCuttingBundleStatusCommand(Guid Id, UpdateBundleStatusRequest Request) : IRequest<CuttingBundleDto>;
