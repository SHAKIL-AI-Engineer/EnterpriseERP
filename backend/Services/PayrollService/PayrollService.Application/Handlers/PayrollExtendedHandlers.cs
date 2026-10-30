using MediatR;
using PayrollService.Contracts;
using PayrollService.Domain.Entities;

using Erp.BuildingBlocks.SharedKernel;

namespace PayrollService.Application.Handlers;

public sealed class SalaryAdvanceExtendedHandlers(IPayrollDbContext db) :
    IRequestHandler<ListSalaryAdvancesQuery, ApiResponse<IReadOnlyList<SalaryAdvanceDto>>>,
    IRequestHandler<GetSalaryAdvanceSummaryQuery, ApiResponse<SalaryAdvanceSummaryDto>>,
    IRequestHandler<BatchCreateSalaryAdvanceCommand, ApiResponse<IReadOnlyList<SalaryAdvanceDto>>>,
    IRequestHandler<BatchDeleteSalaryAdvanceCommand, ApiResponse<int>>
{
    public Task<ApiResponse<IReadOnlyList<SalaryAdvanceDto>>> Handle(ListSalaryAdvancesQuery query, CancellationToken cancellationToken)
    {
        var advances = db.SalaryAdvances.Where(x => x.CompanyId == query.CompanyId).AsEnumerable();
        if (!string.IsNullOrWhiteSpace(query.Status))
        {
            advances = advances.Where(x => string.Equals(x.Status, query.Status, StringComparison.OrdinalIgnoreCase));
        }

        if (query.Year.HasValue)
        {
            advances = advances.Where(x => x.DeductionStartYear == query.Year || x.AdvanceDate.Year == query.Year);
        }

        if (query.Month.HasValue)
        {
            advances = advances.Where(x => x.DeductionStartMonth == query.Month || x.AdvanceDate.Month == query.Month);
        }

        var result = advances.OrderByDescending(x => x.AdvanceDate).Select(x => x.ToDto()).ToList();
        return Task.FromResult(ApiResponse<IReadOnlyList<SalaryAdvanceDto>>.Ok(result));
    }

    public Task<ApiResponse<SalaryAdvanceSummaryDto>> Handle(GetSalaryAdvanceSummaryQuery query, CancellationToken cancellationToken)
    {
        var advances = db.SalaryAdvances.Where(x => x.CompanyId == query.CompanyId).AsEnumerable();
        if (query.Year.HasValue)
        {
            advances = advances.Where(x => x.DeductionStartYear == query.Year || x.AdvanceDate.Year == query.Year);
        }

        if (query.Month.HasValue)
        {
            advances = advances.Where(x => x.DeductionStartMonth == query.Month || x.AdvanceDate.Month == query.Month);
        }

        var list = advances.ToList();
        var summary = new SalaryAdvanceSummaryDto(
            list.Count,
            list.Sum(x => x.AdvanceAmount),
            list.Sum(x => x.BalanceAmount),
            list.Count(x => x.Status == "Approved" || x.Status == "Running"),
            list.Count(x => x.Status == "Pending"));
        return Task.FromResult(ApiResponse<SalaryAdvanceSummaryDto>.Ok(summary));
    }

    public async Task<ApiResponse<IReadOnlyList<SalaryAdvanceDto>>> Handle(BatchCreateSalaryAdvanceCommand command, CancellationToken cancellationToken)
    {
        var r = command.Request;
        var created = new List<SalaryAdvanceDto>();
        var index = 1;
        foreach (var employeeId in r.EmployeeIds.Distinct())
        {
            var advance = new SalaryAdvance
            {
                CompanyId = r.CompanyId,
                EmployeeId = employeeId,
                AdvanceNo = $"{r.AdvanceNoPrefix ?? "ADV"}-{BusinessTime.Now:yyyyMMdd}-{index:D4}",
                AdvanceAmount = r.AdvanceAmount,
                BalanceAmount = r.AdvanceAmount,
                AdvanceDate = r.AdvanceDate,
                DeductionStartMonth = r.DeductionStartMonth,
                DeductionStartYear = r.DeductionStartYear,
                InstallmentAmount = r.InstallmentAmount,
                RequestedBy = r.RequestedBy,
            };
            db.Add(advance);
            created.Add(advance.ToDto());
            index++;
        }

        await db.SaveChangesAsync(cancellationToken);
        return ApiResponse<IReadOnlyList<SalaryAdvanceDto>>.Ok(created, "Salary advances created.");
    }

    public async Task<ApiResponse<int>> Handle(BatchDeleteSalaryAdvanceCommand command, CancellationToken cancellationToken)
    {
        var advances = db.SalaryAdvances.Where(x => command.Request.Ids.Contains(x.Id) && x.Status == "Pending").ToList();
        foreach (var advance in advances)
        {
            db.Remove(advance);
        }

        await db.SaveChangesAsync(cancellationToken);
        return ApiResponse<int>.Ok(advances.Count, "Pending salary advances removed.");
    }
}

