using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using PayrollService.Application;
using PayrollService.Domain.Entities;

using Erp.BuildingBlocks.SharedKernel;

namespace PayrollService.Infrastructure.ExternalServices;

public sealed class EmployeeServiceClient(HttpClient httpClient) : IEmployeeServiceClient
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    public async Task<IReadOnlyList<EmployeeSnapshot>> GetActiveEmployeesAsync(Guid companyId, CancellationToken cancellationToken = default)
    {
        try
        {
            var response = await httpClient.GetAsync(
                $"/api/v1/hr/Employees?companyId={companyId}&status=Active&page=1&pageSize=200",
                cancellationToken);
            response.EnsureSuccessStatusCode();
            var payload = await response.Content.ReadFromJsonAsync<HrApiResponse<HrPagedResult<HrEmployeeListItem>>>(JsonOptions, cancellationToken);

            return payload?.Data?.Items?
                .Where(x => string.Equals(x.Status, "Active", StringComparison.OrdinalIgnoreCase))
                .Select(MapEmployee)
                .ToList() ?? [];
        }
        catch (Exception)
        {
            return [];
        }
    }

    public async Task<EmployeeSnapshot?> GetEmployeeByIdAsync(Guid companyId, Guid employeeId, CancellationToken cancellationToken = default)
    {
        try
        {
            var response = await httpClient.GetAsync($"/api/v1/hr/Employees/{employeeId}", cancellationToken);
            if (response.StatusCode == System.Net.HttpStatusCode.NotFound)
            {
                return null;
            }

            response.EnsureSuccessStatusCode();
            var payload = await response.Content.ReadFromJsonAsync<HrApiResponse<HrEmployeeDetails>>(JsonOptions, cancellationToken);
            return payload?.Data is null ? null : MapEmployee(payload.Data, companyId);
        }
        catch (Exception)
        {
            return null;
        }
    }

    public async Task<DateOnly?> GetEmployeeJoinDateAsync(Guid companyId, Guid employeeId, CancellationToken cancellationToken = default)
    {
        var employee = await GetEmployeeByIdAsync(companyId, employeeId, cancellationToken);
        return employee?.JoinDate;
    }

    public async Task<IReadOnlyList<EmployeeSnapshot>> GetResignedEmployeesAsync(Guid companyId, int year, int month, CancellationToken cancellationToken = default)
    {
        try
        {
            var response = await httpClient.GetAsync(
                $"/api/v1/hr/Employees?companyId={companyId}&status=Resigned&page=1&pageSize=200",
                cancellationToken);
            response.EnsureSuccessStatusCode();
            var payload = await response.Content.ReadFromJsonAsync<HrApiResponse<HrPagedResult<HrEmployeeListItem>>>(JsonOptions, cancellationToken);

            return payload?.Data?.Items?.Select(MapEmployee).ToList() ?? [];
        }
        catch (Exception)
        {
            return [];
        }
    }

    public async Task<EmployeeSalary?> TryResolveHrSalaryAsync(
        Guid companyId,
        Guid employeeId,
        DateOnly periodStart,
        DateOnly periodEnd,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var response = await httpClient.GetAsync($"/api/v1/hr/Employees/{employeeId}", cancellationToken);
            if (response.StatusCode == System.Net.HttpStatusCode.NotFound)
            {
                return null;
            }

            response.EnsureSuccessStatusCode();
            var payload = await response.Content.ReadFromJsonAsync<HrApiResponse<HrEmployeeDetails>>(JsonOptions, cancellationToken);
            var details = payload?.Data;
            if (details is null || details.CompanyId != companyId || details.CurrentSalaryInfo is null)
            {
                return null;
            }

            var hrSalary = details.CurrentSalaryInfo;
            if (hrSalary.GrossSalary <= 0)
            {
                return null;
            }

            var effectiveFrom = DateOnly.FromDateTime(hrSalary.EffectiveFrom);
            if (effectiveFrom > periodEnd)
            {
                return null;
            }

            return new EmployeeSalary
            {
                CompanyId = companyId,
                EmployeeId = employeeId,
                SalaryCalculationType = "Monthly",
                GrossSalary = hrSalary.GrossSalary,
                BasicSalary = hrSalary.BasicSalary,
                HouseRent = hrSalary.HouseRent,
                MedicalAllowance = hrSalary.MedicalAllowance,
                ConveyanceAllowance = hrSalary.ConveyanceAllowance,
                FoodAllowance = hrSalary.FoodAllowance,
                EffectiveFrom = effectiveFrom,
                IsCurrent = true,
            };
        }
        catch (Exception)
        {
            return null;
        }
    }

    private static EmployeeSnapshot MapEmployee(HrEmployeeListItem item) => new(
        item.Id,
        item.CompanyId,
        item.JoinDate ?? DateOnly.FromDateTime(BusinessTime.Now),
        string.Equals(item.Status, "Active", StringComparison.OrdinalIgnoreCase),
        item.BankAccountNo,
        item.BankName,
        item.EmployeeID,
        item.FullName,
        item.DepartmentId,
        item.DepartmentName,
        item.SectionId,
        item.SectionName,
        item.DesignationId,
        item.DesignationName,
        item.LineId,
        item.LineName,
        item.IsOtEnabled);

    private static EmployeeSnapshot MapEmployee(HrEmployeeDetails item, Guid companyId) => new(
        item.Id,
        companyId,
        item.JoinDate ?? DateOnly.FromDateTime(BusinessTime.Now),
        string.Equals(item.Status, "Active", StringComparison.OrdinalIgnoreCase),
        item.BankAccountNo,
        item.BankName,
        item.EmployeeID,
        item.FullName,
        item.DepartmentId,
        item.DepartmentName,
        item.SectionId,
        item.SectionName,
        item.DesignationId,
        item.DesignationName,
        item.LineId,
        item.LineName,
        item.IsOtEnabled);

    private sealed class HrApiResponse<T>
    {
        [JsonPropertyName("data")]
        public T? Data { get; init; }
    }

    private sealed class HrPagedResult<T>
    {
        [JsonPropertyName("items")]
        public List<T>? Items { get; init; }
    }

    private sealed class HrEmployeeListItem
    {
        [JsonPropertyName("id")]
        public Guid Id { get; init; }

        [JsonPropertyName("companyId")]
        public Guid CompanyId { get; init; }

        [JsonPropertyName("employeeID")]
        public string EmployeeID { get; init; } = string.Empty;

        [JsonPropertyName("fullName")]
        public string FullName { get; init; } = string.Empty;

        [JsonPropertyName("status")]
        public string Status { get; init; } = string.Empty;

        [JsonPropertyName("designationName")]
        public string? DesignationName { get; init; }

        [JsonPropertyName("departmentName")]
        public string? DepartmentName { get; init; }

        [JsonPropertyName("joinDate")]
        public DateOnly? JoinDate { get; init; }

        [JsonPropertyName("departmentId")]
        public int? DepartmentId { get; init; }

        [JsonPropertyName("sectionId")]
        public int? SectionId { get; init; }

        [JsonPropertyName("sectionName")]
        public string? SectionName { get; init; }

        [JsonPropertyName("designationId")]
        public int? DesignationId { get; init; }

        [JsonPropertyName("lineId")]
        public int? LineId { get; init; }

        [JsonPropertyName("lineName")]
        public string? LineName { get; init; }

        [JsonPropertyName("bankAccountNo")]
        public string? BankAccountNo { get; init; }

        [JsonPropertyName("bankName")]
        public string? BankName { get; init; }

        [JsonPropertyName("isOtEnabled")]
        public bool IsOtEnabled { get; init; } = true;
    }

    private sealed class HrEmployeeDetails
    {
        [JsonPropertyName("id")]
        public Guid Id { get; init; }

        [JsonPropertyName("companyId")]
        public Guid CompanyId { get; init; }

        [JsonPropertyName("employeeID")]
        public string EmployeeID { get; init; } = string.Empty;

        [JsonPropertyName("fullName")]
        public string FullName { get; init; } = string.Empty;

        [JsonPropertyName("status")]
        public string Status { get; init; } = string.Empty;

        [JsonPropertyName("joinDate")]
        public DateOnly? JoinDate { get; init; }

        [JsonPropertyName("departmentId")]
        public int? DepartmentId { get; init; }

        [JsonPropertyName("departmentName")]
        public string? DepartmentName { get; init; }

        [JsonPropertyName("sectionId")]
        public int? SectionId { get; init; }

        [JsonPropertyName("sectionName")]
        public string? SectionName { get; init; }

        [JsonPropertyName("designationId")]
        public int? DesignationId { get; init; }

        [JsonPropertyName("designationName")]
        public string? DesignationName { get; init; }

        [JsonPropertyName("lineId")]
        public int? LineId { get; init; }

        [JsonPropertyName("lineName")]
        public string? LineName { get; init; }

        [JsonPropertyName("bankAccountNo")]
        public string? BankAccountNo { get; init; }

        [JsonPropertyName("bankName")]
        public string? BankName { get; init; }

        [JsonPropertyName("isOtEnabled")]
        public bool IsOtEnabled { get; init; } = true;

        [JsonPropertyName("currentSalaryInfo")]
        public HrEmployeeSalaryInfo? CurrentSalaryInfo { get; init; }
    }

    private sealed class HrEmployeeSalaryInfo
    {
        [JsonPropertyName("basicSalary")]
        public decimal BasicSalary { get; init; }

        [JsonPropertyName("houseRent")]
        public decimal HouseRent { get; init; }

        [JsonPropertyName("medicalAllowance")]
        public decimal MedicalAllowance { get; init; }

        [JsonPropertyName("conveyanceAllowance")]
        public decimal ConveyanceAllowance { get; init; }

        [JsonPropertyName("foodAllowance")]
        public decimal FoodAllowance { get; init; }

        [JsonPropertyName("grossSalary")]
        public decimal GrossSalary { get; init; }

        [JsonPropertyName("effectiveFrom")]
        public DateTime EffectiveFrom { get; init; }
    }
}

