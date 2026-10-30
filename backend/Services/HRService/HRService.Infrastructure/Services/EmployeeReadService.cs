using Erp.BuildingBlocks.Contracts.Pagination;
using HRService.Application.Employees;
using HRService.Domain.Entities;
using HRService.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace HRService.Infrastructure.Services;

public sealed class EmployeeReadService(HrDbContext db) : IEmployeeReadService
{
    public async Task<IReadOnlyList<EmployeeLookupDto>> ListLookupsByIdsAsync(
        IReadOnlyList<Guid> ids,
        Guid? companyId = null,
        CancellationToken cancellationToken = default)
    {
        if (ids.Count == 0)
            return [];

        var q = db.Employees.AsNoTracking().Where(e => !e.IsDeleted && ids.Contains(e.Id));
        if (companyId.HasValue)
            q = q.Where(e => e.CompanyId == companyId);

        return await (
            from e in q
            join j in db.EmployeeJobInfos.AsNoTracking().Where(x => x.IsCurrent)
                on e.Id equals j.EmployeeId into jobJoin
            from j in jobJoin.DefaultIfEmpty()
            join d in db.Departments.AsNoTracking() on j.DepartmentId equals d.Id into deptJoin
            from d in deptJoin.DefaultIfEmpty()
            join des in db.Designations.AsNoTracking() on j.DesignationId equals des.Id into desJoin
            from des in desJoin.DefaultIfEmpty()
            select new EmployeeLookupDto
            {
                Id = e.Id,
                EmployeeCode = e.EmployeeID,
                FullName = e.FullName,
                DepartmentName = d != null ? d.Name : null,
                DesignationName = des != null ? des.Name : null,
            })
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<EmployeeListItemDto>> ListByIdsAsync(
        IReadOnlyList<Guid> ids,
        CancellationToken cancellationToken = default)
    {
        if (ids.Count == 0)
            return [];

        return await (
            from e in db.Employees.AsNoTracking().Where(x => !x.IsDeleted && ids.Contains(x.Id))
            join j in db.EmployeeJobInfos.AsNoTracking().Where(x => x.IsCurrent)
                on e.Id equals j.EmployeeId into jobJoin
            from j in jobJoin.DefaultIfEmpty()
            join d in db.Departments.AsNoTracking() on j.DepartmentId equals d.Id into deptJoin
            from d in deptJoin.DefaultIfEmpty()
            join des in db.Designations.AsNoTracking() on j.DesignationId equals des.Id into desJoin
            from des in desJoin.DefaultIfEmpty()
            select new EmployeeListItemDto
            {
                Id = e.Id,
                PunchNumber = e.PunchNumber,
                EmployeeID = e.EmployeeID,
                FullName = e.FullName,
                Email = e.Email,
                CompanyId = e.CompanyId,
                Status = e.Status,
                Gender = e.Gender,
                Religion = e.Religion,
                BloodGroup = e.BloodGroup,
                IsOtEnabled = e.IsOtEnabled,
                JoinDate = e.JoinDate,
                Phone = e.Phone,
                DepartmentName = d != null ? d.Name : null,
                DesignationName = des != null ? des.Name : null,
            })
            .ToListAsync(cancellationToken);
    }

    private static IQueryable<Employee> ApplyManpowerFilters(IQueryable<Employee> q, EmployeeListQuery query)
    {
        if (query.CompanyId.HasValue)
            q = q.Where(e => e.CompanyId == query.CompanyId);

        if (query.DepartmentId.HasValue)
            q = q.Where(e => e.JobInfos.Any(j => j.IsCurrent && j.DepartmentId == query.DepartmentId));

        if (query.SectionId.HasValue)
            q = q.Where(e => e.JobInfos.Any(j => j.IsCurrent && j.SectionId == query.SectionId));

        if (query.DesignationId.HasValue)
            q = q.Where(e => e.JobInfos.Any(j => j.IsCurrent && j.DesignationId == query.DesignationId));

        if (!string.IsNullOrWhiteSpace(query.Status) && !string.Equals(query.Status, "all", StringComparison.OrdinalIgnoreCase))
            q = q.Where(e => e.Status.ToLower() == query.Status.Trim().ToLower());

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var s = query.Search.Trim().ToLower();
            q = q.Where(e => e.FullName.ToLower().Contains(s)
                || e.EmployeeID.ToLower().Contains(s)
                || e.PunchNumber.ToString().Contains(s));
        }

        if (!string.IsNullOrWhiteSpace(query.Gender) &&
            !string.Equals(query.Gender, "all", StringComparison.OrdinalIgnoreCase))
        {
            q = q.Where(e => e.Gender == query.Gender);
        }

        if (!string.IsNullOrWhiteSpace(query.Religion) &&
            !string.Equals(query.Religion, "all", StringComparison.OrdinalIgnoreCase))
        {
            q = q.Where(e => e.Religion == query.Religion);
        }

        if (query.JoinDateFrom.HasValue)
            q = q.Where(e => e.JoinDate >= query.JoinDateFrom.Value.Date);

        if (query.JoinDateTo.HasValue)
        {
            var end = query.JoinDateTo.Value.Date.AddDays(1);
            q = q.Where(e => e.JoinDate < end);
        }

        if (!string.IsNullOrWhiteSpace(query.EmployeeId))
        {
            var id = query.EmployeeId.Trim();
            q = q.Where(e => e.EmployeeID == id || e.EmployeeID.StartsWith(id));
        }

        return q;
    }

