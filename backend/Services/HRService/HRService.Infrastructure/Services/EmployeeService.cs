using HRService.Application.Employees;
using HRService.Domain.Entities;
using HRService.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

using Erp.BuildingBlocks.SharedKernel;

namespace HRService.Infrastructure.Services;

public sealed class EmployeeService(HrDbContext db) : IEmployeeService
{
    private async Task EnsureDepartmentAndDesignationExistAsync(Guid? departmentId, Guid? designationId, Guid companyId, CancellationToken cancellationToken)
    {
        if (departmentId.HasValue)
        {
            var deptExists = await db.Departments.AnyAsync(d => d.Id == departmentId.Value, cancellationToken);
            if (!deptExists)
            {
                string name = "Sync-Dept";
                string? code = null;
                try
                {
                    var raw = await db.Database
                        .SqlQueryRaw<string>("SELECT CAST(NameEn AS varchar(max)) AS Value FROM CompanyServiceDB.dbo.Departments WHERE Id = {0}", departmentId.Value)
                        .FirstOrDefaultAsync(cancellationToken);
                    if (!string.IsNullOrEmpty(raw)) name = raw;

                    var rawCode = await db.Database
                        .SqlQueryRaw<string>("SELECT CAST(Code AS varchar(max)) AS Value FROM CompanyServiceDB.dbo.Departments WHERE Id = {0}", departmentId.Value)
                        .FirstOrDefaultAsync(cancellationToken);
                    if (!string.IsNullOrEmpty(rawCode)) code = rawCode;
                }
                catch
                {
                    // Fallback
                }

                db.Departments.Add(new Department
                {
                    Id = departmentId.Value,
                    CompanyId = companyId,
                    Name = name,
                    Code = code,
                    CreatedAt = BusinessTime.NowOffset
                });
                await db.SaveChangesAsync(cancellationToken);
            }
        }

        if (designationId.HasValue)
        {
            var desigExists = await db.Designations.AnyAsync(d => d.Id == designationId.Value, cancellationToken);
            if (!desigExists)
            {
                string name = "Sync-Desig";
                try
                {
                    var raw = await db.Database
                        .SqlQueryRaw<string>("SELECT CAST(NameEn AS varchar(max)) AS Value FROM CompanyServiceDB.dbo.Designations WHERE Id = {0}", designationId.Value)
                        .FirstOrDefaultAsync(cancellationToken);
                    if (!string.IsNullOrEmpty(raw)) name = raw;
                }
                catch
                {
                    // Fallback
                }

                var defaultGrade = await db.Grades.FirstOrDefaultAsync(cancellationToken);
                if (defaultGrade == null)
                {
                    defaultGrade = new Grade { Id = Guid.NewGuid(), Name = "G1", CreatedAt = BusinessTime.NowOffset };
                    db.Grades.Add(defaultGrade);
                    await db.SaveChangesAsync(cancellationToken);
                }

                db.Designations.Add(new Designation
                {
                    Id = designationId.Value,
                    GradeId = defaultGrade.Id,
                    Name = name,
                    CreatedAt = BusinessTime.NowOffset
                });
                await db.SaveChangesAsync(cancellationToken);
            }
        }
    }

    private async Task EnsureGroupValidForCompanyAsync(Guid? groupId, Guid companyId, CancellationToken cancellationToken)
    {
        if (!groupId.HasValue || !db.Database.IsRelational())
        {
            return;
        }

        try
        {
            var groupCompanyId = await db.Database
                .SqlQueryRaw<string>(
                    "SELECT CAST(CompanyId AS varchar(36)) AS Value FROM CompanyServiceDB.dbo.Groups WHERE Id = {0}",
                    groupId.Value)
                .FirstOrDefaultAsync(cancellationToken);

            if (string.IsNullOrWhiteSpace(groupCompanyId)
                || !Guid.TryParse(groupCompanyId, out var parsedCompanyId)
                || parsedCompanyId != companyId)
            {
                throw new InvalidOperationException("Group not found or does not belong to this company.");
            }
        }
        catch (InvalidOperationException)
        {
            throw;
        }
        catch
        {
            // Company DB unavailable in some environments — skip validation.
        }
    }

