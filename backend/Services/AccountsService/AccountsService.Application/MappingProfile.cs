using AccountsService.Contracts;
using AccountsService.Domain;
using AutoMapper;

namespace AccountsService.Application;

public sealed class MappingProfile : Profile
{
    public MappingProfile()
    {
        CreateMap<ChartOfAccount, ChartOfAccountDto>();
        CreateMap<FiscalYear, FiscalYearDto>();
        CreateMap<AccountingPeriod, AccountingPeriodDto>();
        CreateMap<VoucherLine, VoucherLineDto>();
        CreateMap<Voucher, VoucherDto>();
        CreateMap<GeneralLedgerEntry, GeneralLedgerEntryDto>();
        CreateMap<CashReceipt, CashReceiptDto>();
        CreateMap<MoneyReceipt, MoneyReceiptDto>();
        CreateMap<DailyExpense, DailyExpenseDto>();
        CreateMap<MoneyRequest, MoneyRequestDto>();
        CreateMap<AdvancePayment, AdvancePaymentDto>();
        CreateMap<AdvanceSalaryPayment, AdvanceSalaryPaymentDto>();
        CreateMap<CompanyMoneyTransfer, CompanyMoneyTransferDto>();
    }
}