    private static IQueryable<Employee> ApplyEmployeeListSort(IQueryable<Employee> q, PagedRequest request)
    {
        var sortBy = request.SortBy?.Trim().ToLowerInvariant();
        var desc = request.SortDescending;

        return sortBy switch
        {
            "name" or "fullname" or "fullnameen" => desc
                ? q.OrderByDescending(e => e.FullName)
                : q.OrderBy(e => e.FullName),
            "employeeid" or "id" => desc
                ? q.OrderByDescending(e => e.EmployeeID)
                : q.OrderBy(e => e.EmployeeID),
            "joindate" => desc
                ? q.OrderByDescending(e => e.JoinDate)
                : q.OrderBy(e => e.JoinDate),
            "status" => desc
                ? q.OrderByDescending(e => e.Status)
                : q.OrderBy(e => e.Status),
            "createdat" => desc
                ? q.OrderByDescending(e => e.CreatedAt)
                : q.OrderBy(e => e.CreatedAt),
            _ => q.OrderByDescending(e => e.CreatedAt),
        };
    }

    private static decimal Percentage(int count, int total) =>
        total > 0 ? Math.Round((decimal)count / total * 100m, 1) : 0m;

    private static List<SummaryBucketDto> BuildBuckets<TKey>(
        IEnumerable<IGrouping<TKey, EmployeeSnapshot>> groups,
        int total,
        Func<TKey, string> nameSelector,
        Func<TKey, Guid?> idSelector) where TKey : notnull =>
        groups
            .Select(g => new SummaryBucketDto
            {
                Id = idSelector(g.Key),
                Name = nameSelector(g.Key),
                Count = g.Count(),
                Percentage = Percentage(g.Count(), total),
            })
            .OrderByDescending(x => x.Count)
            .ToList();

    private sealed record EmployeeSnapshot(
        string Status,
        string? Gender,
        Guid? DepartmentId,
        string DepartmentName,
        Guid? DesignationId,
        string DesignationName);
    public async Task<PaginatedList<EmployeeListItemDto>> ListAsync(
        EmployeeListQuery query,
        CancellationToken cancellationToken = default)
    {
        query.Normalize();

        var q = ApplyManpowerFilters(
            db.Employees.AsNoTracking().Where(e => !e.IsDeleted),
            query);

        q = ApplyEmployeeListSort(q, query);

        var projected = q.Select(e => new EmployeeListItemDto
        {
            Id = e.Id,
            PunchNumber = e.PunchNumber,
            EmployeeID = e.EmployeeID,
            FullName = e.FullName,
            Email = e.Email,
            CompanyId = e.CompanyId,
            Status = e.Status,
            Gender = e.Gender,
            Religion = e.Religion,
            BloodGroup = e.BloodGroup,
            IsOtEnabled = e.IsOtEnabled,
            JoinDate = e.JoinDate,
            Phone = e.Phone,
            DepartmentName = e.JobInfos.Where(j => j.IsCurrent)
                .Select(j => j.Department != null ? j.Department.Name : null)
                .FirstOrDefault(),
            DesignationName = e.JobInfos.Where(j => j.IsCurrent)
                .Select(j => j.Designation != null ? j.Designation.Name : null)
                .FirstOrDefault(),
        });

        return await projected.ToPaginatedListAsync(query, cancellationToken);
    }