    public async Task<Guid> CreateAsync(CreateEmployeeDto dto, CancellationToken cancellationToken = default)
    {
        await EnsureDepartmentAndDesignationExistAsync(dto.DepartmentId, dto.DesignationId, dto.CompanyId, cancellationToken);

        EmployeeIdentityRules.ValidatePunchNumber(dto.PunchNumber);

        var punchExists = await db.Employees.AnyAsync(
            e => e.CompanyId == dto.CompanyId && e.PunchNumber == dto.PunchNumber && !e.IsDeleted,
            cancellationToken);
        if (punchExists)
        {
            throw new InvalidOperationException($"PunchNumber {dto.PunchNumber} already exists in this company.");
        }

        var employeeId = string.IsNullOrWhiteSpace(dto.EmployeeID)
            ? await GenerateNextEmployeeIdAsync(dto.CompanyId, cancellationToken)
            : EmployeeIdentityRules.NormalizeEmployeeId(dto.EmployeeID);
        EmployeeIdentityRules.ValidateEmployeeId(employeeId);

        var idExists = await db.Employees.AnyAsync(
            e => e.CompanyId == dto.CompanyId && e.EmployeeID == employeeId && !e.IsDeleted,
            cancellationToken);
        if (idExists)
        {
            throw new InvalidOperationException($"EmployeeID {employeeId} already exists in this company.");
        }

        var employee = new Employee
        {
            Id = Guid.NewGuid(),
            CompanyId = dto.CompanyId,
            PunchNumber = dto.PunchNumber,
            EmployeeID = employeeId,
            FullName = dto.FullName,
            BanglaName = dto.BanglaName,
            Gender = dto.Gender,
            Religion = dto.Religion,
            BloodGroup = dto.BloodGroup,
            DateOfBirth = dto.DateOfBirth,
            NationalId = dto.NationalId,
            BirthCertificateNo = dto.BirthCertificateNo,
            Phone = dto.Phone,
            Email = dto.Email,
            JoinDate = dto.JoinDate,
            EmploymentType = dto.EmploymentType,
            Status = "Active", // Initial status is Active
            IsOtEnabled = dto.IsOtEnabled,
            FatherNameEn = dto.FatherNameEn,
            FatherNameBn = dto.FatherNameBn,
            MotherNameEn = dto.MotherNameEn,
            MotherNameBn = dto.MotherNameBn,
            MaritalStatus = dto.MaritalStatus,
            SpouseNameEn = dto.SpouseNameEn,
            SpouseNameBn = dto.SpouseNameBn,
            SpouseOccupation = dto.SpouseOccupation,
            SpouseContact = dto.SpouseContact,
            EducationLevel = dto.EducationLevel,
            Institution = dto.Institution,
            FieldOfStudy = dto.FieldOfStudy,
            Skills = dto.Skills,
            Reference1Name = dto.Reference1Name,
            Reference1Relation = dto.Reference1Relation,
            Reference1Phone = dto.Reference1Phone,
            Reference1Address = dto.Reference1Address,
            Reference2Name = dto.Reference2Name,
            Reference2Relation = dto.Reference2Relation,
            Reference2Phone = dto.Reference2Phone,
            Reference2Address = dto.Reference2Address,
            CreatedAt = BusinessTime.Now,
            IsDeleted = false
        };

        // Business Rule: Current job info only one record
        employee.JobInfos.Add(new EmployeeJobInfo
        {
            Id = Guid.NewGuid(),
            CompanyId = dto.CompanyId,
            DepartmentId = dto.DepartmentId,
            SectionId = dto.SectionId,
            DesignationId = dto.DesignationId,
            GradeId = dto.GradeId,
            GroupId = dto.GroupId,
            WorkLocation = dto.WorkLocation,
            EffectiveFrom = dto.JoinDate,
            IsCurrent = true
        });

        // Business Rule: Current salary only one record
        employee.SalaryInfos.Add(new EmployeeSalaryInfo
        {
            Id = Guid.NewGuid(),
            CompanyId = dto.CompanyId,
            BasicSalary = dto.BasicSalary,
            HouseRent = dto.HouseRent,
            MedicalAllowance = dto.MedicalAllowance,
            ConveyanceAllowance = dto.ConveyanceAllowance,
            FoodAllowance = dto.FoodAllowance,
            GrossSalary = dto.BasicSalary + dto.HouseRent + dto.MedicalAllowance + dto.ConveyanceAllowance + dto.FoodAllowance,
            EffectiveFrom = dto.JoinDate,
            IsCurrent = true
        });

        db.Employees.Add(employee);
        await db.SaveChangesAsync(cancellationToken);
        return employee.Id;
    }

