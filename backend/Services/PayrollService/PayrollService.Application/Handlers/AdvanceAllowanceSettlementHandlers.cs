using MediatR;
using PayrollService.Contracts;
using PayrollService.Domain.Entities;

using Erp.BuildingBlocks.SharedKernel;

namespace PayrollService.Application.Handlers;

public sealed class SalaryAdvanceHandlers(IPayrollDbContext db, IIntegrationEventPublisher publisher) :
    IRequestHandler<CreateSalaryAdvanceCommand, ApiResponse<SalaryAdvanceDto>>,
    IRequestHandler<ApproveSalaryAdvanceCommand, ApiResponse<SalaryAdvanceDto>>,
    IRequestHandler<RejectSalaryAdvanceCommand, ApiResponse<SalaryAdvanceDto>>,
    IRequestHandler<GetSalaryAdvanceBalanceQuery, ApiResponse<SalaryAdvanceBalanceDto>>
{
    public async Task<ApiResponse<SalaryAdvanceDto>> Handle(CreateSalaryAdvanceCommand command, CancellationToken cancellationToken)
    {
        var r = command.Request;
        if (r.AdvanceAmount <= 0 || r.InstallmentAmount <= 0 || (r.InstallmentAmount > 0 && decimal.Ceiling(r.AdvanceAmount / r.InstallmentAmount) > 600) || r.DeductionStartMonth is < 1 or > 12 || r.DeductionStartYear is < 2000 or > 2200)
            return ApiResponse<SalaryAdvanceDto>.Fail("Provide a positive amount, positive installment and valid repayment period.");
        var advance = new SalaryAdvance
        {
            CompanyId = r.CompanyId,
            EmployeeId = r.EmployeeId,
            AdvanceNo = r.AdvanceNo,
            AdvanceAmount = r.AdvanceAmount,
            BalanceAmount = r.AdvanceAmount,
            AdvanceDate = r.AdvanceDate,
            DeductionStartMonth = r.DeductionStartMonth,
            DeductionStartYear = r.DeductionStartYear,
            InstallmentAmount = r.InstallmentAmount,
            RequestedBy = r.RequestedBy,
        };
        db.Add(advance);
        await db.SaveChangesAsync(cancellationToken);
        return ApiResponse<SalaryAdvanceDto>.Ok(advance.ToDto(), "Salary advance requested.");
    }

    public async Task<ApiResponse<SalaryAdvanceDto>> Handle(ApproveSalaryAdvanceCommand command, CancellationToken cancellationToken)
    {
        var advance = db.SalaryAdvances.FirstOrDefault(x => x.Id == command.Id);
        if (advance is null) return ApiResponse<SalaryAdvanceDto>.Fail("Salary advance not found.");
        if (advance.Status != "Pending") return ApiResponse<SalaryAdvanceDto>.Fail("Only pending advances can be reviewed.");
        if (advance.AdvanceAmount <= 0 || advance.InstallmentAmount <= 0 || decimal.Ceiling(advance.AdvanceAmount / advance.InstallmentAmount) > 600)
            return ApiResponse<SalaryAdvanceDto>.Fail("Invalid installment schedule. At most 600 positive installments are supported.");
        advance.Status = "Approved";
        advance.ApprovedBy = command.ApprovedBy;
        advance.ApprovedAt = BusinessTime.Now;
        CreateInstallments(advance);
        await db.SaveChangesAsync(cancellationToken);
        await publisher.PublishAsync(new SalaryAdvanceApprovedEvent(advance.CompanyId, advance.EmployeeId, advance.Id, advance.AdvanceAmount), cancellationToken);
        return ApiResponse<SalaryAdvanceDto>.Ok(advance.ToDto(), "Salary advance approved.");
    }

    public async Task<ApiResponse<SalaryAdvanceDto>> Handle(RejectSalaryAdvanceCommand command, CancellationToken cancellationToken)
    {
        var advance = db.SalaryAdvances.FirstOrDefault(x => x.Id == command.Id);
        if (advance is null) return ApiResponse<SalaryAdvanceDto>.Fail("Salary advance not found.");
        if (advance.Status != "Pending") return ApiResponse<SalaryAdvanceDto>.Fail("Only pending advances can be reviewed.");
        advance.Status = "Rejected";
        await db.SaveChangesAsync(cancellationToken);
        return ApiResponse<SalaryAdvanceDto>.Ok(advance.ToDto(), "Salary advance rejected.");
    }

    public Task<ApiResponse<SalaryAdvanceBalanceDto>> Handle(GetSalaryAdvanceBalanceQuery query, CancellationToken cancellationToken)
    {
        var advances = db.SalaryAdvances.Where(x => x.CompanyId == query.CompanyId && x.EmployeeId == query.EmployeeId).ToList();
        var approved = advances.Where(x => x.Status == "Approved").Sum(x => x.BalanceAmount);
        var running = advances.Where(x => x.Status == "Running").Sum(x => x.BalanceAmount);
        return Task.FromResult(ApiResponse<SalaryAdvanceBalanceDto>.Ok(new SalaryAdvanceBalanceDto(query.EmployeeId, approved, running, approved + running)));
    }

    private void CreateInstallments(SalaryAdvance advance)
    {
        if (db.SalaryAdvanceInstallments.Any(x => x.SalaryAdvanceId == advance.Id))
        {
            return;
        }

        var balance = advance.AdvanceAmount;
        var year = advance.DeductionStartYear;
        var month = advance.DeductionStartMonth;
        while (balance > 0)
        {
            var amount = Math.Min(balance, advance.InstallmentAmount);
            db.Add(new SalaryAdvanceInstallment
            {
                CompanyId = advance.CompanyId,
                SalaryAdvanceId = advance.Id,
                EmployeeId = advance.EmployeeId,
                YearNo = year,
                MonthNo = month,
                InstallmentAmount = amount,
            });
            balance -= amount;
            month++;
            if (month > 12)
            {
                month = 1;
                year++;
            }
        }
    }
}

