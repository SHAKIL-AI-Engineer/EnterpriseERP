using System.Collections.Concurrent;
using HRService.Application.Employees;
using HRService.Domain.Entities;
using HRService.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;

namespace HRService.Infrastructure.Services;

public sealed class EmployeeImportService(
    HrDbContext db,
    IServiceScopeFactory scopeFactory,
    IOptions<EmployeeImportOptions> options) : IEmployeeImportService
{
    public async Task<EmployeeImportUpsertResult> UpsertAsync(
        Guid companyId,
        EmployeeImportUpsertRequest request,
        CancellationToken cancellationToken = default)
    {
        if (request.Rows.Count == 0)
        {
            return new EmployeeImportUpsertResult();
        }

        var organogramCache = await EmployeeOrganogramLookupCache.LoadAsync(db, companyId, cancellationToken);
        var maxParallel = Math.Clamp(options.Value.MaxParallelRows, 1, 16);

        if (maxParallel == 1 || request.Rows.Count == 1)
        {
            return await UpsertSequentialAsync(companyId, request.Rows, organogramCache, cancellationToken);
        }

        var created = 0;
        var updated = 0;
        var errors = new ConcurrentBag<EmployeeImportRowError>();

        await Parallel.ForEachAsync(
            request.Rows,
            new ParallelOptions { MaxDegreeOfParallelism = maxParallel, CancellationToken = cancellationToken },
            async (row, ct) =>
            {
                try
                {
                    await using var scope = scopeFactory.CreateAsyncScope();
                    var processor = scope.ServiceProvider.GetRequiredService<EmployeeImportRowProcessor>();
                    var isCreate = await processor.UpsertOneAsync(companyId, row, organogramCache, ct);
                    if (isCreate)
                    {
                        Interlocked.Increment(ref created);
                    }
                    else
                    {
                        Interlocked.Increment(ref updated);
                    }
                }
                catch (Exception ex)
                {
                    errors.Add(new EmployeeImportRowError(row.RowIndex, "Upsert", ex.Message));
                }
            });

        return new EmployeeImportUpsertResult
        {
            Created = created,
            Updated = updated,
            Failed = errors.Count,
            Errors = errors.OrderBy(e => e.RowIndex).ToList()
        };
    }

    private async Task<EmployeeImportUpsertResult> UpsertSequentialAsync(
        Guid companyId,
        IReadOnlyList<EmployeeImportRowDto> rows,
        EmployeeOrganogramLookupCache organogramCache,
        CancellationToken cancellationToken)
    {
        await using var scope = scopeFactory.CreateAsyncScope();
        var processor = scope.ServiceProvider.GetRequiredService<EmployeeImportRowProcessor>();

        var created = 0;
        var updated = 0;
        var errors = new List<EmployeeImportRowError>();

        foreach (var row in rows)
        {
            try
            {
                var isCreate = await processor.UpsertOneAsync(companyId, row, organogramCache, cancellationToken);
                if (isCreate)
                {
                    created++;
                }
                else
                {
                    updated++;
                }
            }
            catch (Exception ex)
            {
                errors.Add(new EmployeeImportRowError(row.RowIndex, "Upsert", ex.Message));
            }
        }

        return new EmployeeImportUpsertResult
        {
            Created = created,
            Updated = updated,
            Failed = errors.Count,
            Errors = errors
        };
    }

    public async Task<IReadOnlyList<EmployeeImportRowDto>> ExportAsync(Guid companyId, CancellationToken cancellationToken = default)
    {
        const int pageSize = 500;
        var all = new List<EmployeeImportRowDto>();
        var page = 1;
        var rowIndex = 1;

        while (true)
        {
            var batch = await db.Employees.AsNoTracking()
                .Where(e => e.CompanyId == companyId && !e.IsDeleted)
                .OrderBy(e => e.EmployeeID)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
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
                .ToListAsync(cancellationToken);

            if (batch.Count == 0)
            {
                break;
            }

            var sectionIds = batch
                .Select(e => e.JobInfos.FirstOrDefault(j => j.IsCurrent)?.SectionId)
                .Where(id => id.HasValue)
                .Select(id => id!.Value)
                .Distinct()
                .ToList();
            var groupIds = batch
                .Select(e => e.JobInfos.FirstOrDefault(j => j.IsCurrent)?.GroupId)
                .Where(id => id.HasValue)
                .Select(id => id!.Value)
                .Distinct()
                .ToList();

            var sectionNames = await SectionNameResolver.ResolveAsync(
                db, sectionIds.Select(id => (Guid?)id), cancellationToken);
            var groupNames = await GroupNameResolver.ResolveAsync(
                db, groupIds.Select(id => (Guid?)id), cancellationToken);

            var supervisorIds = batch
                .Select(e => e.JobInfos.FirstOrDefault(j => j.IsCurrent)?.SupervisorId)
                .Where(id => id.HasValue)
                .Select(id => id!.Value)
                .Distinct()
                .ToList();
            var supervisorCodes = supervisorIds.Count == 0
                ? new Dictionary<Guid, string>()
                : await db.Employees.AsNoTracking()
                    .Where(e => supervisorIds.Contains(e.Id))
                    .ToDictionaryAsync(e => e.Id, e => e.EmployeeID, cancellationToken);

            foreach (var e in batch)
            {
                all.Add(MapExportRow(e, rowIndex++, sectionNames, groupNames, supervisorCodes));
            }

            if (batch.Count < pageSize)
            {
                break;
            }

            page++;
        }

        return all;
    }

    private static EmployeeImportRowDto MapExportRow(
        Employee e,
        int rowIndex,
        IReadOnlyDictionary<Guid, string> sectionNames,
        IReadOnlyDictionary<Guid, string> groupNames,
        IReadOnlyDictionary<Guid, string> supervisorCodes)
    {
        var job = e.JobInfos.FirstOrDefault(j => j.IsCurrent);
        var salary = e.SalaryInfos.FirstOrDefault(s => s.IsCurrent);
        var present = e.Addresses.FirstOrDefault(a => string.Equals(a.AddressType, "Present", StringComparison.OrdinalIgnoreCase));
        var permanent = e.Addresses.FirstOrDefault(a => string.Equals(a.AddressType, "Permanent", StringComparison.OrdinalIgnoreCase));
        var bank = e.BankAccounts.FirstOrDefault(b => b.IsPrimary) ?? e.BankAccounts.FirstOrDefault();
        var emergency = e.EmergencyContacts.FirstOrDefault();
        var profile = e.Documents.FirstOrDefault(d => string.Equals(d.DocumentType, "Profile Image", StringComparison.OrdinalIgnoreCase));
        var signature = e.Documents.FirstOrDefault(d => string.Equals(d.DocumentType, "Signature", StringComparison.OrdinalIgnoreCase));

        string? sectionName = null;
        if (job?.SectionId is Guid sid)
        {
            sectionNames.TryGetValue(sid, out sectionName);
        }

        string? groupName = null;
        if (job?.GroupId is Guid gid)
        {
            groupNames.TryGetValue(gid, out groupName);
        }

        string? supervisorCode = null;
        if (job?.SupervisorId is Guid supId)
        {
            supervisorCodes.TryGetValue(supId, out supervisorCode);
        }

        var isMcash = string.Equals(bank?.MobileBankingType, "mCash Account", StringComparison.OrdinalIgnoreCase);

        return new EmployeeImportRowDto
        {
            RowIndex = rowIndex,
            PunchNumber = e.PunchNumber,
            EmployeeID = e.EmployeeID,
            FullName = e.FullName,
            BanglaName = e.BanglaName,
            Gender = e.Gender,
            Religion = e.Religion,
            BloodGroup = e.BloodGroup,
            DateOfBirth = e.DateOfBirth,
            NationalId = e.NationalId,
            BirthCertificateNo = e.BirthCertificateNo,
            Phone = e.Phone,
            Email = e.Email,
            JoinDate = e.JoinDate,
            EmploymentType = e.EmploymentType,
            Status = e.Status,
            IsOtEnabled = e.IsOtEnabled,
            DepartmentName = job?.Department?.Name,
            SectionName = sectionName,
            DesignationName = job?.Designation?.Name,
            GradeName = job?.Grade?.Name,
            GroupName = groupName,
            LineName = job?.WorkLocation,
            SupervisorEmployeeID = supervisorCode,
            BasicSalary = salary?.BasicSalary ?? 0,
            HouseRent = salary?.HouseRent ?? 0,
            MedicalAllowance = salary?.MedicalAllowance ?? 0,
            ConveyanceAllowance = salary?.ConveyanceAllowance ?? 0,
            FoodAllowance = salary?.FoodAllowance ?? 0,
            FatherNameEn = e.FatherNameEn,
            FatherNameBn = e.FatherNameBn,
            MotherNameEn = e.MotherNameEn,
            MotherNameBn = e.MotherNameBn,
            MaritalStatus = e.MaritalStatus,
            SpouseNameEn = e.SpouseNameEn,
            SpouseNameBn = e.SpouseNameBn,
            SpouseOccupation = e.SpouseOccupation,
            SpouseContact = e.SpouseContact,
            EducationLevel = e.EducationLevel,
            Institution = e.Institution,
            FieldOfStudy = e.FieldOfStudy,
            Skills = e.Skills,
            Reference1Name = e.Reference1Name,
            Reference1Relation = e.Reference1Relation,
            Reference1Phone = e.Reference1Phone,
            Reference1Address = e.Reference1Address,
            Reference2Name = e.Reference2Name,
            Reference2Relation = e.Reference2Relation,
            Reference2Phone = e.Reference2Phone,
            Reference2Address = e.Reference2Address,
            PresentDivision = present?.Division,
            PresentDistrict = present?.District,
            PresentUpazila = present?.Upazila,
            PresentPostOffice = present?.PostOffice,
            PresentPostalCode = present?.PostalCode,
            PresentAddress = present?.AddressLine,
            PermanentDivision = permanent?.Division,
            PermanentDistrict = permanent?.District,
            PermanentUpazila = permanent?.Upazila,
            PermanentPostOffice = permanent?.PostOffice,
            PermanentPostalCode = permanent?.PostalCode,
            PermanentAddress = permanent?.AddressLine,
            BankName = isMcash ? null : bank?.BankName,
            BranchName = isMcash ? null : bank?.BranchName,
            AccountNo = isMcash ? null : bank?.AccountNo,
            RoutingNo = isMcash ? null : bank?.RoutingNo,
            BankAccountType = isMcash ? "mCash Account" : bank != null ? "Bank Account" : null,
            MobileBankingNo = bank?.MobileBankingNo,
            EmergencyContactName = emergency?.ContactName,
            EmergencyContactRelation = emergency?.Relation,
            EmergencyContactPhone = emergency?.Phone,
            EmergencyContactAddress = emergency?.Address,
            ProfileImageUrl = profile?.FileUrl,
            SignatureImageUrl = signature?.FileUrl,
        };
    }
}