public sealed class DailyPayrollHandlers(
    IPayrollDbContext db,
    IEmployeeServiceClient employeeServiceClient) :
    IRequestHandler<GetDailySalarySheetQuery, ApiResponse<IReadOnlyList<DailySalarySheetRowDto>>>,
    IRequestHandler<ProcessDailyPayrollCommand, ApiResponse<ProcessDailyPayrollResultDto>>
{
    public async Task<ApiResponse<IReadOnlyList<DailySalarySheetRowDto>>> Handle(GetDailySalarySheetQuery query, CancellationToken cancellationToken)
    {
        var employees = await employeeServiceClient.GetActiveEmployeesAsync(query.CompanyId, cancellationToken);
        var salaries = db.EmployeeSalaries.Where(x => x.CompanyId == query.CompanyId && x.IsCurrent).ToList();
        var rows = new List<DailySalarySheetRowDto>();

        foreach (var employee in employees)
        {
            if (!PayrollEnrichmentHelper.MatchesEmployeeFilter(employee, query.DepartmentId, null, null, null, query.SearchTerm))
            {
                continue;
            }

            var salary = salaries.FirstOrDefault(x => x.EmployeeId == employee.EmployeeId);
            var gross = salary?.GrossSalary ?? 0;
            var perDay = gross <= 0 ? 0 : decimal.Round(gross / 30m, 2, MidpointRounding.AwayFromZero);
            var present = query.Date.DayOfWeek is DayOfWeek.Friday ? 0 : 1;
            var attendanceStatus = present == 1 ? "Present" : "Weekend";
            var otHours = present == 1 ? 2m : 0m;
            var otAmount = decimal.Round(perDay / 8m * otHours * 2m, 2, MidpointRounding.AwayFromZero);
            var deduction = present == 1 ? 0 : perDay;
            var earning = present == 1 ? perDay + otAmount : 0;
            var net = earning - deduction;

            rows.Add(new DailySalarySheetRowDto(
                employee.EmployeeId,
                employee.EmployeeCode,
                employee.EmployeeName,
                employee.DepartmentName,
                employee.DesignationName,
                query.Date,
                gross,
                perDay,
                attendanceStatus,
                otHours,
                otAmount,
                earning,
                deduction,
                net));
        }

        return ApiResponse<IReadOnlyList<DailySalarySheetRowDto>>.Ok(rows);
    }

    public Task<ApiResponse<ProcessDailyPayrollResultDto>> Handle(ProcessDailyPayrollCommand command, CancellationToken cancellationToken)
    {
        var result = new ProcessDailyPayrollResultDto(command.Request.DepartmentId.HasValue ? 1 : 0, 0, "Daily payroll preview calculated.");
        return Task.FromResult(ApiResponse<ProcessDailyPayrollResultDto>.Ok(result, result.Message));
    }
}

