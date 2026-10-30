using MediatR;
using PayrollService.Contracts;
using PayrollService.Domain.Entities;
using PayrollService.Domain.Enums;

using Erp.BuildingBlocks.SharedKernel;

namespace PayrollService.Application.Handlers;

public sealed class ProcessPayrollHandler(
    IPayrollDbContext db,
    IPolicyResolver policyResolver,
    ISalaryStructureCalculator salaryStructureCalculator,
    IPayrollCalculationService payrollCalculationService,
    ISalaryAdvanceService salaryAdvanceService,
    IEmployeeServiceClient employeeServiceClient,
    IAttendanceServiceClient attendanceServiceClient,
    ILeaveServiceClient leaveServiceClient,
    IIntegrationEventPublisher publisher) :
    IRequestHandler<ProcessPayrollCommand, ApiResponse<PayrollSummaryDto>>,
    IRequestHandler<ReprocessPayrollCommand, ApiResponse<PayrollSummaryDto>>
{
    public Task<ApiResponse<PayrollSummaryDto>> Handle(ProcessPayrollCommand command, CancellationToken cancellationToken) =>
        ProcessAsync(command.Request with { ForceReprocess = false }, cancellationToken);

    public Task<ApiResponse<PayrollSummaryDto>> Handle(ReprocessPayrollCommand command, CancellationToken cancellationToken) =>
        ProcessAsync(command.Request with { ForceReprocess = true }, cancellationToken);

    private async Task<ApiResponse<PayrollSummaryDto>> ProcessAsync(ProcessPayrollRequest request, CancellationToken cancellationToken)
    {
        var (startDate, endDate) = SalaryProcessingModeProfiles.MonthRange(request.YearNo, request.MonthNo);
        ResolvedPayrollPolicy resolved;
        try
        {
            resolved = await policyResolver.ResolveRequiredAsync(request.CompanyId, startDate, cancellationToken);
        }
        catch (InvalidOperationException ex)
        {
            return ApiResponse<PayrollSummaryDto>.Fail(ex.Message);
        }

        var settings = resolved.Settings;
        var template = resolved.Template;

        if (settings.UseApprovedAttendanceOnly &&
            !await attendanceServiceClient.IsMonthlyAttendanceApprovedAsync(request.CompanyId, request.YearNo, request.MonthNo, cancellationToken))
        {
            return ApiResponse<PayrollSummaryDto>.Fail("Monthly attendance summary is not approved.");
        }

        if (!request.ForceReprocess && db.EmployeePayrolls.Any(x =>
                x.CompanyId == request.CompanyId && x.YearNo == request.YearNo && x.MonthNo == request.MonthNo))
        {
            return ApiResponse<PayrollSummaryDto>.Fail("Payroll already processed. Use reprocess endpoint.");
        }

        if (request.ForceReprocess)
        {
            foreach (var oldPayroll in db.EmployeePayrolls.Where(x =>
                         x.CompanyId == request.CompanyId && x.YearNo == request.YearNo && x.MonthNo == request.MonthNo).ToList())
            {
                foreach (var installment in db.SalaryAdvanceInstallments.Where(x => x.EmployeePayrollId == oldPayroll.Id).ToList())
                {
                    installment.Status = "Pending";
                    installment.PaidAmount = 0;
                    installment.EmployeePayrollId = null;
                }

                foreach (var earning in db.PayrollEarnings.Where(x => x.EmployeePayrollId == oldPayroll.Id).ToList())
                {
                    db.Remove(earning);
                }

                foreach (var deduction in db.PayrollDeductions.Where(x => x.EmployeePayrollId == oldPayroll.Id).ToList())
                {
                    db.Remove(deduction);
                }

                db.Remove(oldPayroll);
            }
        }

        var runNo = db.PayrollRuns.Count(x =>
            x.CompanyId == request.CompanyId && x.YearNo == request.YearNo && x.MonthNo == request.MonthNo) + 1;
        var snapshotJson = PolicyResolver.BuildSnapshotJson(template, resolved.Assignment);
        var run = new PayrollRun
        {
            CompanyId = request.CompanyId,
            YearNo = request.YearNo,
            MonthNo = request.MonthNo,
            StartDate = startDate,
            EndDate = endDate,
            ProcessingMode = resolved.ProcessingModeLabel,
            AppliedPolicyCode = template.PolicyCode,
            AppliedPolicyVersion = template.Version,
            OvertimeCalculationType = settings.OvertimeCalculationType,
            FixedOvertimeRate = settings.FixedOvertimeRate,
            RunNo = runNo,
            RunStatus = "Processing",
            ProcessedBy = request.ProcessedBy,
        };
        db.Add(run);

        var employees = (await employeeServiceClient.GetActiveEmployeesAsync(request.CompanyId, cancellationToken))
            .GroupBy(x => x.EmployeeId)
            .Select(x => x.First())
            .ToList();
        if (employees.Count == 0)
        {
            employees = db.EmployeeSalaries
                .Where(x => x.CompanyId == request.CompanyId && x.EffectiveFrom <= endDate &&
                            (!x.EffectiveTo.HasValue || x.EffectiveTo >= startDate))
                .GroupBy(x => x.EmployeeId)
                .Select(x => x.OrderByDescending(s => s.EffectiveFrom).First())
                .Select(x => new EmployeeSnapshot(x.EmployeeId, x.CompanyId, x.EffectiveFrom, true))
                .ToList();
        }

        run.TotalEmployees = employees.Count;

        foreach (var employee in employees)
        {
            if (!request.ForceReprocess && db.EmployeePayrolls.Any(x =>
                    x.CompanyId == request.CompanyId && x.EmployeeId == employee.EmployeeId &&
                    x.YearNo == request.YearNo && x.MonthNo == request.MonthNo))
            {
                continue;
            }

            var salary = db.EmployeeSalaries
                .Where(x => x.CompanyId == request.CompanyId && x.EmployeeId == employee.EmployeeId &&
                            x.EffectiveFrom <= endDate && (!x.EffectiveTo.HasValue || x.EffectiveTo >= startDate))
                .OrderByDescending(x => x.EffectiveFrom)
                .FirstOrDefault();
            salary ??= await employeeServiceClient.TryResolveHrSalaryAsync(
                request.CompanyId, employee.EmployeeId, startDate, endDate, cancellationToken);
            if (salary is null)
            {
                run.FailedEmployees++;
                continue;
            }

            var structure = salaryStructureCalculator.Calculate(salary.GrossSalary, template);
            var calculationSalary = ForCalculation(salary, structure);

            AttendanceSummary attendance;
            if (settings.UseApprovedAttendanceOnly)
            {
                var loaded = await attendanceServiceClient.GetApprovedMonthlySummaryAsync(
                    request.CompanyId, employee.EmployeeId, request.YearNo, request.MonthNo, cancellationToken);
                if (loaded is null || !loaded.IsApproved)
                {
                    run.FailedEmployees++;
                    continue;
                }

                attendance = loaded;
            }
            else
            {
                var loaded = await attendanceServiceClient.GetApprovedMonthlySummaryAsync(
                    request.CompanyId, employee.EmployeeId, request.YearNo, request.MonthNo, cancellationToken);
                attendance = loaded ?? SalaryProcessingModeProfiles.SyntheticFullMonthAttendance(
                    request.CompanyId, employee.EmployeeId, request.YearNo, request.MonthNo,
                    DateTime.DaysInMonth(request.YearNo, request.MonthNo));
            }

            if (!employee.IsOtEnabled)
            {
                attendance = attendance with { OvertimeMinutes = 0, OvertimeHours = 0 };
            }

            var advanceDeduction = await salaryAdvanceService.GetDeductibleInstallmentAsync(
                request.CompanyId, employee.EmployeeId, request.YearNo, request.MonthNo, cancellationToken);
            var otherDeductions = db.PayrollDeductionEntries
                .Where(x => x.CompanyId == request.CompanyId && x.EmployeeId == employee.EmployeeId &&
                            x.YearNo == request.YearNo && x.MonthNo == request.MonthNo && x.Status == "Approved")
                .ToList();
            var leaveEncashment = settings.AllowEarnLeaveEncashment
                ? await leaveServiceClient.GetApprovedLeaveEncashmentAsync(
                    request.CompanyId, employee.EmployeeId, request.YearNo, request.MonthNo, cancellationToken)
                : 0;
            var manualTiffin = settings.AllowTiffinBill
                ? db.AllowanceBills.Where(x => x.CompanyId == request.CompanyId && x.EmployeeId == employee.EmployeeId &&
                                               x.Status == "Approved" && x.AllowanceType == "TiffinBill" &&
                                               x.BillDate >= startDate && x.BillDate <= endDate).Sum(x => x.Amount)
                : 0;
            var manualNight = settings.AllowNightBill
                ? db.AllowanceBills.Where(x => x.CompanyId == request.CompanyId && x.EmployeeId == employee.EmployeeId &&
                                               x.Status == "Approved" && x.AllowanceType == "NightBill" &&
                                               x.BillDate >= startDate && x.BillDate <= endDate).Sum(x => x.Amount)
                : 0;

            var calc = payrollCalculationService.Calculate(
                settings,
                calculationSalary,
                attendance,
                new PayrollCalculationInputs(
                    EarnLeaveEncashmentAmount: leaveEncashment,
                    AdvanceDeduction: advanceDeduction,
                    LoanDeduction: otherDeductions.Where(x => x.DeductionType == "Loan").Sum(x => x.Amount),
                    TaxDeduction: otherDeductions.Where(x => x.DeductionType == "Tax").Sum(x => x.Amount),
                    ProvidentFundDeduction: otherDeductions.Where(x => x.DeductionType == "ProvidentFund").Sum(x => x.Amount),
                    OtherDeduction: otherDeductions.Where(x => x.DeductionType is not ("Loan" or "Tax" or "ProvidentFund"))
                        .Sum(x => x.Amount)),
                "Monthly");

            var payroll = new EmployeePayroll
            {
                CompanyId = request.CompanyId,
                YearNo = request.YearNo,
                MonthNo = request.MonthNo,
                PayrollRunId = run.Id,
                EmployeeId = employee.EmployeeId,
                ProcessingMode = resolved.ProcessingModeLabel,
                SalaryCalculationType = "Monthly",
                OvertimeCalculationType = settings.OvertimeCalculationType,
                AppliedPolicyCode = template.PolicyCode,
                AppliedPolicyVersion = template.Version,
                AppliedPolicySnapshotJson = snapshotJson,
                GrossSalary = structure.GrossSalary,
                BasicSalary = structure.BasicSalary,
                HouseRent = structure.HouseRent,
                MedicalAllowance = structure.MedicalAllowance,
                FoodAllowance = structure.FoodAllowance,
                ConveyanceAllowance = structure.ConveyanceAllowance,
                TotalDays = calc.TotalDays,
                WorkingDays = attendance.WorkingDays,
                PresentDays = attendance.PresentDays,
                AbsentDays = attendance.AbsentDays,
                LeaveDays = attendance.LeaveDays,
                LeaveWithoutPayDays = attendance.LeaveWithoutPayDays,
                LateDays = attendance.LateDays,
                HolidayPresentDays = attendance.HolidayPresentDays,
                WeeklyOffPresentDays = attendance.WeeklyOffPresentDays,
                TotalOvertimeMinutes = attendance.OvertimeMinutes,
                OvertimeHours = calc.OvertimeHours,
                OvertimeRate = calc.OvertimeRate,
                OvertimeAmount = calc.OvertimeAmount,
                TiffinBillAmount = calc.TiffinBillAmount + manualTiffin,
                NightBillAmount = calc.NightBillAmount + manualNight,
                AttendanceBonusAmount = calc.AttendanceBonusAmount,
                EarnLeaveEncashmentAmount = calc.EarnLeaveEncashmentAmount,
                TotalEarnings = calc.TotalEarnings + manualTiffin + manualNight,
                AbsentDeduction = calc.AbsentDeduction,
                LateDeduction = calc.LateDeduction,
                AdvanceDeduction = advanceDeduction,
                LoanDeduction = otherDeductions.Where(x => x.DeductionType == "Loan").Sum(x => x.Amount),
                TaxDeduction = otherDeductions.Where(x => x.DeductionType == "Tax").Sum(x => x.Amount),
                ProvidentFundDeduction = otherDeductions.Where(x => x.DeductionType == "ProvidentFund").Sum(x => x.Amount),
                OtherDeduction = otherDeductions.Where(x => x.DeductionType is not ("Loan" or "Tax" or "ProvidentFund"))
                    .Sum(x => x.Amount),
                TotalDeduction = calc.TotalDeduction,
                NetSalary = calc.NetSalary + manualTiffin + manualNight,
                Status = "Processed",
            };

            db.Add(payroll);
            AddEarnings(payroll, structure, calc, manualTiffin, manualNight);
            AddDeductions(payroll);
            await salaryAdvanceService.MarkInstallmentDeductedAsync(
                request.CompanyId, employee.EmployeeId, request.YearNo, request.MonthNo, payroll.Id, cancellationToken);
            run.ProcessedEmployees++;
        }

        run.RunStatus = run.FailedEmployees == 0 ? "Success" : run.ProcessedEmployees == 0 ? "Failed" : "Partial";
        await db.SaveChangesAsync(cancellationToken);

        if (run.ProcessedEmployees == 0)
        {
            var message = run.TotalEmployees == 0
                ? "No active employees found for this company."
                : $"Payroll could not process any of {run.TotalEmployees} employee(s). Assign payroll salary or configure HR salary for each employee.";
            return ApiResponse<PayrollSummaryDto>.Fail(message);
        }

        var summary = BuildSummary(request.CompanyId, request.YearNo, request.MonthNo);
        await publisher.PublishAsync(
            new PayrollProcessedEvent(request.CompanyId, request.YearNo, request.MonthNo, run.Id, run.ProcessedEmployees,
                BusinessTime.Now),
            cancellationToken);
        return ApiResponse<PayrollSummaryDto>.Ok(summary, "Payroll processed.");
    }

    private static EmployeeSalary ForCalculation(EmployeeSalary source, SalaryStructureResult structure) => new()
    {
        CompanyId = source.CompanyId,
        EmployeeId = source.EmployeeId,
        SalaryCalculationType = source.SalaryCalculationType,
        GrossSalary = structure.GrossSalary,
        BasicSalary = structure.BasicSalary,
        HouseRent = structure.HouseRent,
        MedicalAllowance = structure.MedicalAllowance,
        FoodAllowance = structure.FoodAllowance,
        ConveyanceAllowance = structure.ConveyanceAllowance,
    };

    private void AddEarnings(EmployeePayroll p, SalaryStructureResult s, PayrollCalculationResult c, decimal manualTiffin, decimal manualNight)
    {
        foreach (var earning in new[]
                 {
                     new PayrollEarning
                     {
                         CompanyId = p.CompanyId, EmployeePayrollId = p.Id, EarningCode = "Basic", EarningName = "Basic",
                         Amount = s.BasicSalary
                     },
                     new PayrollEarning
                     {
                         CompanyId = p.CompanyId, EmployeePayrollId = p.Id, EarningCode = "HouseRent",
                         EarningName = "House Rent", Amount = s.HouseRent
                     },
                     new PayrollEarning
                     {
                         CompanyId = p.CompanyId, EmployeePayrollId = p.Id, EarningCode = "Medical",
                         EarningName = "Medical", Amount = s.MedicalAllowance
                     },
                     new PayrollEarning
                     {
                         CompanyId = p.CompanyId, EmployeePayrollId = p.Id, EarningCode = "Conveyance",
                         EarningName = "Conveyance", Amount = s.ConveyanceAllowance
                     },
                     new PayrollEarning
                     {
                         CompanyId = p.CompanyId, EmployeePayrollId = p.Id, EarningCode = "Food", EarningName = "Food",
                         Amount = s.FoodAllowance
                     },
                     new PayrollEarning
                     {
                         CompanyId = p.CompanyId, EmployeePayrollId = p.Id, EarningCode = "Overtime",
                         EarningName = "Overtime", Amount = c.OvertimeAmount
                     },
                     new PayrollEarning
                     {
                         CompanyId = p.CompanyId, EmployeePayrollId = p.Id, EarningCode = "TiffinBill",
                         EarningName = "Tiffin Bill", Amount = c.TiffinBillAmount + manualTiffin
                     },
                     new PayrollEarning
                     {
                         CompanyId = p.CompanyId, EmployeePayrollId = p.Id, EarningCode = "NightBill",
                         EarningName = "Night Bill", Amount = c.NightBillAmount + manualNight
                     },
                     new PayrollEarning
                     {
                         CompanyId = p.CompanyId, EmployeePayrollId = p.Id, EarningCode = "AttendanceBonus",
                         EarningName = "Attendance Bonus", Amount = c.AttendanceBonusAmount
                     },
                     new PayrollEarning
                     {
                         CompanyId = p.CompanyId, EmployeePayrollId = p.Id, EarningCode = "EarnLeaveEncashment",
                         EarningName = "Earn Leave Encashment", Amount = c.EarnLeaveEncashmentAmount
                     },
                 }.Where(x => x.Amount > 0))
        {
            db.Add(earning);
        }
    }

    private void AddDeductions(EmployeePayroll p)
    {
        foreach (var deduction in new[]
                 {
                     new PayrollDeduction
                     {
                         CompanyId = p.CompanyId, EmployeePayrollId = p.Id, DeductionCode = "Absent",
                         DeductionName = "Absent", Amount = p.AbsentDeduction
                     },
                     new PayrollDeduction
                     {
                         CompanyId = p.CompanyId, EmployeePayrollId = p.Id, DeductionCode = "Late",
                         DeductionName = "Late", Amount = p.LateDeduction
                     },
                     new PayrollDeduction
                     {
                         CompanyId = p.CompanyId, EmployeePayrollId = p.Id, DeductionCode = "Advance",
                         DeductionName = "Advance", Amount = p.AdvanceDeduction
                     },
                     new PayrollDeduction
                     {
                         CompanyId = p.CompanyId, EmployeePayrollId = p.Id, DeductionCode = "Loan",
                         DeductionName = "Loan", Amount = p.LoanDeduction
                     },
                     new PayrollDeduction
                     {
                         CompanyId = p.CompanyId, EmployeePayrollId = p.Id, DeductionCode = "Tax",
                         DeductionName = "Tax", Amount = p.TaxDeduction
                     },
                     new PayrollDeduction
                     {
                         CompanyId = p.CompanyId, EmployeePayrollId = p.Id, DeductionCode = "ProvidentFund",
                         DeductionName = "Provident Fund", Amount = p.ProvidentFundDeduction
                     },
                     new PayrollDeduction
                     {
                         CompanyId = p.CompanyId, EmployeePayrollId = p.Id, DeductionCode = "Other",
                         DeductionName = "Other", Amount = p.OtherDeduction
                     },
                 }.Where(x => x.Amount > 0))
        {
            db.Add(deduction);
        }
    }

    private PayrollSummaryDto BuildSummary(Guid companyId, int yearNo, int monthNo)
    {
        var rows = db.EmployeePayrolls
            .Where(x => x.CompanyId == companyId && x.YearNo == yearNo && x.MonthNo == monthNo)
            .ToList();
        return new PayrollSummaryDto(
            companyId,
            yearNo,
            monthNo,
            rows.Count,
            rows.Sum(x => x.GrossSalary),
            rows.Sum(x => x.TotalEarnings),
            rows.Sum(x => x.TotalDeduction),
            rows.Sum(x => x.NetSalary),
            rows.Count > 0 ? "Processed" : "Open");
    }
}
