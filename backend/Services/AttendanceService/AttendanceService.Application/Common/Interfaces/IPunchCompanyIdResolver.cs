namespace AttendanceService.Application.Common.Interfaces;

public interface IPunchCompanyIdResolver
{
    int? Resolve(Guid companyId);
}