public sealed class AttendanceServiceClient(HttpClient httpClient) : IAttendanceServiceClient
{
    public async Task<AttendanceSummary?> GetApprovedMonthlySummaryAsync(Guid companyId, Guid employeeId, int year, int month, CancellationToken cancellationToken = default)
    {
        try
        {
            using var response = await httpClient.GetAsync(
                $"/api/v1/attendance/monthly-summary/approved?companyId={companyId}&employeeId={employeeId}&year={year}&month={month}",
                cancellationToken);
            if (response.StatusCode == System.Net.HttpStatusCode.NotFound)
            {
                return null;
            }

            response.EnsureSuccessStatusCode();
            return await response.Content.ReadFromJsonAsync<AttendanceSummary>(cancellationToken: cancellationToken);
        }
        catch (Exception)
        {
            return null;
        }
    }

    public async Task<bool> IsMonthlyAttendanceApprovedAsync(Guid companyId, int year, int month, CancellationToken cancellationToken = default)
    {
        try
        {
            using var response = await httpClient.GetAsync(
                $"/api/v1/attendance/monthly-summary/is-approved?companyId={companyId}&year={year}&month={month}",
                cancellationToken);
            response.EnsureSuccessStatusCode();
            return await response.Content.ReadFromJsonAsync<bool>(cancellationToken: cancellationToken);
        }
        catch (Exception)
        {
            return false;
        }
    }
}

