using System.Globalization;
using System.Text;
using AttendanceService.Application.Common.Interfaces;
using AttendanceService.Application.DTOs;
using AttendanceService.Application.Features.Attendance;
using AttendanceService.Domain.Entities;
using AttendanceService.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace AttendanceService.Infrastructure.Services;

public sealed class AttendanceBillService(IAttendanceDbContext db, IAttendanceEmployeeQuery employeeQuery) : IAttendanceBillService
{
    private const decimal DefaultNightAmount = 100m;
    private const decimal DefaultTiffinAmount = 30m;
    private const decimal DefaultIfterAmount = 50m;
    private const decimal DefaultHolidayAmount = 150m;

    public async Task<BillResponseDto> GetAsync(string billType, BillQuery query, CancellationToken cancellationToken = default)
    {
        var records = await QueryRecords(billType, query, cancellationToken);
        return ToResponse(records);
    }

    public async Task<int> ProcessAsync(string billType, ProcessBillsRequest request, CancellationToken cancellationToken = default)
    {
        var type = NormalizeType(billType);
        var from = request.FromDate.Date;
        var to = request.ToDate.Date;
        if (to < from) (from, to) = (to, from);

        var filter = new AttendanceEmployeeFilter(
            request.CompanyId,
            request.DepartmentId,
            SearchTerm: request.SearchTerm);

        var profiles = await employeeQuery.GetProfilesAsync(filter, cancellationToken);
        var employeeIds = profiles.Keys.ToHashSet();

        var attendances = await db.DailyAttendances
            .AsNoTracking()
            .Where(a =>
                a.CompanyId == request.CompanyId &&
                a.AttendanceDate >= from &&
                a.AttendanceDate <= to &&
                employeeIds.Contains(a.EmployeeId))
            .ToListAsync(cancellationToken);

        var existing = await db.AttendanceBillRecords
            .Where(b => b.CompanyId == request.CompanyId && b.BillType == type && b.BillDate >= from && b.BillDate <= to)
            .ToListAsync(cancellationToken);

        db.AttendanceBillRecords.RemoveRange(existing);

        var created = 0;
        foreach (var row in attendances)
        {
            if (!profiles.TryGetValue(row.EmployeeId, out var profile)) continue;
            if (!ShouldInclude(profile, request.EmployeeType)) continue;

            var (include, amount, tiffinCount) = EvaluateRow(type, row);
            if (!include || amount <= 0) continue;

            db.AttendanceBillRecords.Add(new AttendanceBillRecord
            {
                CompanyId = request.CompanyId,
                EmployeeId = row.EmployeeId,
                PunchNumber = row.PunchNumber,
                EmployeeID = row.EmployeeID,
                EmployeeName = profile.FullName,
                Department = profile.DepartmentName ?? "",
                Designation = profile.DesignationName ?? "",
                BillType = type,
                BillDate = row.AttendanceDate.Date,
                Amount = amount,
                TiffinCount = tiffinCount,
                Status = "Processed",
                ShiftName = row.ShiftName,
                InTime = row.InTime?.ToString("HH:mm"),
                OutTime = row.OutTime?.ToString("HH:mm"),
                CreatedAt = DateTime.UtcNow,
            });
            created++;
        }

        await db.SaveChangesAsync(cancellationToken);
        return created;
    }

