using System.Net.Http.Json;
using System.Text.Json;
using LeaveService.Application.Common.Interfaces;
using Microsoft.Extensions.Options;

namespace LeaveService.Infrastructure.External;

public sealed class EmployeeServiceClientOptions
{
    public string BaseUrl { get; set; } = "http://127.0.0.1:5035/";
}

public sealed class EmployeeServiceClient(HttpClient http, IOptions<EmployeeServiceClientOptions> options) : IEmployeeServiceClient
{
    private readonly string _base = options.Value.BaseUrl.TrimEnd('/');

    public async Task<EmployeeValidationResult> ValidateEmployeeAsync(
        Guid companyId,
        Guid employeeId,
        CancellationToken cancellationToken = default)
    {
        var (doc, unreachable) = await GetEmployeeJsonAsync(employeeId, cancellationToken);
        if (unreachable)
        {
            return EmployeeValidationResult.Unreachable;
        }

        if (doc == null || !doc.RootElement.TryGetProperty("data", out var data))
        {
            return EmployeeValidationResult.NotFound;
        }

        if (!TryGetGuid(data, "companyId", out var cid) || cid != companyId)
        {
            return EmployeeValidationResult.WrongCompany;
        }

        return TryGetString(data, "status", out var st) &&
               string.Equals(st, "Active", StringComparison.OrdinalIgnoreCase)
            ? EmployeeValidationResult.Active
            : EmployeeValidationResult.Inactive;
    }

    public async Task<bool> IsEmployeeActiveAsync(Guid companyId, Guid employeeId, CancellationToken cancellationToken = default)
    {
        var result = await ValidateEmployeeAsync(companyId, employeeId, cancellationToken);
        return result.Status == EmployeeValidationStatus.Active;
    }

    public async Task<DateOnly?> GetEmployeeJoinDateAsync(Guid companyId, Guid employeeId, CancellationToken cancellationToken = default)
    {
        var (doc, _) = await GetEmployeeJsonAsync(employeeId, cancellationToken);
        if (doc == null || !doc.RootElement.TryGetProperty("data", out var data))
        {
            return null;
        }

        if (!TryGetGuid(data, "companyId", out var cid) || cid != companyId)
        {
            return null;
        }

        if (TryGetProperty(data, "joinDate", out var jd) && jd.ValueKind == JsonValueKind.String &&
            DateTime.TryParse(jd.GetString(), out var dt))
        {
            return DateOnly.FromDateTime(dt);
        }

        return null;
    }

    public async Task<IReadOnlyList<EmployeeLookupInfo>> LookupEmployeesAsync(
        IReadOnlyList<Guid> employeeIds,
        CancellationToken cancellationToken = default)
    {
        if (employeeIds.Count == 0)
            return [];

        try
        {
            var ids = employeeIds.Where(x => x != Guid.Empty).Distinct().ToArray();
            var url = $"{_base}/api/v1/hr/Employees/lookup";
            var resp = await http.PostAsJsonAsync(url, new { ids }, cancellationToken);
            if (!resp.IsSuccessStatusCode)
            {
                return Array.Empty<EmployeeLookupInfo>();
            }

            var wrapper = await resp.Content.ReadFromJsonAsync<HrLookupWrapper>(cancellationToken: cancellationToken);
            return wrapper?.Data?.Select(x => new EmployeeLookupInfo(
                x.Id,
                x.EmployeeCode ?? x.EmployeeID ?? string.Empty,
                x.FullName ?? string.Empty,
                x.DepartmentName,
                x.DesignationName)).ToArray() ?? Array.Empty<EmployeeLookupInfo>();
        }
        catch
        {
            return Array.Empty<EmployeeLookupInfo>();
        }
    }

    public async Task<IReadOnlyList<Guid>> GetActiveEmployeeIdsAsync(Guid companyId, CancellationToken cancellationToken = default)
    {
        try
        {
            var url =
                $"{_base}/api/v1/hr/Employees?companyId={companyId}&status=Active&page=1&pageSize=5000";
            var resp = await http.GetAsync(url, cancellationToken);
            if (!resp.IsSuccessStatusCode)
            {
                return Array.Empty<Guid>();
            }

            var wrapper = await resp.Content.ReadFromJsonAsync<HrPageWrapper>(cancellationToken: cancellationToken);
            return wrapper?.Data?.Items?.Select(x => x.Id).ToArray() ?? Array.Empty<Guid>();
        }
        catch
        {
            return Array.Empty<Guid>();
        }
    }

    private async Task<(JsonDocument? Doc, bool Unreachable)> GetEmployeeJsonAsync(
        Guid employeeId,
        CancellationToken cancellationToken)
    {
        try
        {
            var url = $"{_base}/api/v1/hr/Employees/{employeeId}";
            var resp = await http.GetAsync(url, cancellationToken);
            if (resp.StatusCode is System.Net.HttpStatusCode.Unauthorized or System.Net.HttpStatusCode.Forbidden)
            {
                return (null, true);
            }

            if (!resp.IsSuccessStatusCode)
            {
                return (null, false);
            }

            var doc = await JsonDocument.ParseAsync(
                await resp.Content.ReadAsStreamAsync(cancellationToken),
                cancellationToken: cancellationToken);
            return (doc, false);
        }
        catch (HttpRequestException)
        {
            return (null, true);
        }
        catch
        {
            return (null, false);
        }
    }