    public async Task<EmployeeDetailsDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var employee = await db.Employees.AsNoTracking()
            .Include(e => e.Addresses)
            .Include(e => e.BankAccounts)
            .Include(e => e.EmergencyContacts)
            .Include(e => e.Documents)
            .Include(e => e.JobInfos.Where(j => j.IsCurrent))
                .ThenInclude(j => j.Department)
            .Include(e => e.JobInfos.Where(j => j.IsCurrent))
                .ThenInclude(j => j.Designation)
            .Include(e => e.JobInfos.Where(j => j.IsCurrent))
                .ThenInclude(j => j.Grade)
            .Include(e => e.SalaryInfos.Where(s => s.IsCurrent))
            .FirstOrDefaultAsync(e => e.Id == id && !e.IsDeleted, cancellationToken);

        if (employee == null)
            return null;

        var currentJob = employee.JobInfos.FirstOrDefault(j => j.IsCurrent);
        var sectionNames = await SectionNameResolver.ResolveAsync(
            db,
            currentJob?.SectionId != null ? [currentJob.SectionId] : [],
            cancellationToken);
        var sectionName = currentJob?.SectionId != null
            ? sectionNames.GetValueOrDefault(currentJob.SectionId.Value)
            : null;
        var groupNames = await GroupNameResolver.ResolveAsync(
            db,
            currentJob?.GroupId != null ? [currentJob.GroupId] : [],
            cancellationToken);
        var groupName = currentJob?.GroupId != null
            ? groupNames.GetValueOrDefault(currentJob.GroupId.Value)
            : null;

        var currentSalary = employee.SalaryInfos.FirstOrDefault(s => s.IsCurrent);