public sealed class AllowanceDeductionHandlers(IPayrollDbContext db) :
    IRequestHandler<CreateAllowanceBillCommand, ApiResponse<AllowanceBillDto>>,
    IRequestHandler<ApproveAllowanceBillCommand, ApiResponse<AllowanceBillDto>>,
    IRequestHandler<RejectAllowanceBillCommand, ApiResponse<AllowanceBillDto>>,
    IRequestHandler<GetAllowanceBillsQuery, ApiResponse<IReadOnlyList<AllowanceBillDto>>>,
    IRequestHandler<CreateDeductionCommand, ApiResponse<DeductionDto>>,
    IRequestHandler<GetDeductionHistoryQuery, ApiResponse<IReadOnlyList<DeductionDto>>>
{
    public async Task<ApiResponse<AllowanceBillDto>> Handle(CreateAllowanceBillCommand command, CancellationToken cancellationToken)
    {
        var r = command.Request;
        var bill = new AllowanceBill { CompanyId = r.CompanyId, EmployeeId = r.EmployeeId, AllowanceType = r.AllowanceType, BillDate = r.BillDate, Quantity = r.Quantity, Rate = r.Rate, Amount = r.Amount, Remarks = r.Remarks };
        db.Add(bill);
        await db.SaveChangesAsync(cancellationToken);
        return ApiResponse<AllowanceBillDto>.Ok(bill.ToDto(), "Allowance bill created.");
    }

    public async Task<ApiResponse<AllowanceBillDto>> Handle(ApproveAllowanceBillCommand command, CancellationToken cancellationToken)
    {
        var bill = db.AllowanceBills.FirstOrDefault(x => x.Id == command.Id);
        if (bill is null) return ApiResponse<AllowanceBillDto>.Fail("Allowance bill not found.");
        if (bill.Status != "Pending") return ApiResponse<AllowanceBillDto>.Fail("Only pending allowance bills can be reviewed.");
        bill.Status = "Approved";
        bill.ApprovedBy = command.ApprovedBy;
        bill.ApprovedAt = BusinessTime.Now;
        await db.SaveChangesAsync(cancellationToken);
        return ApiResponse<AllowanceBillDto>.Ok(bill.ToDto(), "Allowance bill approved.");
    }

    public async Task<ApiResponse<AllowanceBillDto>> Handle(RejectAllowanceBillCommand command, CancellationToken cancellationToken)
    {
        var bill = db.AllowanceBills.FirstOrDefault(x => x.Id == command.Id);
        if (bill is null) return ApiResponse<AllowanceBillDto>.Fail("Allowance bill not found.");
        if (bill.Status != "Pending") return ApiResponse<AllowanceBillDto>.Fail("Only pending allowance bills can be reviewed.");
        bill.Status = "Rejected";
        await db.SaveChangesAsync(cancellationToken);
        return ApiResponse<AllowanceBillDto>.Ok(bill.ToDto(), "Allowance bill rejected.");
    }

    public Task<ApiResponse<IReadOnlyList<AllowanceBillDto>>> Handle(GetAllowanceBillsQuery query, CancellationToken cancellationToken)
    {
        var result = db.AllowanceBills
            .Where(x => x.CompanyId == query.CompanyId && (!query.EmployeeId.HasValue || x.EmployeeId == query.EmployeeId) && (!query.FromDate.HasValue || x.BillDate >= query.FromDate) && (!query.ToDate.HasValue || x.BillDate <= query.ToDate))
            .OrderByDescending(x => x.BillDate)
            .Select(x => x.ToDto())
            .ToList();
        return Task.FromResult(ApiResponse<IReadOnlyList<AllowanceBillDto>>.Ok(result));
    }

    public async Task<ApiResponse<DeductionDto>> Handle(CreateDeductionCommand command, CancellationToken cancellationToken)
    {
        var r = command.Request;
        var deduction = new PayrollDeductionEntry { CompanyId = r.CompanyId, EmployeeId = r.EmployeeId, DeductionType = r.DeductionType, Amount = r.Amount, YearNo = r.YearNo, MonthNo = r.MonthNo, Remarks = r.Remarks };
        db.Add(deduction);
        await db.SaveChangesAsync(cancellationToken);
        return ApiResponse<DeductionDto>.Ok(deduction.ToDto(), "Deduction created.");
    }

    public Task<ApiResponse<IReadOnlyList<DeductionDto>>> Handle(GetDeductionHistoryQuery query, CancellationToken cancellationToken)
    {
        var result = db.PayrollDeductionEntries
            .Where(x => x.CompanyId == query.CompanyId && (!query.EmployeeId.HasValue || x.EmployeeId == query.EmployeeId))
            .OrderByDescending(x => x.YearNo).ThenByDescending(x => x.MonthNo)
            .Select(x => x.ToDto())
            .ToList();
        return Task.FromResult(ApiResponse<IReadOnlyList<DeductionDto>>.Ok(result));
    }
}

