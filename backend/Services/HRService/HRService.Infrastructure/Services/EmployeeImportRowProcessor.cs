using Erp.BuildingBlocks.SharedKernel;
using HRService.Application.Employees;
using HRService.Domain.Entities;
using HRService.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace HRService.Infrastructure.Services;

public sealed class EmployeeImportRowProcessor(
    HrDbContext db,
    IEmployeeService employeeService,
    EmployeeOrganogramResolver organogram)
{
    /// <returns>true if created, false if updated</returns>
    public async Task<bool> UpsertOneAsync(
        Guid companyId,
        EmployeeImportRowDto row,
        EmployeeOrganogramLookupCache organogramCache,
        CancellationToken cancellationToken)
    {
        var employeeId = EmployeeIdentityRules.NormalizeEmployeeId(row.EmployeeID);
        EmployeeIdentityRules.ValidateEmployeeId(employeeId);
        EmployeeIdentityRules.ValidatePunchNumber(row.PunchNumber);

        if (string.Equals(row.Status.Trim(), "Inactive", StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException("Inactive employee rows are not processed.");
        }

        var placement = await organogram.ResolveAsync(
            companyId,
            row.DepartmentName ?? "",
            row.DesignationName ?? "",
            row.SectionName,
            row.GradeName,
            row.GroupName,
            row.LineName,
            row.SupervisorEmployeeID,
            organogramCache,
            cancellationToken);

        var employmentType = ResolveEmploymentType(row);
        var existing = await db.Employees
            .FirstOrDefaultAsync(
                e => e.CompanyId == companyId && e.EmployeeID == employeeId && !e.IsDeleted,
                cancellationToken);

        if (existing == null)
        {
            var create = MapCreateDto(companyId, row, employeeId, placement, employmentType);
            var newEmployeeId = await employeeService.CreateAsync(create, cancellationToken);
            organogramCache.RegisterSupervisor(employeeId, newEmployeeId);
            await SyncSubResourcesAsync(newEmployeeId, row, cancellationToken);
            return true;
        }

        await UpdatePunchIfNeededAsync(existing, row.PunchNumber, companyId, cancellationToken);

        var update = MapUpdateDto(row, employmentType);
        await employeeService.UpdateAsync(existing.Id, update, cancellationToken);

        await employeeService.TransferAsync(
            existing.Id,
            new TransferEmployeeDto(
                placement.DepartmentId,
                placement.SectionId,
                placement.DesignationId,
                placement.GradeId,
                placement.SupervisorId,
                placement.WorkLocation,
                "Excel import",
                row.JoinDate,
                placement.GroupId),
            cancellationToken);

        await SyncSubResourcesAsync(existing.Id, row, cancellationToken);
        return false;
    }

    private async Task UpdatePunchIfNeededAsync(
        Employee employee,
        int punchNumber,
        Guid companyId,
        CancellationToken cancellationToken)
    {
        if (punchNumber <= 0 || employee.PunchNumber == punchNumber)
        {
            return;
        }

        var taken = await db.Employees.AnyAsync(
            e => e.CompanyId == companyId && e.PunchNumber == punchNumber && e.Id != employee.Id && !e.IsDeleted,
            cancellationToken);
        if (taken)
        {
            throw new InvalidOperationException($"PunchNumber {punchNumber} already exists in this company.");
        }

        employee.PunchNumber = punchNumber;
        employee.UpdatedAt = BusinessTime.Now;
        await db.SaveChangesAsync(cancellationToken);
    }

    private static string ResolveEmploymentType(EmployeeImportRowDto row)
    {
        if (!string.IsNullOrWhiteSpace(row.EmploymentType))
        {
            return row.EmploymentType.Trim();
        }

        return string.Equals(row.Status.Trim(), "Probation", StringComparison.OrdinalIgnoreCase)
            ? "Probation"
            : "Permanent";
    }

    private static CreateEmployeeDto MapCreateDto(
        Guid companyId,
        EmployeeImportRowDto row,
        string employeeId,
        EmployeePlacementResolution placement,
        string employmentType) =>
        new(
            companyId,
            row.PunchNumber,
            employeeId,
            row.FullName.Trim(),
            row.BanglaName,
            row.Gender,
            row.DateOfBirth,
            row.NationalId,
            row.BirthCertificateNo,
            row.Phone,
            row.Email,
            row.JoinDate,
            employmentType,
            placement.DepartmentId,
            placement.SectionId,
            placement.DesignationId,
            placement.GradeId,
            row.BasicSalary,
            row.HouseRent,
            row.MedicalAllowance,
            row.ConveyanceAllowance,
            row.FoodAllowance,
            row.Religion,
            row.BloodGroup,
            placement.GroupId,
            row.FatherNameEn,
            row.FatherNameBn,
            row.MotherNameEn,
            row.MotherNameBn,
            row.MaritalStatus,
            row.SpouseNameEn,
            row.SpouseNameBn,
            row.SpouseOccupation,
            row.SpouseContact,
            row.EducationLevel,
            row.Institution,
            row.FieldOfStudy,
            row.Skills,
            row.Reference1Name,
            row.Reference1Relation,
            row.Reference1Phone,
            row.Reference1Address,
            row.Reference2Name,
            row.Reference2Relation,
            row.Reference2Phone,
            row.Reference2Address,
            row.IsOtEnabled,
            placement.WorkLocation);

    private static UpdateEmployeeDto MapUpdateDto(EmployeeImportRowDto row, string employmentType) =>
        new(
            row.FullName.Trim(),
            row.BanglaName,
            row.Gender,
            row.DateOfBirth,
            row.NationalId,
            row.BirthCertificateNo,
            row.Phone,
            row.Email,
            row.JoinDate,
            employmentType,
            row.Status.Trim(),
            row.Religion,
            row.BloodGroup,
            row.FatherNameEn,
            row.FatherNameBn,
            row.MotherNameEn,
            row.MotherNameBn,
            row.MaritalStatus,
            row.SpouseNameEn,
            row.SpouseNameBn,
            row.SpouseOccupation,
            row.SpouseContact,
            row.EducationLevel,
            row.Institution,
            row.FieldOfStudy,
            row.Skills,
            row.Reference1Name,
            row.Reference1Relation,
            row.Reference1Phone,
            row.Reference1Address,
            row.Reference2Name,
            row.Reference2Relation,
            row.Reference2Phone,
            row.Reference2Address,
            row.IsOtEnabled,
            row.BasicSalary,
            row.HouseRent,
            row.MedicalAllowance,
            row.ConveyanceAllowance,
            row.FoodAllowance);

    private async Task SyncSubResourcesAsync(Guid employeeId, EmployeeImportRowDto row, CancellationToken cancellationToken)
    {
        var employee = await db.Employees
            .Include(e => e.Addresses)
            .Include(e => e.BankAccounts)
            .Include(e => e.EmergencyContacts)
            .Include(e => e.Documents)
            .FirstAsync(e => e.Id == employeeId, cancellationToken);

        await UpsertAddressAsync(employee, "Present", row.PresentDivision, row.PresentDistrict, row.PresentUpazila,
            row.PresentPostOffice, row.PresentPostalCode, row.PresentAddress, cancellationToken);
        await UpsertAddressAsync(employee, "Permanent", row.PermanentDivision, row.PermanentDistrict, row.PermanentUpazila,
            row.PermanentPostOffice, row.PermanentPostalCode, row.PermanentAddress, cancellationToken);
        await UpsertBankAsync(employee, row, cancellationToken);
        await UpsertEmergencyAsync(employee, row, cancellationToken);
        await UpsertDocumentAsync(employee, "Profile Image", row.ProfileImageUrl, cancellationToken);
        await UpsertDocumentAsync(employee, "Signature", row.SignatureImageUrl, cancellationToken);
    }

    private async Task UpsertAddressAsync(
        Employee employee,
        string addressType,
        string? division,
        string? district,
        string? upazila,
        string? postOffice,
        string? postalCode,
        string? addressLine,
        CancellationToken cancellationToken)
    {
        var hasData = !string.IsNullOrWhiteSpace(addressLine)
            || !string.IsNullOrWhiteSpace(division)
            || !string.IsNullOrWhiteSpace(district)
            || !string.IsNullOrWhiteSpace(upazila)
            || !string.IsNullOrWhiteSpace(postOffice)
            || !string.IsNullOrWhiteSpace(postalCode);

        var existing = employee.Addresses.FirstOrDefault(a =>
            string.Equals(a.AddressType, addressType, StringComparison.OrdinalIgnoreCase));

        if (!hasData)
        {
            if (existing != null)
            {
                await employeeService.DeleteAddressAsync(existing.Id, cancellationToken);
            }

            return;
        }

        var dto = new EmployeeAddressDto(
            addressType,
            "Bangladesh",
            division,
            district,
            upazila,
            postOffice,
            postalCode,
            addressLine);

        if (existing != null)
        {
            await employeeService.UpdateAddressAsync(existing.Id, dto, cancellationToken);
        }
        else
        {
            await employeeService.AddAddressAsync(employee.Id, dto, cancellationToken);
        }
    }

    private async Task UpsertBankAsync(Employee employee, EmployeeImportRowDto row, CancellationToken cancellationToken)
    {
        var isMcash = string.Equals(row.BankAccountType?.Trim(), "mCash Account", StringComparison.OrdinalIgnoreCase);
        var hasData = isMcash
            ? !string.IsNullOrWhiteSpace(row.MobileBankingNo)
            : !string.IsNullOrWhiteSpace(row.AccountNo)
                || !string.IsNullOrWhiteSpace(row.BankName)
                || !string.IsNullOrWhiteSpace(row.BranchName);

        var primary = employee.BankAccounts.FirstOrDefault(b => b.IsPrimary)
            ?? employee.BankAccounts.FirstOrDefault();

        if (!hasData)
        {
            if (primary != null)
            {
                await employeeService.DeleteBankAccountAsync(primary.Id, cancellationToken);
            }

            return;
        }

        var dto = isMcash
            ? new EmployeeBankAccountDto(null, null, null, null, "mCash Account", row.MobileBankingNo, true)
            : new EmployeeBankAccountDto(
                row.BankName,
                row.BranchName,
                row.AccountNo,
                row.RoutingNo,
                row.BankAccountType ?? "Bank Account",
                null,
                true);

        if (primary != null)
        {
            await employeeService.UpdateBankAccountAsync(primary.Id, dto, cancellationToken);
        }
        else
        {
            await employeeService.AddBankAccountAsync(employee.Id, dto, cancellationToken);
        }
    }

    private async Task UpsertEmergencyAsync(Employee employee, EmployeeImportRowDto row, CancellationToken cancellationToken)
    {
        var hasData = !string.IsNullOrWhiteSpace(row.EmergencyContactName)
            || !string.IsNullOrWhiteSpace(row.EmergencyContactPhone);

        var existing = employee.EmergencyContacts.FirstOrDefault();
        if (!hasData)
        {
            if (existing != null)
            {
                await employeeService.DeleteEmergencyContactAsync(existing.Id, cancellationToken);
            }

            return;
        }

        var dto = new EmergencyContactDto(
            row.EmergencyContactName?.Trim() ?? "Contact",
            row.EmergencyContactRelation,
            row.EmergencyContactPhone?.Trim() ?? "",
            row.EmergencyContactAddress);

        if (existing != null)
        {
            await employeeService.UpdateEmergencyContactAsync(existing.Id, dto, cancellationToken);
        }
        else
        {
            await employeeService.AddEmergencyContactAsync(employee.Id, dto, cancellationToken);
        }
    }

    private async Task UpsertDocumentAsync(
        Employee employee,
        string documentType,
        string? fileUrl,
        CancellationToken cancellationToken)
    {
        var trimmed = fileUrl?.Trim();
        var existing = employee.Documents.FirstOrDefault(d =>
            string.Equals(d.DocumentType, documentType, StringComparison.OrdinalIgnoreCase));

        if (string.IsNullOrWhiteSpace(trimmed))
        {
            if (existing != null)
            {
                await employeeService.DeleteDocumentAsync(existing.Id, cancellationToken);
            }

            return;
        }

        if (existing != null && string.Equals(existing.FileUrl, trimmed, StringComparison.Ordinal))
        {
            return;
        }

        if (existing != null)
        {
            await employeeService.DeleteDocumentAsync(existing.Id, cancellationToken);
        }

        await employeeService.AddDocumentAsync(employee.Id, new EmployeeDocumentDto(documentType, trimmed), cancellationToken);
    }
}
