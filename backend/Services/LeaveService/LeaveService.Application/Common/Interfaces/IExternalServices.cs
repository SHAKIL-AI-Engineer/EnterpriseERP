namespace LeaveService.Application.Common.Interfaces;

public enum EmployeeValidationStatus
{
    Active,
    NotFound,
    WrongCompany,
    Inactive,
    Unreachable,
}

public sealed record EmployeeValidationResult(EmployeeValidationStatus Status)
{
    public static EmployeeValidationResult Active { get; } = new(EmployeeValidationStatus.Active);
    public static EmployeeValidationResult NotFound { get; } = new(EmployeeValidationStatus.NotFound);
    public static EmployeeValidationResult WrongCompany { get; } = new(EmployeeValidationStatus.WrongCompany);
    public static EmployeeValidationResult Inactive { get; } = new(EmployeeValidationStatus.Inactive);
    public static EmployeeValidationResult Unreachable { get; } = new(EmployeeValidationStatus.Unreachable);
}

public sealed record EmployeeLookupInfo(
    Guid Id,
    string EmployeeCode,
    string FullName,
    string? DepartmentName,
    string? DesignationName);

public interface IEmployeeServiceClient
{
    Task<EmployeeValidationResult> ValidateEmployeeAsync(Guid companyId, Guid employeeId, CancellationToken cancellationToken = default);
    Task<bool> IsEmployeeActiveAsync(Guid companyId, Guid employeeId, CancellationToken cancellationToken = default);
    Task<DateOnly?> GetEmployeeJoinDateAsync(Guid companyId, Guid employeeId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<Guid>> GetActiveEmployeeIdsAsync(Guid companyId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<EmployeeLookupInfo>> LookupEmployeesAsync(
        IReadOnlyList<Guid> employeeIds,
        CancellationToken cancellationToken = default);
}

public interface IAttendanceServiceClient
{
    Task<decimal> GetMonthlyApprovedWorkingDaysAsync(Guid companyId, Guid employeeId, int year, int month, CancellationToken cancellationToken = default);
    Task<decimal> GetWorkingDaysInRangeAsync(Guid companyId, Guid employeeId, DateOnly from, DateOnly to, CancellationToken cancellationToken = default);
}

public interface IPayrollServiceClient
{
    Task<bool> IsPayrollLockedAsync(Guid companyId, int year, int month, CancellationToken cancellationToken = default);
}

public interface INotificationServiceClient
{
    Task SendLeaveApprovalNotificationAsync(Guid approverUserId, Guid leaveApplicationId, CancellationToken cancellationToken = default);
    Task SendLeaveStatusNotificationAsync(Guid employeeId, Guid leaveApplicationId, string status, CancellationToken cancellationToken = default);
}

public interface ILeaveCache
{
    Task<T?> GetOrCreateAsync<T>(string key, TimeSpan ttl, Func<CancellationToken, Task<T>> factory, CancellationToken cancellationToken = default) where T : class;
    Task RemoveByPrefixAsync(string prefix, CancellationToken cancellationToken = default);
}