    public async Task<bool> DeleteAsync(string billType, int id, CancellationToken cancellationToken = default)
    {
        var type = NormalizeType(billType);
        var row = await db.AttendanceBillRecords.FirstOrDefaultAsync(b => b.Id == id && b.BillType == type, cancellationToken);
        if (row is null) return false;
        db.AttendanceBillRecords.Remove(row);
        await db.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<int> DeleteMultipleAsync(string billType, IReadOnlyList<int> ids, CancellationToken cancellationToken = default)
    {
        if (ids.Count == 0) return 0;
        var type = NormalizeType(billType);
        var rows = await db.AttendanceBillRecords
            .Where(b => b.BillType == type && ids.Contains(b.Id))
            .ToListAsync(cancellationToken);
        db.AttendanceBillRecords.RemoveRange(rows);
        await db.SaveChangesAsync(cancellationToken);
        return rows.Count;
    }

    public async Task<byte[]> ExportCsvAsync(string billType, BillQuery query, CancellationToken cancellationToken = default)
    {
        var records = await QueryRecords(billType, query, cancellationToken);
        var sb = new StringBuilder();
        sb.AppendLine("EmployeeCard,EmployeeId,EmployeeName,Department,Designation,Date,Amount,Status,Shift");
        foreach (var r in records)
        {
            sb.AppendLine(string.Join(",",
                r.PunchNumber,
                r.EmployeeID,
                Csv(r.EmployeeName),
                Csv(r.Department),
                Csv(r.Designation),
                r.BillDate.ToString("yyyy-MM-dd"),
                r.Amount.ToString(CultureInfo.InvariantCulture),
                r.Status,
                Csv(r.ShiftName ?? "")));
        }
        return Encoding.UTF8.GetBytes(sb.ToString());
    }

    private async Task<List<AttendanceBillRecord>> QueryRecords(string billType, BillQuery query, CancellationToken cancellationToken)
    {
        var type = NormalizeType(billType);
        var from = query.FromDate.Date;
        var to = query.ToDate.Date;

        var q = db.AttendanceBillRecords.AsNoTracking()
            .Where(b => b.CompanyId == query.CompanyId && b.BillType == type && b.BillDate >= from && b.BillDate <= to);

        if (!string.IsNullOrWhiteSpace(query.SearchTerm))
        {
            var term = query.SearchTerm.Trim();
            q = q.Where(b =>
                b.EmployeeID.Contains(term) ||
                b.EmployeeName.Contains(term) ||
                b.PunchNumber.ToString().Contains(term));
        }

        var list = await q.OrderBy(b => b.BillDate).ThenBy(b => b.EmployeeName).ToListAsync(cancellationToken);

        if (query.DepartmentId.HasValue)
        {
            var filter = new AttendanceEmployeeFilter(query.CompanyId, query.DepartmentId);
            var ids = await employeeQuery.GetEmployeeIdsMatchingFilterAsync(filter, cancellationToken);
            list = list.Where(b => ids.Contains(b.EmployeeId)).ToList();
        }

        if (!string.IsNullOrWhiteSpace(query.EmployeeType) && !string.Equals(query.EmployeeType, "all", StringComparison.OrdinalIgnoreCase))
        {
            var profiles = await employeeQuery.GetProfilesAsync(
                new AttendanceEmployeeFilter(query.CompanyId, query.DepartmentId),
                cancellationToken);
            list = list.Where(b =>
            {
                if (!profiles.TryGetValue(b.EmployeeId, out var p)) return false;
                return ShouldInclude(p, query.EmployeeType);
            }).ToList();
        }

        return list;
    }

    private static BillResponseDto ToResponse(List<AttendanceBillRecord> records)
    {
        var dtos = records.Select(r => new BillDto(
            r.Id,
            r.PunchNumber,
            r.EmployeeID,
            r.EmployeeName,
            r.Department,
            r.Designation,
            r.BillDate.ToString("yyyy-MM-dd"),
            r.Amount,
            r.Status,
            r.CreatedAt.ToString("o"),
            r.ShiftName ?? "",
            r.CompanyName ?? "",
            r.InTime,
            r.OutTime,
            r.BillType == "Tiffin" ? r.TiffinCount : null)).ToList();

        var summary = new BillSummaryDto(
            dtos.Sum(d => d.Amount),
            dtos.Select(d => d.EmployeeId).Distinct(StringComparer.OrdinalIgnoreCase).Count(),
            dtos.Count);

        return new BillResponseDto(summary, dtos);
    }

    private static (bool Include, decimal Amount, int TiffinCount) EvaluateRow(string billType, DailyAttendance row)
    {
        return billType switch
        {
            "Night" when AttendanceReportHelper.IsPresent(row.Status) && row.OvertimeMinutes > 0 =>
                (true, DefaultNightAmount, 0),
            "Night" when AttendanceReportHelper.IsPresent(row.Status) && row.OutTime.HasValue && row.OutTime.Value.Hour >= 20 =>
                (true, DefaultNightAmount, 0),
            "Tiffin" when AttendanceReportHelper.IsPresent(row.Status) =>
                (true, DefaultTiffinAmount, 1),
            "Ifter" when row.DayType == DayType.Holiday && AttendanceReportHelper.IsPresent(row.Status) =>
                (true, DefaultIfterAmount, 0),
            "Ifter" when AttendanceReportHelper.IsPresent(row.Status) && row.WorkingMinutes >= 240 =>
                (true, DefaultIfterAmount, 0),
            "Holiday" when row.DayType == DayType.Holiday && AttendanceReportHelper.IsPresent(row.Status) =>
                (true, DefaultHolidayAmount, 0),
            _ => (false, 0, 0),
        };
    }

    private static bool ShouldInclude(AttendanceEmployeeProfile profile, string? employeeType)
    {
        if (string.IsNullOrWhiteSpace(employeeType) || string.Equals(employeeType, "all", StringComparison.OrdinalIgnoreCase))
            return true;
        var desig = profile.DesignationName ?? "";
        if (string.Equals(employeeType, "staff", StringComparison.OrdinalIgnoreCase))
            return desig.Contains("officer", StringComparison.OrdinalIgnoreCase) ||
                   desig.Contains("manager", StringComparison.OrdinalIgnoreCase) ||
                   desig.Contains("executive", StringComparison.OrdinalIgnoreCase);
        if (string.Equals(employeeType, "worker", StringComparison.OrdinalIgnoreCase))
            return !desig.Contains("officer", StringComparison.OrdinalIgnoreCase) &&
                   !desig.Contains("manager", StringComparison.OrdinalIgnoreCase);
        return true;
    }

    private static string NormalizeType(string billType) =>
        billType.ToLowerInvariant() switch
        {
            "night" or "nightbill" => "Night",
            "tiffin" or "tiffinbill" => "Tiffin",
            "ifter" or "iftar" or "ifterbill" => "Ifter",
            "holiday" or "holidaybill" => "Holiday",
            _ => throw new ArgumentException($"Unknown bill type: {billType}"),
        };

    private static string Csv(string value) =>
        value.Contains(',') || value.Contains('"') ? $"\"{value.Replace("\"", "\"\"")}\"" : value;
}
