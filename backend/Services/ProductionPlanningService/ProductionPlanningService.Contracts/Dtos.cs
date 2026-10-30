namespace ProductionPlanningService.Contracts;

public sealed record LineCapacityPlanDto(
    Guid Id, Guid CompanyId, Guid OrderId, string LineCode, string LineName,
    DateOnly PlanDate, int PlannedQty, int DailyCapacity, string Status);

public sealed record PlanningBalanceDto(
    Guid Id, Guid CompanyId, Guid OrderId, Guid? LineCapacityPlanId,
    int PlannedQty, int AssignedQty, int ActualQty);

public sealed record CreateLineCapacityPlanRequest(
    Guid CompanyId, Guid OrderId, string LineCode, string LineName,
    DateOnly PlanDate, int PlannedQty, int DailyCapacity, string? Status = null);

public sealed record UpdateLineCapacityPlanRequest(
    string LineCode, string LineName, DateOnly PlanDate, int PlannedQty, int DailyCapacity, string Status);