        return new EmployeeDetailsDto
        {
            Id = employee.Id,
            CompanyId = employee.CompanyId,
            PunchNumber = employee.PunchNumber,
            EmployeeID = employee.EmployeeID,
            FullName = employee.FullName,
            BanglaName = employee.BanglaName,
            Gender = employee.Gender,
            Religion = employee.Religion,
            BloodGroup = employee.BloodGroup,
            DateOfBirth = employee.DateOfBirth,
            NationalId = employee.NationalId,
            BirthCertificateNo = employee.BirthCertificateNo,
            Phone = employee.Phone,
            Email = employee.Email,
            JoinDate = employee.JoinDate,
            EmploymentType = employee.EmploymentType,
            Status = employee.Status,
            IsOtEnabled = employee.IsOtEnabled,
            FatherNameEn = employee.FatherNameEn,
            FatherNameBn = employee.FatherNameBn,
            MotherNameEn = employee.MotherNameEn,
            MotherNameBn = employee.MotherNameBn,
            MaritalStatus = employee.MaritalStatus,
            SpouseNameEn = employee.SpouseNameEn,
            SpouseNameBn = employee.SpouseNameBn,
            SpouseOccupation = employee.SpouseOccupation,
            SpouseContact = employee.SpouseContact,
            EducationLevel = employee.EducationLevel,
            Institution = employee.Institution,
            FieldOfStudy = employee.FieldOfStudy,
            Skills = employee.Skills,
            Reference1Name = employee.Reference1Name,
            Reference1Relation = employee.Reference1Relation,
            Reference1Phone = employee.Reference1Phone,
            Reference1Address = employee.Reference1Address,
            Reference2Name = employee.Reference2Name,
            Reference2Relation = employee.Reference2Relation,
            Reference2Phone = employee.Reference2Phone,
            Reference2Address = employee.Reference2Address,
            CurrentJobInfo = currentJob == null ? null : new EmployeeJobInfoDto(
                currentJob.DepartmentId,
                currentJob.Department?.Name,
                currentJob.SectionId,
                sectionName,
                currentJob.DesignationId,
                currentJob.Designation?.Name,
                currentJob.GradeId,
                currentJob.Grade?.Name,
                currentJob.SupervisorId,
                null,
                currentJob.WorkLocation,
                currentJob.EffectiveFrom,
                currentJob.GroupId,
                groupName),
            CurrentSalaryInfo = currentSalary == null ? null : new EmployeeSalaryInfoDto(
                currentSalary.BasicSalary,
                currentSalary.HouseRent,
                currentSalary.MedicalAllowance,
                currentSalary.ConveyanceAllowance,
                currentSalary.FoodAllowance,
                currentSalary.GrossSalary,
                currentSalary.EffectiveFrom),
            Addresses = employee.Addresses
                .Select(a => new EmployeeAddressItemDto(
                    a.Id, a.AddressType, a.Country, a.Division, a.District,
                    a.Upazila, a.PostOffice, a.PostalCode, a.AddressLine))
                .ToList(),
            BankAccounts = employee.BankAccounts
                .Select(b => new EmployeeBankAccountItemDto(
                    b.Id, b.BankName, b.BranchName, b.AccountNo, b.RoutingNo,
                    b.MobileBankingType, b.MobileBankingNo, b.IsPrimary))
                .ToList(),
            EmergencyContacts = employee.EmergencyContacts
                .Select(c => new EmergencyContactItemDto(
                    c.Id, c.ContactName, c.Relation, c.Phone, c.Address))
                .ToList(),
            Documents = employee.Documents
                .Select(d => new EmployeeDocumentItemDto(d.Id, d.DocumentType, d.FileUrl, d.UploadedAt))
                .ToList(),
        };
    }

    public async Task<PaginatedList<ManpowerListItemDto>> ManpowerListAsync(
        ManpowerListQuery query,
        CancellationToken cancellationToken = default)
    {
        query.Normalize();

        var q = ApplyManpowerFilters(db.Employees.AsNoTracking().Where(e => !e.IsDeleted), query);
        q = ApplyEmployeeListSort(q, query);

        var total = await q.CountAsync(cancellationToken);
        var page = query.Page;
        var pageSize = query.PageSize;
        var getAll = query.GetAll;

        var paged = getAll
            ? q
            : q.Skip((page - 1) * pageSize).Take(pageSize);

        var rows = await paged
            .Select(e => new
            {
                e.Id,
                e.PunchNumber,
                e.EmployeeID,
                e.FullName,
                DesignationName = e.JobInfos.Where(j => j.IsCurrent).Select(j => j.Designation != null ? j.Designation.Name : null).FirstOrDefault(),
                DepartmentName = e.JobInfos.Where(j => j.IsCurrent).Select(j => j.Department != null ? j.Department.Name : null).FirstOrDefault(),
                SectionId = e.JobInfos.Where(j => j.IsCurrent).Select(j => j.SectionId).FirstOrDefault(),
                e.JoinDate,
                e.Status,
                e.Phone,
                e.Religion,
                e.BloodGroup,
                e.IsOtEnabled,
                GrossSalary = e.SalaryInfos.Where(s => s.IsCurrent).Select(s => s.GrossSalary).FirstOrDefault()
            })
            .ToListAsync(cancellationToken);

        var sectionNames = await SectionNameResolver.ResolveAsync(
            db,
            rows.Select(r => r.SectionId),
            cancellationToken);

        var items = rows.Select(r => new ManpowerListItemDto
        {
            Id = r.Id,
            PunchNumber = r.PunchNumber,
            EmployeeID = r.EmployeeID,
            FullName = r.FullName,
            DesignationName = r.DesignationName,
            DepartmentName = r.DepartmentName,
            SectionName = r.SectionId.HasValue ? sectionNames.GetValueOrDefault(r.SectionId.Value) : null,
            JoinDate = r.JoinDate,
            Status = r.Status,
            Phone = r.Phone,
            Religion = r.Religion,
            BloodGroup = r.BloodGroup,
            IsOtEnabled = r.IsOtEnabled,
            GrossSalary = r.GrossSalary
        }).ToList();

        var pagination = PaginationMetadata.Create(page, pageSize, total, getAll);
        return PaginatedList<ManpowerListItemDto>.From(items, pagination);
    }

    public async Task<ManpowerSummaryDto> ManpowerSummaryAsync(
        ManpowerSummaryQuery query,
        CancellationToken cancellationToken = default)
    {
        var q = ApplyManpowerFilters(db.Employees.AsNoTracking().Where(e => !e.IsDeleted), query);

        var snapshots = await q
            .Select(e => new EmployeeSnapshot(
                e.Status,
                e.Gender,
                e.JobInfos.Where(j => j.IsCurrent).Select(j => j.DepartmentId).FirstOrDefault(),
                e.JobInfos.Where(j => j.IsCurrent).Select(j => j.Department != null ? j.Department.Name : "Unassigned").FirstOrDefault() ?? "Unassigned",
                e.JobInfos.Where(j => j.IsCurrent).Select(j => j.DesignationId).FirstOrDefault(),
                e.JobInfos.Where(j => j.IsCurrent).Select(j => j.Designation != null ? j.Designation.Name : "Unassigned").FirstOrDefault() ?? "Unassigned"))
            .ToListAsync(cancellationToken);

        var total = snapshots.Count;
        var active = snapshots.Count(e => string.Equals(e.Status, "Active", StringComparison.OrdinalIgnoreCase));
        var onLeave = snapshots.Count(e =>
            string.Equals(e.Status, "On Leave", StringComparison.OrdinalIgnoreCase) ||
            e.Status.Contains("Leave", StringComparison.OrdinalIgnoreCase));
        var inactive = total - active - onLeave;

        var departmentSummary = BuildBuckets(
            snapshots.GroupBy(e => e.DepartmentName),
            total,
            key => key,
            key => snapshots.First(s => s.DepartmentName == key).DepartmentId);

        var designationSummary = BuildBuckets(
            snapshots.GroupBy(e => e.DesignationName),
            total,
            key => key,
            key => snapshots.First(s => s.DesignationName == key).DesignationId)
            .Take(10)
            .ToList();

        var genderSummary = BuildBuckets(
            snapshots.GroupBy(e => string.IsNullOrWhiteSpace(e.Gender) ? "Not Specified" : e.Gender!),
            total,
            key => key,
            _ => null);

        var statusSummary = BuildBuckets(
            snapshots.GroupBy(e => string.IsNullOrWhiteSpace(e.Status) ? "Unknown" : e.Status),
            total,
            key => key,
            _ => null);

        return new ManpowerSummaryDto
        {
            TotalEmployees = total,
            ActiveEmployees = active,
            OnLeaveEmployees = onLeave,
            InactiveEmployees = inactive,
            DepartmentSummary = departmentSummary,
            DesignationSummary = designationSummary,
            GenderSummary = genderSummary,
            StatusSummary = statusSummary,
        };
    }

    public async Task<IReadOnlyList<EmployeeStatusHistoryDto>> GetStatusHistoryAsync(
        Guid employeeId,
        CancellationToken cancellationToken = default) =>
        await db.EmployeeStatusHistories.AsNoTracking()
            .Where(h => h.EmployeeId == employeeId && !h.IsDeleted)
            .OrderByDescending(h => h.EffectiveFrom)
            .Select(h => new EmployeeStatusHistoryDto(
                h.Id, h.Status, h.EffectiveFrom, h.Remarks, h.CreatedAt))
            .ToListAsync(cancellationToken);

    public async Task<IReadOnlyList<EmployeeTransferDto>> GetEmployeeTransfersAsync(
        Guid employeeId,
        CancellationToken cancellationToken = default)
    {
        var rows = await db.EmployeeTransfers.AsNoTracking()
            .Where(t => t.EmployeeId == employeeId && !t.IsDeleted)
            .OrderByDescending(t => t.EffectiveDate)
            .ToListAsync(cancellationToken);

        return await MapTransfersAsync(rows, cancellationToken);
    }

    public async Task<PaginatedList<EmployeeTransferDto>> ListTransfersAsync(
        EmployeeTransferListQuery query,
        CancellationToken cancellationToken = default)
    {
        query.Normalize();

        var q = db.EmployeeTransfers.AsNoTracking()
            .Where(t => !t.IsDeleted)
            .Join(
                db.Employees.AsNoTracking().Where(e => !e.IsDeleted),
                t => t.EmployeeId,
                e => e.Id,
                (t, e) => new { Transfer = t, Employee = e });

        if (query.CompanyId.HasValue)
            q = q.Where(x => x.Employee.CompanyId == query.CompanyId);

        if (query.EmployeeId.HasValue)
            q = q.Where(x => x.Transfer.EmployeeId == query.EmployeeId);

        if (query.FromDate.HasValue)
            q = q.Where(x => x.Transfer.EffectiveDate >= query.FromDate.Value.Date);

        if (query.ToDate.HasValue)
        {
            var end = query.ToDate.Value.Date.AddDays(1);
            q = q.Where(x => x.Transfer.EffectiveDate < end);
        }

        var total = await q.CountAsync(cancellationToken);
        var page = query.Page;
        var pageSize = query.PageSize;
        var getAll = query.GetAll;

        var ordered = q.OrderByDescending(x => x.Transfer.EffectiveDate);
        var paged = getAll
            ? ordered
            : ordered
                .Skip((page - 1) * pageSize)
                .Take(pageSize);

        var rows = await paged
            .Select(x => x.Transfer)
            .ToListAsync(cancellationToken);

        var items = await MapTransfersAsync(rows, cancellationToken);
        var pagination = PaginationMetadata.Create(page, pageSize, total, getAll);
        return PaginatedList<EmployeeTransferDto>.From(items, pagination);
    }

    private async Task<IReadOnlyList<EmployeeTransferDto>> MapTransfersAsync(
        List<EmployeeTransfer> rows,
        CancellationToken cancellationToken)
    {
        if (rows.Count == 0)
            return [];

        var employeeIds = rows.Select(r => r.EmployeeId).Distinct().ToList();
        var employees = await db.Employees.AsNoTracking()
            .Where(e => employeeIds.Contains(e.Id))
            .Select(e => new { e.Id, e.EmployeeID, e.FullName })
            .ToDictionaryAsync(e => e.Id, cancellationToken);

        var deptIds = rows
            .SelectMany(r => new[] { r.FromDepartmentId, r.ToDepartmentId })
            .Where(id => id.HasValue)
            .Select(id => id!.Value)
            .Distinct()
            .ToList();

        var deptNames = await db.Departments.AsNoTracking()
            .Where(d => deptIds.Contains(d.Id))
            .ToDictionaryAsync(d => d.Id, d => d.Name, cancellationToken);

        return rows.Select(t =>
        {
            employees.TryGetValue(t.EmployeeId, out var emp);
            return new EmployeeTransferDto
            {
                Id = t.Id,
                EmployeeEntityId = t.EmployeeId,
                EmployeeCode = emp?.EmployeeID ?? string.Empty,
                FullName = emp?.FullName ?? string.Empty,
                FromDepartmentId = t.FromDepartmentId,
                FromDepartmentName = t.FromDepartmentId.HasValue
                    ? deptNames.GetValueOrDefault(t.FromDepartmentId.Value)
                    : null,
                ToDepartmentId = t.ToDepartmentId,
                ToDepartmentName = t.ToDepartmentId.HasValue
                    ? deptNames.GetValueOrDefault(t.ToDepartmentId.Value)
                    : null,
                EffectiveDate = t.EffectiveDate,
                Reason = t.Reason,
                CreatedAt = t.CreatedAt,
            };
        }).ToList();
    }
}