    public async Task UpdateAsync(Guid id, UpdateEmployeeDto dto, CancellationToken cancellationToken = default)
    {
        var employee = await db.Employees.FirstOrDefaultAsync(x => x.Id == id && !x.IsDeleted, cancellationToken);
        if (employee == null) return;

        employee.FullName = dto.FullName;
        employee.BanglaName = dto.BanglaName;
        employee.Gender = dto.Gender;
        employee.Religion = dto.Religion;
        employee.BloodGroup = dto.BloodGroup;
        employee.DateOfBirth = dto.DateOfBirth;
        employee.NationalId = dto.NationalId;
        employee.BirthCertificateNo = dto.BirthCertificateNo;
        employee.Phone = dto.Phone;
        employee.Email = dto.Email;
        employee.JoinDate = dto.JoinDate;
        employee.EmploymentType = dto.EmploymentType;
        employee.Status = dto.Status;
        employee.IsOtEnabled = dto.IsOtEnabled;
        employee.FatherNameEn = dto.FatherNameEn;
        employee.FatherNameBn = dto.FatherNameBn;
        employee.MotherNameEn = dto.MotherNameEn;
        employee.MotherNameBn = dto.MotherNameBn;
        employee.MaritalStatus = dto.MaritalStatus;
        employee.SpouseNameEn = dto.SpouseNameEn;
        employee.SpouseNameBn = dto.SpouseNameBn;
        employee.SpouseOccupation = dto.SpouseOccupation;
        employee.SpouseContact = dto.SpouseContact;
        employee.EducationLevel = dto.EducationLevel;
        employee.Institution = dto.Institution;
        employee.FieldOfStudy = dto.FieldOfStudy;
        employee.Skills = dto.Skills;
        employee.Reference1Name = dto.Reference1Name;
        employee.Reference1Relation = dto.Reference1Relation;
        employee.Reference1Phone = dto.Reference1Phone;
        employee.Reference1Address = dto.Reference1Address;
        employee.Reference2Name = dto.Reference2Name;
        employee.Reference2Relation = dto.Reference2Relation;
        employee.Reference2Phone = dto.Reference2Phone;
        employee.Reference2Address = dto.Reference2Address;
        employee.UpdatedAt = BusinessTime.Now;

        await db.SaveChangesAsync(cancellationToken);

        await ApplyCurrentSalaryAsync(
            employee.CompanyId,
            employee.Id,
            dto.BasicSalary,
            dto.HouseRent,
            dto.MedicalAllowance,
            dto.ConveyanceAllowance,
            dto.FoodAllowance,
            dto.JoinDate,
            cancellationToken);
    }

    public async Task DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var employee = await db.Employees.FirstOrDefaultAsync(x => x.Id == id && !x.IsDeleted, cancellationToken);
        if (employee == null) return;