    private static bool TryGetGuid(JsonElement el, string name, out Guid value)
    {
        value = default;
        if (!TryGetProperty(el, name, out var p))
        {
            return false;
        }

        return p.ValueKind == JsonValueKind.String
            ? Guid.TryParse(p.GetString(), out value)
            : p.TryGetGuid(out value);
    }

    private static bool TryGetString(JsonElement el, string name, out string value)
    {
        value = string.Empty;
        if (!TryGetProperty(el, name, out var p) || p.ValueKind != JsonValueKind.String)
        {
            return false;
        }

        value = p.GetString() ?? string.Empty;
        return true;
    }

    private static bool TryGetProperty(JsonElement el, string name, out JsonElement property)
    {
        if (el.TryGetProperty(name, out property))
        {
            return true;
        }

        var pascal = char.ToUpperInvariant(name[0]) + name[1..];
        return el.TryGetProperty(pascal, out property);
    }

    private sealed class HrPageWrapper
    {
        public HrPageData? Data { get; set; }
    }

    private sealed class HrPageData
    {
        public List<HrEmp>? Items { get; set; }
    }

    private sealed class HrEmp
    {
        public Guid Id { get; set; }
    }

    private sealed class HrLookupWrapper
    {
        public List<HrLookupRow>? Data { get; set; }
    }

    private sealed class HrLookupRow
    {
        public Guid Id { get; set; }
        public string? EmployeeCode { get; set; }
        public string? EmployeeID { get; set; }
        public string? FullName { get; set; }
        public string? DepartmentName { get; set; }
        public string? DesignationName { get; set; }
    }
}

public sealed class AttendanceServiceClientOptions
{
    public string BaseUrl { get; set; } = "http://127.0.0.1:5037/";
}

public sealed class AttendanceServiceClient(HttpClient http, IOptions<AttendanceServiceClientOptions> options) : IAttendanceServiceClient
{
    private readonly string _base = options.Value.BaseUrl.TrimEnd('/');

    public async Task<decimal> GetMonthlyApprovedWorkingDaysAsync(Guid companyId, Guid employeeId, int year, int month, CancellationToken cancellationToken = default)
    {
        var from = new DateTime(year, month, 1);
        var to = new DateTime(year, month, DateTime.DaysInMonth(year, month));
        return await GetWorkingDaysInRangeAsync(companyId, employeeId, DateOnly.FromDateTime(from), DateOnly.FromDateTime(to), cancellationToken);
    }

    public async Task<decimal> GetWorkingDaysInRangeAsync(Guid companyId, Guid employeeId, DateOnly from, DateOnly to, CancellationToken cancellationToken = default)
    {
        try
        {
            var url =
                $"{_base}/api/Attendance/summary?companyId={companyId}&fromDate={from:yyyy-MM-dd}&toDate={to:yyyy-MM-dd}&employeeId={employeeId}";
            var resp = await http.GetAsync(url, cancellationToken);
            if (!resp.IsSuccessStatusCode)
            {
                return CountWeekdays(from, to);
            }

            var doc = await JsonDocument.ParseAsync(await resp.Content.ReadAsStreamAsync(cancellationToken), cancellationToken: cancellationToken);
            if (!doc.RootElement.TryGetProperty("data", out var data) || data.ValueKind != JsonValueKind.Array)
            {
                return CountWeekdays(from, to);
            }

            decimal sum = 0;
            foreach (var row in data.EnumerateArray())
            {
                if (row.TryGetProperty("totalPresent", out var tp) && tp.TryGetInt32(out var v))
                {
                    sum += v;
                }
            }

            return sum > 0 ? sum : CountWeekdays(from, to);
        }
        catch
        {
            return CountWeekdays(from, to);
        }
    }

    private static decimal CountWeekdays(DateOnly from, DateOnly to)
    {
        decimal d = 0;
        for (var x = from; x <= to; x = x.AddDays(1))
        {
            var dow = x.ToDateTime(TimeOnly.MinValue).DayOfWeek;
            if (dow is not DayOfWeek.Saturday and not DayOfWeek.Sunday)
            {
                d++;
            }
        }

        return d;
    }
}

public sealed class PayrollServiceClientOptions
{
    public string BaseUrl { get; set; } = "http://127.0.0.1:5039/";
}

public sealed class PayrollServiceClient : IPayrollServiceClient
{
    public Task<bool> IsPayrollLockedAsync(Guid companyId, int year, int month, CancellationToken cancellationToken = default) =>
        Task.FromResult(false);
}

public sealed class NotificationServiceClient(HttpClient httpClient) : INotificationServiceClient
{
    public async Task SendLeaveApprovalNotificationAsync(Guid approverUserId, Guid leaveApplicationId, CancellationToken cancellationToken = default)
    {
        try
        {
            await httpClient.PostAsJsonAsync("/api/v1/notification/send", new
            {
                recipientId = approverUserId,
                type = "InApp",
                subject = "Leave Approval Required",
                body = $"A leave application requires your approval. Application ID: {leaveApplicationId}."
            }, cancellationToken);
        }
        catch { /* notification failure must not block leave application */ }
    }

    public async Task SendLeaveStatusNotificationAsync(Guid employeeId, Guid leaveApplicationId, string status, CancellationToken cancellationToken = default)
    {
        try
        {
            await httpClient.PostAsJsonAsync("/api/v1/notification/send", new
            {
                recipientId = employeeId,
                type = "InApp",
                subject = $"Your Leave Application has been {status}",
                body = $"Your leave application (ID: {leaveApplicationId}) status is now: {status}."
            }, cancellationToken);
        }
        catch { /* notification failure must not block leave status update */ }
    }
}