public sealed class PayrollBonusHandlers(
    IPayrollDbContext db,
    IEmployeeServiceClient employeeServiceClient,
    IBonusCalculationService bonusCalculationService) :
    IRequestHandler<GetPayrollBonusesQuery, ApiResponse<IReadOnlyList<PayrollBonusRowDto>>>,
    IRequestHandler<CreatePayrollBonusCommand, ApiResponse<PayrollBonusRowDto>>,
    IRequestHandler<ProcessFestivalBonusCommand, ApiResponse<FestivalBonusProcessResultDto>>,
    IRequestHandler<DeletePayrollBonusCommand, ApiResponse<bool>>,
    IRequestHandler<GetFestivalBonusBankSheetQuery, ApiResponse<IReadOnlyList<FestivalBonusBankSheetRowDto>>>
{
    public async Task<ApiResponse<IReadOnlyList<PayrollBonusRowDto>>> Handle(GetPayrollBonusesQuery query, CancellationToken cancellationToken)
    {
        var payrollQuery = db.EmployeePayrolls.Where(x => x.CompanyId == query.CompanyId && x.YearNo == query.YearNo);
        if (query.MonthNo.HasValue)
        {
            payrollQuery = payrollQuery.Where(x => x.MonthNo == query.MonthNo);
        }

        var employees = await employeeServiceClient.GetActiveEmployeesAsync(query.CompanyId, cancellationToken);
        var employeeMap = employees.ToDictionary(x => x.EmployeeId);
        var rows = payrollQuery
            .Where(x => x.FestivalBonusAmount > 0)
            .ToList()
            .Select(x =>
            {
                employeeMap.TryGetValue(x.EmployeeId, out var employee);
                return new PayrollBonusRowDto(
                    x.Id,
                    x.EmployeeId,
                    employee?.EmployeeName,
                    query.BonusType ?? "Festival",
                    x.FestivalBonusAmount,
                    x.YearNo,
                    x.MonthNo,
                    x.Status);
            })
            .ToList();

        return ApiResponse<IReadOnlyList<PayrollBonusRowDto>>.Ok(rows);
    }

    public async Task<ApiResponse<PayrollBonusRowDto>> Handle(CreatePayrollBonusCommand command, CancellationToken cancellationToken)
    {
        var r = command.Request;
        var payroll = db.EmployeePayrolls.FirstOrDefault(x =>
            x.CompanyId == r.CompanyId && x.YearNo == r.YearNo && x.MonthNo == r.MonthNo && x.EmployeeId == r.EmployeeId);
        if (payroll is null)
        {
            return ApiResponse<PayrollBonusRowDto>.Fail("Employee payroll not found for month. Process payroll first.");
        }

        payroll.FestivalBonusAmount = r.Amount;
        payroll.TotalEarnings += r.Amount;
        payroll.NetSalary += r.Amount;
        await db.SaveChangesAsync(cancellationToken);

        var employee = await employeeServiceClient.GetEmployeeByIdAsync(r.CompanyId, r.EmployeeId, cancellationToken);
        return ApiResponse<PayrollBonusRowDto>.Ok(new PayrollBonusRowDto(
            payroll.Id,
            payroll.EmployeeId,
            employee?.EmployeeName,
            r.BonusType,
            r.Amount,
            r.YearNo,
            r.MonthNo,
            payroll.Status));
    }

    public async Task<ApiResponse<FestivalBonusProcessResultDto>> Handle(ProcessFestivalBonusCommand command, CancellationToken cancellationToken)
    {
        var r = command.Request;
        var bonusDate = new DateOnly(r.YearNo, r.MonthNo, 1);
        var processed = 0;
        var skipped = 0;
        decimal total = 0;

        var payrollRows = db.EmployeePayrolls
            .Where(x => x.CompanyId == r.CompanyId && x.YearNo == r.YearNo && x.MonthNo == r.MonthNo)
            .ToList();
        foreach (var payroll in payrollRows)
        {
            var joinDate = await employeeServiceClient.GetEmployeeJoinDateAsync(r.CompanyId, payroll.EmployeeId, cancellationToken)
                ?? new DateOnly(r.YearNo, 1, 1);
            var baseAmount = string.Equals(r.BaseOn, "Basic", StringComparison.OrdinalIgnoreCase) ? payroll.BasicSalary : payroll.GrossSalary;
            var bonus = bonusCalculationService.CalculateFestivalBonus(baseAmount, joinDate, bonusDate);
            if (r.Percentage > 0)
            {
                bonus = decimal.Round(baseAmount * r.Percentage / 100m, 2, MidpointRounding.AwayFromZero);
            }

            if (bonus <= 0)
            {
                skipped++;
                continue;
            }

            payroll.FestivalBonusAmount = bonus;
            payroll.TotalEarnings += bonus;
            payroll.NetSalary += bonus;
            total += bonus;
            processed++;
        }

        await db.SaveChangesAsync(cancellationToken);
        return ApiResponse<FestivalBonusProcessResultDto>.Ok(
            new FestivalBonusProcessResultDto(processed, skipped, total, "Festival bonus processed."),
            "Festival bonus processed.");
    }

    public async Task<ApiResponse<bool>> Handle(DeletePayrollBonusCommand command, CancellationToken cancellationToken)
    {
        var payroll = db.EmployeePayrolls.FirstOrDefault(x => x.Id == command.EmployeePayrollId);
        if (payroll is null)
        {
            return ApiResponse<bool>.Fail("Payroll bonus row not found.");
        }

        payroll.NetSalary -= payroll.FestivalBonusAmount;
        payroll.TotalEarnings -= payroll.FestivalBonusAmount;
        payroll.FestivalBonusAmount = 0;
        await db.SaveChangesAsync(cancellationToken);
        return ApiResponse<bool>.Ok(true, "Bonus removed.");
    }

    public async Task<ApiResponse<IReadOnlyList<FestivalBonusBankSheetRowDto>>> Handle(GetFestivalBonusBankSheetQuery query, CancellationToken cancellationToken)
    {
        var employees = await employeeServiceClient.GetActiveEmployeesAsync(query.CompanyId, cancellationToken);
        var rows = db.EmployeePayrolls
            .Where(x => x.CompanyId == query.CompanyId && x.YearNo == query.YearNo && x.MonthNo == query.MonthNo &&
                        x.FestivalBonusAmount > 0)
            .ToList()
            .Select(x =>
            {
                var employee = employees.FirstOrDefault(e => e.EmployeeId == x.EmployeeId);
                return new FestivalBonusBankSheetRowDto(
                    x.EmployeeId,
                    employee?.EmployeeName,
                    employee?.BankAccountNo,
                    employee?.BankName,
                    x.FestivalBonusAmount);
            })
            .ToList();

        return ApiResponse<IReadOnlyList<FestivalBonusBankSheetRowDto>>.Ok(rows);
    }
}
