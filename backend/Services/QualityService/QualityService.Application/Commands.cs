using MediatR;
using QualityService.Contracts;

namespace QualityService.Application;

// Checkpoint Commands
public sealed record CreateQualityCheckpointCommand(CreateQualityCheckpointRequest Request) : IRequest<QualityCheckpointDto>;
public sealed record UpdateQualityCheckpointCommand(Guid Id, UpdateQualityCheckpointRequest Request) : IRequest<QualityCheckpointDto>;
public sealed record ActivateQualityCheckpointCommand(Guid Id) : IRequest<QualityCheckpointDto>;
public sealed record DeactivateQualityCheckpointCommand(Guid Id) : IRequest<QualityCheckpointDto>;

// Defect Setup Commands
public sealed record CreateDefectCategoryCommand(CreateDefectCategoryRequest Request) : IRequest<DefectCategoryDto>;
public sealed record CreateDefectTypeCommand(CreateDefectTypeRequest Request) : IRequest<DefectTypeDto>;
public sealed record UpdateDefectTypeCommand(Guid Id, UpdateDefectTypeRequest Request) : IRequest<DefectTypeDto>;

// Inspection Commands
public sealed record CreateQualityInspectionCommand(CreateQualityInspectionRequest Request) : IRequest<QualityInspectionDto>;
public sealed record UpdateQualityInspectionCommand(Guid Id, UpdateQualityInspectionRequest Request) : IRequest<QualityInspectionDto>;
public sealed record SubmitQualityInspectionCommand(Guid Id, Guid? UserId) : IRequest<QualityInspectionDto>;
public sealed record ApproveQualityInspectionCommand(Guid Id, Guid? UserId) : IRequest<QualityInspectionDto>;
public sealed record CancelQualityInspectionCommand(Guid Id, Guid? UserId) : IRequest<QualityInspectionDto>;
public sealed record AddInspectionDefectCommand(Guid InspectionId, QualityInspectionDefectRequest Request) : IRequest<QualityInspectionDefectDto>;

// Rework & Reject Commands
public sealed record CreateQualityReworkCommand(CreateQualityReworkRequest Request) : IRequest<QualityReworkDto>;
public sealed record SendQualityReworkCommand(Guid Id, Guid? UserId) : IRequest<QualityReworkDto>;
public sealed record CompleteQualityReworkCommand(Guid Id, Guid? UserId) : IRequest<QualityReworkDto>;
public sealed record CreateQualityRejectCommand(CreateQualityRejectRequest Request) : IRequest<QualityRejectDto>;

// AQL & Final Inspection Commands
public sealed record CreateAQLStandardCommand(CreateAQLStandardRequest Request) : IRequest<AQLStandardDto>;
public sealed record CreateFinalInspectionCommand(CreateFinalInspectionRequest Request) : IRequest<FinalInspectionDto>;
public sealed record ApproveFinalInspectionCommand(Guid Id, Guid? UserId) : IRequest<FinalInspectionDto>;
public sealed record CancelFinalInspectionCommand(Guid Id, Guid? UserId) : IRequest<FinalInspectionDto>;
