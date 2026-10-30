using System.Net.Http.Json;
using AttendanceService.Application.Common.Interfaces;
using AttendanceService.Application.DTOs;

namespace AttendanceService.Infrastructure.Services;

public class ShiftServiceClient(HttpClient httpClient) : IShiftServiceClient
{
    public async Task<ShiftEvaluationDto?> GetShiftEvaluationAsync(
        Guid companyId,
        Guid employeeId,
        DateTime date,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var url = $"shifts/evaluation?companyId={companyId}&employeeId={employeeId}&date={date:yyyy-MM-dd}";
            var response = await httpClient.GetFromJsonAsync<ShiftApiEnvelope<ShiftEvaluationDto>>(url, cancellationToken);
            return response?.Success == true ? response.Data : null;
        }
        catch
        {
            return null;
        }
    }

    public async Task<IReadOnlyList<ShiftEvaluationDto>> GetShiftEvaluationsAsync(
        Guid companyId,
        IReadOnlyCollection<Guid> employeeIds,
        DateTime date,
        CancellationToken cancellationToken = default)
    {
        if (employeeIds.Count == 0)
        {
            return [];
        }

        try
        {
            var response = await httpClient.PostAsJsonAsync(
                "shifts/evaluation/bulk",
                new BulkShiftEvaluationRequest(companyId, employeeIds, date),
                cancellationToken);

            var envelope = await response.Content.ReadFromJsonAsync<ShiftApiEnvelope<IReadOnlyList<ShiftEvaluationDto>>>(
                cancellationToken);
            return envelope?.Success == true && envelope.Data is not null ? envelope.Data : [];
        }
        catch
        {
            return [];
        }
    }

    private sealed class ShiftApiEnvelope<T>
    {
        public bool Success { get; set; }
        public T? Data { get; set; }
    }

    private sealed record BulkShiftEvaluationRequest(
        Guid CompanyId,
        IReadOnlyCollection<Guid> EmployeeIds,
        DateTime Date);
}