        employee.IsDeleted = true;
        employee.DeletedAt = BusinessTime.NowOffset;
        await db.SaveChangesAsync(cancellationToken);
    }

    public async Task TransferAsync(Guid id, TransferEmployeeDto dto, CancellationToken cancellationToken = default)
    {
        var employee = await db.Employees.Include(e => e.JobInfos).FirstOrDefaultAsync(x => x.Id == id && !x.IsDeleted, cancellationToken);
        if (employee == null) return;

        await EnsureDepartmentAndDesignationExistAsync(dto.DepartmentId, dto.DesignationId, employee.CompanyId, cancellationToken);

        var currentJob = await db.EmployeeJobInfos
            .Where(j => j.EmployeeId == id && j.IsCurrent)
            .OrderByDescending(j => j.EffectiveFrom)
            .FirstOrDefaultAsync(cancellationToken);
        if (currentJob != null && JobPlacementMatches(currentJob, dto))
        {
            var workLocationMatches = WorkLocationMatches(currentJob.WorkLocation, dto.WorkLocation);
            var groupMatches = currentJob.GroupId == dto.GroupId;

            if (workLocationMatches && groupMatches)
            {
                return;
            }

            await EnsureGroupValidForCompanyAsync(dto.GroupId, employee.CompanyId, cancellationToken);

            if (!groupMatches)
            {
                currentJob.GroupId = dto.GroupId;
            }

            if (!workLocationMatches)
            {
                currentJob.WorkLocation = string.IsNullOrWhiteSpace(dto.WorkLocation)
                    ? null
                    : dto.WorkLocation.Trim();
            }

            await db.SaveChangesAsync(cancellationToken);
            return;
        }

        // Business Rule: Current job info only one record
        var existingJobs = await db.EmployeeJobInfos
            .Where(j => j.EmployeeId == id && j.IsCurrent)
            .ToListAsync(cancellationToken);
        var fromDepartmentId = existingJobs.Select(j => j.DepartmentId).FirstOrDefault();
        foreach (var job in existingJobs)
        {
            job.IsCurrent = false;
            job.EffectiveTo = dto.EffectiveFrom.Date.AddDays(-1);
        }

        db.EmployeeTransfers.Add(new EmployeeTransfer
        {
            Id = Guid.NewGuid(),
            EmployeeId = id,
            FromDepartmentId = fromDepartmentId,
            ToDepartmentId = dto.DepartmentId,
            EffectiveDate = dto.EffectiveFrom,
            Reason = dto.Reason,
            CreatedAt = BusinessTime.NowOffset,
        });

        db.EmployeeJobInfos.Add(new EmployeeJobInfo
        {
            Id = Guid.NewGuid(),
            CompanyId = employee.CompanyId,
            EmployeeId = id,
            DepartmentId = dto.DepartmentId,
            SectionId = dto.SectionId,
            DesignationId = dto.DesignationId,
            GradeId = dto.GradeId,
            GroupId = dto.GroupId,
            SupervisorId = dto.SupervisorId,
            WorkLocation = dto.WorkLocation,
            EffectiveFrom = dto.EffectiveFrom,
            IsCurrent = true
        });

        await db.SaveChangesAsync(cancellationToken);
    }

    private static string? NormalizeWorkLocation(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();

    private static bool WorkLocationMatches(string? current, string? next) =>
        string.Equals(
            NormalizeWorkLocation(current),
            NormalizeWorkLocation(next),
            StringComparison.OrdinalIgnoreCase);

    private static bool JobPlacementMatches(EmployeeJobInfo job, TransferEmployeeDto dto) =>
        job.DepartmentId == dto.DepartmentId &&
        job.SectionId == dto.SectionId &&
        job.DesignationId == dto.DesignationId &&
        job.GradeId == dto.GradeId &&
        job.SupervisorId == dto.SupervisorId;

    public async Task ChangeStatusAsync(Guid id, ChangeStatusDto dto, CancellationToken cancellationToken = default)
    {
        var employee = await db.Employees.FirstOrDefaultAsync(x => x.Id == id && !x.IsDeleted, cancellationToken);
        if (employee == null) return;

        // Business Rule: Employee delete করা উচিত না; status change করা উচিত।
        employee.Status = dto.Status;
        employee.UpdatedAt = BusinessTime.Now;

        db.EmployeeStatusHistories.Add(new EmployeeStatusHistory
        {
            Id = Guid.NewGuid(),
            EmployeeId = id,
            Status = dto.Status,
            EffectiveFrom = dto.EffectiveFrom,
            Remarks = dto.Remarks,
            CreatedAt = BusinessTime.NowOffset
        });

        await db.SaveChangesAsync(cancellationToken);
    }

    public async Task UpdateSalaryAsync(Guid id, UpdateSalaryDto dto, CancellationToken cancellationToken = default)
    {
        var employee = await db.Employees.AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == id && !x.IsDeleted, cancellationToken);
        if (employee == null) return;

        await NormalizeDuplicateCurrentSalariesAsync(id, cancellationToken);

        var grossSalary = dto.BasicSalary + dto.HouseRent + dto.MedicalAllowance + dto.ConveyanceAllowance + dto.FoodAllowance;
        var currentSalary = await db.EmployeeSalaryInfos
            .Where(s => s.EmployeeId == id && s.IsCurrent)
            .OrderByDescending(s => s.EffectiveFrom)
            .FirstOrDefaultAsync(cancellationToken);

        if (currentSalary != null &&
            currentSalary.BasicSalary == dto.BasicSalary &&
            currentSalary.HouseRent == dto.HouseRent &&
            currentSalary.MedicalAllowance == dto.MedicalAllowance &&
            currentSalary.ConveyanceAllowance == dto.ConveyanceAllowance &&
            currentSalary.FoodAllowance == dto.FoodAllowance &&
            currentSalary.GrossSalary == grossSalary)
        {
            return;
        }

        if (currentSalary != null && await TryUpdateSalaryRowAsync(
                currentSalary.Id,
                dto.BasicSalary,
                dto.HouseRent,
                dto.MedicalAllowance,
                dto.ConveyanceAllowance,
                dto.FoodAllowance,
                grossSalary,
                cancellationToken))
        {
            return;
        }

        db.EmployeeSalaryInfos.Add(new EmployeeSalaryInfo
        {
            Id = Guid.NewGuid(),
            CompanyId = employee.CompanyId,
            EmployeeId = id,
            BasicSalary = dto.BasicSalary,
            HouseRent = dto.HouseRent,
            MedicalAllowance = dto.MedicalAllowance,
            ConveyanceAllowance = dto.ConveyanceAllowance,
            FoodAllowance = dto.FoodAllowance,
            GrossSalary = grossSalary,
            EffectiveFrom = dto.EffectiveFrom,
            IsCurrent = true
        });

        await db.SaveChangesAsync(cancellationToken);
    }

    private async Task ApplyCurrentSalaryAsync(
        Guid companyId,
        Guid employeeId,
        decimal basicSalary,
        decimal houseRent,
        decimal medicalAllowance,
        decimal conveyanceAllowance,
        decimal foodAllowance,
        DateTime effectiveFrom,
        CancellationToken cancellationToken)
    {
        await NormalizeDuplicateCurrentSalariesAsync(employeeId, cancellationToken);

        var grossSalary = basicSalary + houseRent + medicalAllowance + conveyanceAllowance + foodAllowance;
        var currentSalary = await db.EmployeeSalaryInfos
            .AsNoTracking()
            .Where(s => s.EmployeeId == employeeId && s.IsCurrent)
            .OrderByDescending(s => s.EffectiveFrom)
            .FirstOrDefaultAsync(cancellationToken);

        if (currentSalary != null &&
            currentSalary.BasicSalary == basicSalary &&
            currentSalary.HouseRent == houseRent &&
            currentSalary.MedicalAllowance == medicalAllowance &&
            currentSalary.ConveyanceAllowance == conveyanceAllowance &&
            currentSalary.FoodAllowance == foodAllowance &&
            currentSalary.GrossSalary == grossSalary)
        {
            return;
        }

        if (currentSalary != null && await TryUpdateSalaryRowAsync(
                currentSalary.Id,
                basicSalary,
                houseRent,
                medicalAllowance,
                conveyanceAllowance,
                foodAllowance,
                grossSalary,
                cancellationToken))
        {
            return;
        }

        db.EmployeeSalaryInfos.Add(new EmployeeSalaryInfo
        {
            Id = Guid.NewGuid(),
            CompanyId = companyId,
            EmployeeId = employeeId,
            BasicSalary = basicSalary,
            HouseRent = houseRent,
            MedicalAllowance = medicalAllowance,
            ConveyanceAllowance = conveyanceAllowance,
            FoodAllowance = foodAllowance,
            GrossSalary = grossSalary,
            EffectiveFrom = effectiveFrom,
            IsCurrent = true
        });

        await db.SaveChangesAsync(cancellationToken);
    }

    private async Task<bool> TryUpdateSalaryRowAsync(
        Guid salaryRowId,
        decimal basicSalary,
        decimal houseRent,
        decimal medicalAllowance,
        decimal conveyanceAllowance,
        decimal foodAllowance,
        decimal grossSalary,
        CancellationToken cancellationToken)
    {
        var row = await db.EmployeeSalaryInfos
            .FirstOrDefaultAsync(s => s.Id == salaryRowId, cancellationToken);
        if (row == null)
        {
            return false;
        }

        row.BasicSalary = basicSalary;
        row.HouseRent = houseRent;
        row.MedicalAllowance = medicalAllowance;
        row.ConveyanceAllowance = conveyanceAllowance;
        row.FoodAllowance = foodAllowance;
        row.GrossSalary = grossSalary;

        await db.SaveChangesAsync(cancellationToken);
        return true;
    }

    private async Task NormalizeDuplicateCurrentSalariesAsync(Guid employeeId, CancellationToken cancellationToken)
    {
        var currentRows = await db.EmployeeSalaryInfos
            .Where(s => s.EmployeeId == employeeId && s.IsCurrent)
            .OrderByDescending(s => s.EffectiveFrom)
            .ToListAsync(cancellationToken);

        if (currentRows.Count <= 1)
        {
            return;
        }

        var keep = currentRows[0];
        foreach (var row in currentRows.Skip(1))
        {
            row.IsCurrent = false;
            row.EffectiveTo = keep.EffectiveFrom.Date.AddDays(-1);
        }

        await db.SaveChangesAsync(cancellationToken);
    }

    public async Task AddAddressAsync(Guid employeeId, EmployeeAddressDto dto, CancellationToken cancellationToken = default)
    {
        db.EmployeeAddresses.Add(new EmployeeAddress
        {
            Id = Guid.NewGuid(),
            EmployeeId = employeeId,
            AddressType = dto.AddressType,
            Country = dto.Country,
            Division = dto.Division,
            District = dto.District,
            Upazila = dto.Upazila,
            PostOffice = dto.PostOffice,
            PostalCode = dto.PostalCode,
            AddressLine = dto.AddressLine
        });
        await db.SaveChangesAsync(cancellationToken);
    }

    public async Task UpdateAddressAsync(Guid addressId, EmployeeAddressDto dto, CancellationToken cancellationToken = default)
    {
        var address = await db.EmployeeAddresses.FindAsync(addressId);
        if (address == null) return;

        address.AddressType = dto.AddressType;
        address.Country = dto.Country;
        address.Division = dto.Division;
        address.District = dto.District;
        address.Upazila = dto.Upazila;
        address.PostOffice = dto.PostOffice;
        address.PostalCode = dto.PostalCode;
        address.AddressLine = dto.AddressLine;

        await db.SaveChangesAsync(cancellationToken);
    }

    public async Task DeleteAddressAsync(Guid addressId, CancellationToken cancellationToken = default)
    {
        var address = await db.EmployeeAddresses.FindAsync(addressId);
        if (address != null)
        {
            db.EmployeeAddresses.Remove(address);
            await db.SaveChangesAsync(cancellationToken);
        }
    }

    public async Task AddBankAccountAsync(Guid employeeId, EmployeeBankAccountDto dto, CancellationToken cancellationToken = default)
    {
        db.EmployeeBankAccounts.Add(new EmployeeBankAccount
        {
            Id = Guid.NewGuid(),
            EmployeeId = employeeId,
            BankName = dto.BankName,
            BranchName = dto.BranchName,
            AccountNo = dto.AccountNo,
            RoutingNo = dto.RoutingNo,
            MobileBankingType = dto.MobileBankingType,
            MobileBankingNo = dto.MobileBankingNo,
            IsPrimary = dto.IsPrimary
        });
        await db.SaveChangesAsync(cancellationToken);
    }

    public async Task UpdateBankAccountAsync(Guid bankAccountId, EmployeeBankAccountDto dto, CancellationToken cancellationToken = default)
    {
        var account = await db.EmployeeBankAccounts.FindAsync(bankAccountId);
        if (account == null) return;

        account.BankName = dto.BankName;
        account.BranchName = dto.BranchName;
        account.AccountNo = dto.AccountNo;
        account.RoutingNo = dto.RoutingNo;
        account.MobileBankingType = dto.MobileBankingType;
        account.MobileBankingNo = dto.MobileBankingNo;
        account.IsPrimary = dto.IsPrimary;

        await db.SaveChangesAsync(cancellationToken);
    }

    public async Task DeleteBankAccountAsync(Guid bankAccountId, CancellationToken cancellationToken = default)
    {
        var account = await db.EmployeeBankAccounts.FindAsync(bankAccountId);
        if (account != null)
        {
            db.EmployeeBankAccounts.Remove(account);
            await db.SaveChangesAsync(cancellationToken);
        }
    }

    public async Task AddEmergencyContactAsync(Guid employeeId, EmergencyContactDto dto, CancellationToken cancellationToken = default)
    {
        db.EmployeeEmergencyContacts.Add(new EmployeeEmergencyContact
        {
            Id = Guid.NewGuid(),
            EmployeeId = employeeId,
            ContactName = dto.ContactName,
            Relation = dto.Relation,
            Phone = dto.Phone,
            Address = dto.Address
        });
        await db.SaveChangesAsync(cancellationToken);
    }

    public async Task UpdateEmergencyContactAsync(Guid contactId, EmergencyContactDto dto, CancellationToken cancellationToken = default)
    {
        var contact = await db.EmployeeEmergencyContacts.FindAsync(contactId);
        if (contact == null) return;

        contact.ContactName = dto.ContactName;
        contact.Relation = dto.Relation;
        contact.Phone = dto.Phone;
        contact.Address = dto.Address;

        await db.SaveChangesAsync(cancellationToken);
    }

    public async Task DeleteEmergencyContactAsync(Guid contactId, CancellationToken cancellationToken = default)
    {
        var contact = await db.EmployeeEmergencyContacts.FindAsync(contactId);
        if (contact != null)
        {
            db.EmployeeEmergencyContacts.Remove(contact);
            await db.SaveChangesAsync(cancellationToken);
        }
    }

    public async Task AddDocumentAsync(Guid employeeId, EmployeeDocumentDto dto, CancellationToken cancellationToken = default)
    {
        db.EmployeeDocuments.Add(new EmployeeDocument
        {
            Id = Guid.NewGuid(),
            EmployeeId = employeeId,
            DocumentType = dto.DocumentType,
            FileUrl = dto.FileUrl,
            UploadedAt = DateTime.Now
        });
        await db.SaveChangesAsync(cancellationToken);
    }

    public async Task DeleteDocumentAsync(Guid documentId, CancellationToken cancellationToken = default)
    {
        var doc = await db.EmployeeDocuments.FindAsync(documentId);
        if (doc != null)
        {
            db.EmployeeDocuments.Remove(doc);
            await db.SaveChangesAsync(cancellationToken);
        }
    }

    private async Task<string> GenerateNextEmployeeIdAsync(Guid companyId, CancellationToken cancellationToken)
    {
        var existing = await db.Employees.AsNoTracking()
            .Where(e => e.CompanyId == companyId && !e.IsDeleted)
            .Select(e => e.EmployeeID)
            .ToListAsync(cancellationToken);

        var max = 0;
        foreach (var id in existing)
        {
            if (EmployeeIdentityRules.TryParseAutoSequence(id, out var n) && n > max)
            {
                max = n;
            }
        }

        return EmployeeIdentityRules.FormatEmployeeId(max + 1);
    }
}