public sealed class LeaveServiceClient(HttpClient httpClient) : ILeaveServiceClient
{
    public async Task<decimal> GetApprovedLeaveEncashmentAsync(Guid companyId, Guid employeeId, int year, int month, CancellationToken cancellationToken = default)
    {
        try
        {
            return await httpClient.GetFromJsonAsync<decimal>($"/api/v1/leaves/encashment/approved?companyId={companyId}&employeeId={employeeId}&year={year}&month={month}", cancellationToken);
        }
        catch (HttpRequestException)
        {
            return 0;
        }
    }
}

public sealed class CompanyServiceClient(HttpClient httpClient) : ICompanyServiceClient
{
    public async Task<CompanySnapshot?> GetCompanyAsync(Guid companyId, CancellationToken cancellationToken = default)
    {
        return await httpClient.GetFromJsonAsync<CompanySnapshot?>($"/api/v1/companies/{companyId}", cancellationToken);
    }
}

public sealed class NotificationServiceClient(HttpClient httpClient) : INotificationServiceClient
{
    private readonly HttpClient _httpClient = httpClient;

    public async Task SendPayrollApprovalNotificationAsync(Guid companyId, Guid payrollPeriodId, CancellationToken cancellationToken = default)
    {
        try
        {
            await _httpClient.PostAsJsonAsync("/api/v1/notification/send", new
            {
                recipientId = companyId,
                type = "InApp",
                subject = "Payroll Approved",
                body = $"Payroll for period {payrollPeriodId} has been approved and is ready for disbursement."
            }, cancellationToken);
        }
        catch { /* notification failure must not block payroll processing */ }
    }

    public async Task SendPayslipNotificationAsync(Guid companyId, Guid employeeId, Guid payrollPeriodId, CancellationToken cancellationToken = default)
    {
        try
        {
            await _httpClient.PostAsJsonAsync("/api/v1/notification/send", new
            {
                recipientId = employeeId,
                type = "InApp",
                subject = "Your Payslip is Ready",
                body = $"Your payslip for payroll period {payrollPeriodId} is now available."
            }, cancellationToken);
        }
        catch { /* notification failure must not block payslip generation */ }
    }
}