public sealed class FinalSettlementHandlers(IPayrollDbContext db, IFinalSettlementService finalSettlementService, IIntegrationEventPublisher publisher) :
    IRequestHandler<GenerateFinalSettlementCommand, ApiResponse<FinalSettlementDto>>,
    IRequestHandler<ApproveFinalSettlementCommand, ApiResponse<FinalSettlementDto>>,
    IRequestHandler<GetFinalSettlementQuery, ApiResponse<IReadOnlyList<FinalSettlementDto>>>
{
    public async Task<ApiResponse<FinalSettlementDto>> Handle(GenerateFinalSettlementCommand command, CancellationToken cancellationToken)
    {
        var r = command.Request;
        var settlement = new FinalSettlement
        {
            CompanyId = r.CompanyId,
            EmployeeId = r.EmployeeId,
            SettlementDate = r.SettlementDate,
            LastWorkingDate = r.LastWorkingDate,
            SalaryPayable = r.SalaryPayable,
            EarnLeaveAmount = r.EarnLeaveAmount,
            ServiceBenefitAmount = r.ServiceBenefitAmount,
            GratuityAmount = r.GratuityAmount,
            AdvanceDeduction = r.AdvanceDeduction,
            OtherDeduction = r.OtherDeduction,
        };
        settlement.NetPayable = finalSettlementService.CalculateNetPayable(settlement);
        db.Add(settlement);
        await db.SaveChangesAsync(cancellationToken);
        return ApiResponse<FinalSettlementDto>.Ok(settlement.ToDto(), "Final settlement generated.");
    }

    public async Task<ApiResponse<FinalSettlementDto>> Handle(ApproveFinalSettlementCommand command, CancellationToken cancellationToken)
    {
        var settlement = db.FinalSettlements.FirstOrDefault(x => x.Id == command.Id);
        if (settlement is null) return ApiResponse<FinalSettlementDto>.Fail("Final settlement not found.");
        if (settlement.Status != "Pending") return ApiResponse<FinalSettlementDto>.Fail("Only pending settlements can be reviewed.");
        settlement.Status = "Approved";
        settlement.ApprovedBy = command.ApprovedBy;
        settlement.ApprovedAt = BusinessTime.Now;
        await db.SaveChangesAsync(cancellationToken);
        await publisher.PublishAsync(new FinalSettlementApprovedEvent(settlement.CompanyId, settlement.EmployeeId, settlement.Id, settlement.NetPayable), cancellationToken);
        return ApiResponse<FinalSettlementDto>.Ok(settlement.ToDto(), "Final settlement approved.");
    }

    public Task<ApiResponse<IReadOnlyList<FinalSettlementDto>>> Handle(GetFinalSettlementQuery query, CancellationToken cancellationToken)
    {
        var result = db.FinalSettlements
            .Where(x => x.CompanyId == query.CompanyId && (!query.EmployeeId.HasValue || x.EmployeeId == query.EmployeeId))
            .OrderByDescending(x => x.SettlementDate)
            .Select(x => x.ToDto())
            .ToList();
        return Task.FromResult(ApiResponse<IReadOnlyList<FinalSettlementDto>>.Ok(result));
    }
}
