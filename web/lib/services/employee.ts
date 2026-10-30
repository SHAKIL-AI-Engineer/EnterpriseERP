import api from "../api";
import {
  firstApiErrorMessage,
  getHttpErrorMessage,
  unwrapApiData,
} from "@/lib/api-response";
import { ensureFullPageItems } from "@/lib/pagination/fetch-all";
import { buildPaginationParams } from "@/lib/pagination/params";
import type { LegacyPagedResult } from "@/lib/pagination/types";
import { toLegacyPagedResult, unwrapPaginatedApiData } from "@/lib/pagination/unwrap";
import type {
  HrEmployeeDetails,
  HrEmployeeListItem,
  HrManpowerListItem,
  HrManpowerSummary,
  HrPagedResult,
  HrStatusHistoryItem,
  HrTransferItem,
} from "@/lib/services/hr-types";
import { companyService } from "@/lib/services/company";
import {
  organogramService,
  resolveDepartmentGuid,
  resolveDesignationGuid,
  resolveGroupGuid,
  resolveSectionGuid,
  resolveShiftGuid,
} from "@/lib/services/organogram";
import { shiftService } from "@/lib/services/shift";

export type {
  HrEmployeeDetails,
  HrEmployeeAddress,
  HrEmployeeBankAccount,
  HrEmergencyContact,
  HrEmployeeDocument,
  HrStatusHistoryItem,
  HrTransferItem,
} from "@/lib/services/hr-types";

type PagedResult<T> = HrPagedResult<T>;

function stableIntFromGuid(guid: string): number {
  const hex = guid.replace(/-/g, "").slice(0, 8);
  const n = parseInt(hex, 16);
  return Number.isFinite(n) ? n | 0 : 0;
}

function isGuid(value: string | undefined | null): value is string {
  return (
    !!value &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      value,
    )
  );
}

const HR_EMPLOYEE_ID_MAX_LENGTH = 32;

/** Empty = auto-generate on server (EMP-0001, …). Any non-whitespace code up to 32 chars is allowed. */
export function normalizeHrEmployeeId(
  raw?: string | null,
): string | undefined {
  const trimmed = raw?.trim();
  if (!trimmed) return undefined;
  return trimmed;
}

export function isValidHrEmployeeId(raw?: string | null): boolean {
  const normalized = normalizeHrEmployeeId(raw);
  if (!normalized) return true;
  if (normalized.length > HR_EMPLOYEE_ID_MAX_LENGTH) return false;
  return !/\s/.test(normalized);
}

async function listCompaniesForResolve() {
  try {
    return await companyService.getMine();
  } catch {
    return await companyService.getAll();
  }
}

async function resolveCompanyGuid(
  companyId?: number,
): Promise<string | undefined> {
  if (!companyId) return undefined;
  const companies = await listCompaniesForResolve();
  return companies.find((c) => c.id === companyId)?.entityId;
}

async function firstCompanyGuid(): Promise<string | undefined> {
  return (await listCompaniesForResolve())[0]?.entityId;
}

async function resolveEmployeeGuid(
  employeeIdOrGuid: string,
  companyId?: number,
): Promise<string> {
  if (isGuid(employeeIdOrGuid)) return employeeIdOrGuid;
  const page = await fetchHrEmployeesPage({
    searchTerm: employeeIdOrGuid,
    companyId,
    pageSize: 50,
  });
  const needle = String(employeeIdOrGuid).toLowerCase();
  const match =
    page.items.find((e) => e.employeeID === employeeIdOrGuid) ??
    page.items.find((e) => String(e.employeeID).toLowerCase() === needle) ??
    page.items.find((e) => String(e.punchNumber) === employeeIdOrGuid);
  if (!match) {
    throw new Error("Employee not found.");
  }
  return match.id;
}

function mapHrListItemToEmployee(row: HrEmployeeListItem): Employee {
  return {
    id: stableIntFromGuid(row.id),
    entityId: row.id,
    employeeId: row.employeeID,
    punchNumber: row.punchNumber,
    fullNameEn: row.fullName,
    departmentId: 0,
    designationId: 0,
    departmentName: row.departmentName ?? undefined,
    designationName: row.designationName ?? undefined,
    status: row.status,
    joinDate: row.joinDate ?? "",
    gender: row.gender ?? undefined,
    religion: row.religion ?? undefined,
    bloodGroup: row.bloodGroup ?? undefined,
    isOtEnabled: row.isOtEnabled ?? false,
    phoneNumber: row.phone ?? undefined,
    isActive: row.status === "Active",
    createdAt: "",
    companyId: stableIntFromGuid(row.companyId),
    companyEntityId: row.companyId,
    email: row.email ?? undefined,
  };
}

function mapHrListItemToSimple(row: HrEmployeeListItem): EmployeeSimple {
  return {
    id: stableIntFromGuid(row.id),
    entityId: row.id,
    employeeId: row.employeeID,
    punchNumber: row.punchNumber,
    fullNameEn: row.fullName,
    companyId: stableIntFromGuid(row.companyId),
    companyEntityId: row.companyId,
    status: row.status,
  };
}

function mapHrListItemToMini(row: HrEmployeeListItem): EmployeeMini {
  return {
    id: stableIntFromGuid(row.id),
    entityId: row.id,
    employeeId: row.employeeID,
    punchNumber: row.punchNumber,
    fullNameEn: row.fullName,
  };
}

type EmployeeAddressEntityId = string | number;

async function fetchHrEmployeeDetails(
  entityId: string,
): Promise<HrEmployeeDetails> {
  const response = await api.get<unknown>(
    `hr/Employees/${encodeURIComponent(entityId)}`,
  );
  const data = unwrapApiData<HrEmployeeDetails>(response.data);
  return {
    ...data,
    addresses: data.addresses ?? [],
    bankAccounts: data.bankAccounts ?? [],
    emergencyContacts: data.emergencyContacts ?? [],
    documents: data.documents ?? [],
  };
}

function mapHrManpowerToEmployee(row: HrManpowerListItem): Employee {
  return {
    id: stableIntFromGuid(row.id),
    entityId: row.id,
    employeeId: row.employeeID,
    punchNumber: row.punchNumber,
    fullNameEn: row.fullName,
    departmentId: 0,
    designationId: 0,
    departmentName: row.departmentName ?? undefined,
    sectionName: row.sectionName ?? undefined,
    designationName: row.designationName ?? undefined,
    status: row.status,
    joinDate: row.joinDate,
    phoneNumber: row.phone ?? undefined,
    grossSalary: row.grossSalary,
    religion: row.religion ?? undefined,
    bloodGroup: row.bloodGroup ?? undefined,
    isActive: row.status === "Active",
    isOtEnabled: row.isOtEnabled ?? false,
    createdAt: "",
  };
}

function mapPrimaryBankAccount(
  account?: HrEmployeeDetails["bankAccounts"][number],
) {
  if (!account) return {}
  const isMcash = account.mobileBankingType === "mCash Account"
  return {
    bankName: account.bankName ?? undefined,
    bankBranchName: account.branchName ?? undefined,
    bankAccountNo: isMcash
      ? account.mobileBankingNo ?? undefined
      : account.accountNo ?? undefined,
    bankRoutingNo: account.routingNo ?? undefined,
    bankAccountType:
      account.mobileBankingType ??
      (account.bankName ? "Bank Account" : undefined),
  }
}

function buildBankAccountPayload(data: CreateEmployeeDto) {
  const isMcash = data.bankAccountType === "mCash Account"
  if (isMcash) {
    return {
      bankName: undefined as string | undefined,
      branchName: undefined as string | undefined,
      accountNo: undefined as string | undefined,
      routingNo: undefined as string | undefined,
      mobileBankingType: "mCash Account",
      mobileBankingNo: data.bankAccountNo,
      isPrimary: true,
    }
  }

  return {
    bankName: data.bankName,
    branchName: data.bankBranchName,
    accountNo: data.bankAccountNo,
    routingNo: undefined as string | undefined,
    mobileBankingType: data.bankAccountType || "Bank Account",
    mobileBankingNo: undefined as string | undefined,
    isPrimary: true,
  }
}

function mapHrDetailsToEmployee(row: HrEmployeeDetails): Employee {
  const primaryBank = mapPrimaryBankAccount(
    row.bankAccounts?.find((b) => b.isPrimary),
  )
  return {
    id: stableIntFromGuid(row.id),
    entityId: row.id,
    employeeId: row.employeeID,
    punchNumber: row.punchNumber,
    fullNameEn: row.fullName,
    fullNameBn: row.banglaName ?? undefined,
    nid: row.nationalId ?? undefined,
    dateOfBirth: row.dateOfBirth ?? undefined,
    gender: row.gender ?? undefined,
    religion: row.religion ?? undefined,
    bloodGroup: row.bloodGroup ?? undefined,
    email: row.email ?? undefined,
    phoneNumber: row.phone ?? undefined,
    departmentId: row.currentJobInfo?.departmentId
      ? stableIntFromGuid(row.currentJobInfo.departmentId)
      : 0,
    departmentName: row.currentJobInfo?.departmentName ?? undefined,
    sectionId: row.currentJobInfo?.sectionId
      ? stableIntFromGuid(row.currentJobInfo.sectionId)
      : undefined,
    sectionName: row.currentJobInfo?.sectionName ?? undefined,
    designationId: row.currentJobInfo?.designationId
      ? stableIntFromGuid(row.currentJobInfo.designationId)
      : 0,
    designationName: row.currentJobInfo?.designationName ?? undefined,
    lineName: row.currentJobInfo?.workLocation ?? undefined,
    groupId: row.currentJobInfo?.groupId
      ? stableIntFromGuid(row.currentJobInfo.groupId)
      : undefined,
    groupName: row.currentJobInfo?.groupName ?? undefined,
    status: row.status,
    joinDate: row.joinDate,
    basicSalary: row.currentSalaryInfo?.basicSalary,
    houseRent: row.currentSalaryInfo?.houseRent,
    medicalAllowance: row.currentSalaryInfo?.medicalAllowance,
    conveyance: row.currentSalaryInfo?.conveyanceAllowance,
    foodAllowance: row.currentSalaryInfo?.foodAllowance,
    grossSalary: row.currentSalaryInfo?.grossSalary,
    isActive: row.status === "Active",
    isOtEnabled: row.isOtEnabled ?? false,
    createdAt: "",
    companyId: stableIntFromGuid(row.companyId),
    companyEntityId: row.companyId,
    presentAddress:
      row.addresses?.find((a) => a.addressType === "Present")?.addressLine ??
      undefined,
    presentDivisionName:
      row.addresses?.find((a) => a.addressType === "Present")?.division ?? undefined,
    presentDistrictName:
      row.addresses?.find((a) => a.addressType === "Present")?.district ?? undefined,
    presentUpazilaName:
      row.addresses?.find((a) => a.addressType === "Present")?.upazila ?? undefined,
    presentPostOfficeName:
      row.addresses?.find((a) => a.addressType === "Present")?.postOffice ?? undefined,
    presentPostalCode:
      row.addresses?.find((a) => a.addressType === "Present")?.postalCode ?? undefined,
    permanentAddress:
      row.addresses?.find((a) => a.addressType === "Permanent")?.addressLine ??
      undefined,
    permanentDivisionName:
      row.addresses?.find((a) => a.addressType === "Permanent")?.division ?? undefined,
    permanentDistrictName:
      row.addresses?.find((a) => a.addressType === "Permanent")?.district ?? undefined,
    permanentUpazilaName:
      row.addresses?.find((a) => a.addressType === "Permanent")?.upazila ?? undefined,
    permanentPostOfficeName:
      row.addresses?.find((a) => a.addressType === "Permanent")?.postOffice ?? undefined,
    permanentPostalCode:
      row.addresses?.find((a) => a.addressType === "Permanent")?.postalCode ?? undefined,
    profileImageUrl:
      row.documents?.find((d) => d.documentType === "Profile Image")?.fileUrl ??
      undefined,
    signatureImageUrl:
      row.documents?.find((d) => d.documentType === "Signature")?.fileUrl ??
      undefined,
    bankName: primaryBank.bankName,
    bankBranchName: primaryBank.bankBranchName,
    bankAccountNo: primaryBank.bankAccountNo,
    bankRoutingNo: primaryBank.bankRoutingNo,
    bankAccountType: primaryBank.bankAccountType,
    emergencyContactName: row.emergencyContacts?.[0]?.contactName,
    emergencyContactRelation: row.emergencyContacts?.[0]?.relation ?? undefined,
    emergencyContactPhone: row.emergencyContacts?.[0]?.phone,
    emergencyContactAddress: row.emergencyContacts?.[0]?.address ?? undefined,
    fatherNameEn: row.fatherNameEn ?? undefined,
    fatherNameBn: row.fatherNameBn ?? undefined,
    motherNameEn: row.motherNameEn ?? undefined,
    motherNameBn: row.motherNameBn ?? undefined,
    maritalStatus: row.maritalStatus ?? undefined,
    spouseNameEn: row.spouseNameEn ?? undefined,
    spouseNameBn: row.spouseNameBn ?? undefined,
    spouseOccupation: row.spouseOccupation ?? undefined,
    spouseContact: row.spouseContact ?? undefined,
    educationLevel: row.educationLevel ?? undefined,
    institution: row.institution ?? undefined,
    fieldOfStudy: row.fieldOfStudy ?? undefined,
    skills: row.skills ?? undefined,
    reference1Name: row.reference1Name ?? undefined,
    reference1Relation: row.reference1Relation ?? undefined,
    reference1Phone: row.reference1Phone ?? undefined,
    reference1Address: row.reference1Address ?? undefined,
    reference2Name: row.reference2Name ?? undefined,
    reference2Relation: row.reference2Relation ?? undefined,
    reference2Phone: row.reference2Phone ?? undefined,
    reference2Address: row.reference2Address ?? undefined,
    documents: row.documents ?? [],
  };
}

async function enrichEmployeeShift(employee: Employee): Promise<Employee> {
  if (!employee.entityId || !employee.companyEntityId) return employee;

  try {
    const assignment = await shiftService.getCurrentAssignment(
      employee.entityId,
      employee.companyEntityId,
    );
    return {
      ...employee,
      shiftId: stableIntFromGuid(assignment.shiftId),
      shiftName: assignment.shiftName,
    };
  } catch {
    return employee;
  }
}

async function upsertAddress(
  employeeId: string,
  existing: HrEmployeeDetails["addresses"],
  addressType: "Present" | "Permanent",
  payload: {
    country: string;
    division?: string;
    district?: string;
    upazila?: string;
    postOffice?: string;
    postalCode?: string;
    addressLine?: string;
  },
  companyId?: number,
) {
  const hasData =
    payload.addressLine ||
    payload.division ||
    payload.district ||
    payload.upazila ||
    payload.postOffice ||
    payload.postalCode;

  const row = existing.find(
    (a) => a.addressType.toLowerCase() === addressType.toLowerCase(),
  );
  if (!hasData) {
    if (row) await employeeService.deleteAddress(row.id);
    return;
  }

  const body = { addressType, ...payload };
  if (row) {
    await employeeService.updateAddress(row.id, body);
  } else {
    await employeeService.addAddress(employeeId, { ...body, companyId });
  }
}

function isServerUploadedEmployeeImage(url: string) {
  const normalized = url.trim().toLowerCase()
  return normalized.startsWith("/uploads/employees/")
}

async function syncEmployeeImageDocuments(
  employeeId: string,
  documents: HrEmployeeDetails["documents"],
  data: { profileImageUrl?: string; signatureImageUrl?: string },
) {
  const upsertDoc = async (documentType: string, fileUrl?: string) => {
    const trimmed = fileUrl?.trim()
    const existing = documents.find((d) => d.documentType === documentType)
    if (!trimmed) {
      if (existing) await employeeService.deleteDocument(existing.id)
      return
    }
    if (existing?.fileUrl === trimmed) return
    if (existing && isServerUploadedEmployeeImage(existing.fileUrl)) return
    if (existing) await employeeService.deleteDocument(existing.id)
    await employeeService.addDocument(employeeId, {
      documentType,
      fileUrl: trimmed,
    })
  }

  await upsertDoc("Profile Image", data.profileImageUrl)
  await upsertDoc("Signature", data.signatureImageUrl)
}

function employeeProfilePayload(data: CreateEmployeeDto) {
  return {
    religion: data.religion || null,
    bloodGroup: data.bloodGroup || null,
    fatherNameEn: data.fatherNameEn || null,
    fatherNameBn: data.fatherNameBn || null,
    motherNameEn: data.motherNameEn || null,
    motherNameBn: data.motherNameBn || null,
    maritalStatus: data.maritalStatus || null,
    spouseNameEn: data.spouseNameEn || null,
    spouseNameBn: data.spouseNameBn || null,
    spouseOccupation: data.spouseOccupation || null,
    spouseContact: data.spouseContact || null,
    educationLevel: data.educationLevel || null,
    institution: data.institution || null,
    fieldOfStudy: data.fieldOfStudy || null,
    skills: data.skills || null,
    reference1Name: data.reference1Name || null,
    reference1Relation: data.reference1Relation || null,
    reference1Phone: data.reference1Phone || null,
    reference1Address: data.reference1Address || null,
    reference2Name: data.reference2Name || null,
    reference2Relation: data.reference2Relation || null,
    reference2Phone: data.reference2Phone || null,
    reference2Address: data.reference2Address || null,
  }
}

async function resolveWorkLocation(
  data: CreateEmployeeDto,
): Promise<string | undefined> {
  if (!data.lineId && !data.lineName) return undefined;

  let workLocation = data.lineName;
  if (data.lineId && data.sectionId) {
    const lines = await organogramService.getLines({ sectionId: data.sectionId });
    workLocation =
      lines.find((line) => line.id === data.lineId)?.nameEn ?? workLocation;
  }

  const trimmed = workLocation?.trim();
  return trimmed || undefined;
}

async function syncEmployeePlacement(
  employeeId: string,
  data: CreateEmployeeDto,
  existing?: HrEmployeeDetails,
) {
  const workLocation = await resolveWorkLocation(data);
  const currentJob = existing?.currentJobInfo;
  const currentDept = currentJob?.departmentId
    ? stableIntFromGuid(currentJob.departmentId)
    : 0;
  const currentSection = currentJob?.sectionId
    ? stableIntFromGuid(currentJob.sectionId)
    : 0;
  const currentDesignation = currentJob?.designationId
    ? stableIntFromGuid(currentJob.designationId)
    : 0;
  const currentLine = currentJob?.workLocation?.trim().toLowerCase() ?? "";
  const nextLine = workLocation?.trim().toLowerCase() ?? "";
  const nextGroupGuid = data.groupId
    ? await resolveGroupGuid(data.groupId, data.companyId)
    : null;
  const currentGroupGuid = currentJob?.groupId ?? null;
  const groupChanged = (currentGroupGuid ?? null) !== (nextGroupGuid ?? null);

  const placementChanged =
    currentDept !== (data.departmentId ?? 0) ||
    currentSection !== (data.sectionId ?? 0) ||
    currentDesignation !== (data.designationId ?? 0) ||
    groupChanged ||
    currentLine !== nextLine;

  if (!placementChanged) return;

  await employeeService.transferEmployee(employeeId, {
    departmentId: data.departmentId,
    sectionId: data.sectionId,
    designationId: data.designationId,
    groupGuid: nextGroupGuid,
    workLocation,
    effectiveFrom: data.joinDate || new Date().toISOString(),
    companyId: data.companyId,
  });
}

function normalizeGuid(value: string): string {
  return value.trim().toLowerCase();
}

async function syncEmployeeShift(
  employeeId: string,
  data: CreateEmployeeDto,
  options?: { isUpdate?: boolean },
) {
  if (!data.shiftId || !data.companyId) return;

  const companyGuid = await resolveCompanyGuid(data.companyId);
  if (!companyGuid) {
    throw new Error("Company could not be resolved for shift assignment.");
  }

  const shiftGuid = await resolveShiftGuid(data.shiftId, data.companyId);
  if (!shiftGuid) {
    throw new Error("Selected shift could not be resolved. Please re-select the shift.");
  }

  const normalizedShiftGuid = normalizeGuid(shiftGuid);

  try {
    const current = await shiftService.getCurrentAssignment(employeeId, companyGuid);
    if (normalizeGuid(current.shiftId) === normalizedShiftGuid) return;
  } catch {
    // No current shift assignment; create one below.
  }

  const effectiveFrom = options?.isUpdate
    ? new Date().toISOString()
    : data.joinDate || new Date().toISOString();

  await shiftService.assignEmployeeShift({
    companyId: companyGuid,
    employeeId,
    shiftId: shiftGuid,
    effectiveFrom,
    effectiveTo: null,
  });
}

async function syncEmployeeSubResources(
  employeeId: string,
  data: CreateEmployeeDto,
  existing?: HrEmployeeDetails,
) {
  const details = existing ?? (await fetchHrEmployeeDetails(employeeId));

  await upsertAddress(
    employeeId,
    details.addresses,
    "Present",
    {
      country: "Bangladesh",
      division: data.presentDivision,
      district: data.presentDistrict,
      upazila: data.presentUpazila,
      postOffice: data.presentPostOffice,
      postalCode: data.presentPostalCode,
      addressLine: data.presentAddress,
    },
    data.companyId,
  );

  await upsertAddress(
    employeeId,
    details.addresses,
    "Permanent",
    {
      country: "Bangladesh",
      division: data.permanentDivision,
      district: data.permanentDistrict,
      upazila: data.permanentUpazila,
      postOffice: data.permanentPostOffice,
      postalCode: data.permanentPostalCode,
      addressLine: data.permanentAddress,
    },
    data.companyId,
  );

  await syncEmployeeImageDocuments(employeeId, details.documents, {
    profileImageUrl: data.profileImageUrl,
    signatureImageUrl: data.signatureImageUrl,
  });

  await syncEmployeePlacement(employeeId, data, existing);
  await syncEmployeeShift(employeeId, data, { isUpdate: !!existing });

  const hasBank =
    data.bankAccountNo ||
    data.bankName ||
    data.bankBranchName ||
    data.bankAccountType === "mCash Account";
  const primary =
    details.bankAccounts.find((b) => b.isPrimary) ?? details.bankAccounts[0];
  if (!hasBank) {
    if (primary) await employeeService.deleteBankAccount(primary.id);
  } else {
    const bankBody = buildBankAccountPayload(data);
    if (primary) {
      await employeeService.updateBankAccount(primary.id, bankBody);
    } else {
      await employeeService.addBankAccount(employeeId, {
        ...bankBody,
        companyId: data.companyId,
      });
    }
  }

  const hasEmergency = data.emergencyContactName || data.emergencyContactPhone;
  const contact = details.emergencyContacts[0];
  if (!hasEmergency) {
    if (contact) await employeeService.deleteEmergencyContact(contact.id);
  } else {
    const contactBody = {
      contactName: data.emergencyContactName || "Emergency Contact",
      relation: data.emergencyContactRelation,
      phone: data.emergencyContactPhone || "",
      address: data.emergencyContactAddress,
    };
    if (contact) {
      await employeeService.updateEmergencyContact(contact.id, contactBody);
    } else {
      await employeeService.addEmergencyContact(employeeId, {
        ...contactBody,
        companyId: data.companyId,
      });
    }
  }
}

function needsManpowerListApi(params?: {
  sectionId?: number;
  designationId?: number;
  gender?: string;
  religion?: string;
  joinDateFrom?: string;
  joinDateTo?: string;
}): boolean {
  if (!params) return false;
  if (params.sectionId !== undefined) return true;
  if (params.designationId !== undefined) return true;
  if (params.gender && params.gender.toLowerCase() !== "all") return true;
  if (params.religion && params.religion.toLowerCase() !== "all") return true;
  if (params.joinDateFrom || params.joinDateTo) return true;
  return false;
}

async function fetchHrEmployeesPage(params?: {
  page?: number;
  pageSize?: number;
  getAll?: boolean;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  searchTerm?: string;
  employeeId?: string;
  companyId?: number;
  companyEntityId?: string;
  departmentId?: number;
  sectionId?: number;
  designationId?: number;
  joinDateFrom?: string;
  joinDateTo?: string;
  status?: string;
  gender?: string;
  religion?: string;
}): Promise<PagedResult<HrEmployeeListItem>> {
  const companyGuid =
    params?.companyEntityId ??
    (await resolveCompanyGuid(params?.companyId));
  const departmentGuid = params?.departmentId
    ? await resolveDepartmentGuid(params.departmentId)
    : undefined;
  const sectionGuid = params?.sectionId
    ? await resolveSectionGuid(params.sectionId)
    : undefined;
  const designationGuid = params?.designationId
    ? await resolveDesignationGuid(params.designationId)
    : undefined;

  const response = await api.get("hr/Employees", {
    params: {
      ...buildPaginationParams({
        page: params?.page,
        pageSize: params?.pageSize,
        getAll: params?.getAll,
        sortBy: params?.sortBy,
        sortOrder: params?.sortOrder,
        filters: {
          search: params?.searchTerm,
          employeeId: params?.employeeId,
          companyId: companyGuid,
          departmentId: departmentGuid,
          sectionId: sectionGuid,
          designationId: designationGuid,
          joinDateFrom: params?.joinDateFrom,
          joinDateTo: params?.joinDateTo,
          status:
            params?.status && params.status.toLowerCase() !== "all"
              ? params.status
              : undefined,
          gender:
            params?.gender && params.gender.toLowerCase() !== "all"
              ? params.gender
              : undefined,
          religion:
            params?.religion && params.religion.toLowerCase() !== "all"
              ? params.religion
              : undefined,
        },
      }),
    },
  });
  const paginated = unwrapPaginatedApiData<HrEmployeeListItem>(response.data);
  const page = toLegacyPagedResult(paginated);

  if (!params?.getAll) {
    return page;
  }

  if (page.items.length >= page.totalCount) {
    return { ...page, getAll: true };
  }

  return ensureFullPageItems(page, (nextPage, nextPageSize) =>
    fetchHrEmployeesPage({
      ...params,
      page: nextPage,
      pageSize: nextPageSize,
      getAll: false,
    }),
  );
}

export type EmployeePage = PagedResult<Employee>;

export interface Employee {
  id: number;
  entityId?: string;
  employeeId: string;
  punchNumber?: number;
  fullNameEn: string;
  fullNameBn?: string;
  nid?: string;
  proximity?: string;
  dateOfBirth?: string;
  gender?: string;
  religion?: string;
  departmentId: number;
  departmentName?: string;
  sectionId?: number;
  sectionName?: string;
  designationId: number;
  designationName?: string;
  lineId?: number;
  lineName?: string;
  shiftId?: number;
  shiftName?: string;
  groupId?: number;
  groupName?: string;
  floorId?: number;
  floorName?: string;
  status: string;
  joinDate: string;
  profileImageUrl?: string;
  signatureImageUrl?: string;
  email?: string;
  phoneNumber?: string;
  presentAddress?: string;
  presentAddressBn?: string;
  presentDivisionId?: EmployeeAddressEntityId;
  presentDistrictId?: EmployeeAddressEntityId;
  presentThanaId?: EmployeeAddressEntityId;
  presentPostOfficeId?: EmployeeAddressEntityId;
  presentPostalCode?: string;
  presentDivisionName?: string;
  presentDistrictName?: string;
  presentUpazilaName?: string;
  presentPostOfficeName?: string;

  permanentAddress?: string;
  permanentAddressBn?: string;
  permanentDivisionId?: EmployeeAddressEntityId;
  permanentDistrictId?: EmployeeAddressEntityId;
  permanentThanaId?: EmployeeAddressEntityId;
  permanentPostOfficeId?: EmployeeAddressEntityId;
  permanentPostalCode?: string;
  permanentDivisionName?: string;
  permanentDistrictName?: string;
  permanentUpazilaName?: string;
  permanentPostOfficeName?: string;

  // Family Information
  fatherNameEn?: string;
  fatherNameBn?: string;
  motherNameEn?: string;
  motherNameBn?: string;
  maritalStatus?: string;
  spouseNameEn?: string;
  spouseNameBn?: string;
  spouseOccupation?: string;
  spouseContact?: string;

  // Education & Skills
  educationLevel?: string;
  institution?: string;
  fieldOfStudy?: string;
  skills?: string;

  // References
  reference1Name?: string;
  reference1Relation?: string;
  reference1Phone?: string;
  reference1Address?: string;
  reference2Name?: string;
  reference2Relation?: string;
  reference2Phone?: string;
  reference2Address?: string;

  // Salary Information
  basicSalary?: number;
  houseRent?: number;
  medicalAllowance?: number;
  conveyance?: number;
  foodAllowance?: number;
  otherAllowance?: number;
  grossSalary?: number;

  // Account Information
  bankName?: string;
  bankBranchName?: string;
  bankAccountNo?: string;
  bankRoutingNo?: string;
  bankAccountType?: string;

  // Emergency Contact Info
  emergencyContactName?: string;
  emergencyContactRelation?: string;
  emergencyContactPhone?: string;
  emergencyContactAddress?: string;
  companyId?: number;
  companyEntityId?: string;
  companyName?: string;
  bloodGroup?: string;

  isActive: boolean;
  isOtEnabled: boolean;
  createdAt: string;
  documents?: import("@/lib/services/hr-types").HrEmployeeDocument[];
}

/** Fields aligned with HR Service create + sub-resource APIs. */
export interface CreateEmployeeDto {
  employeeId?: string;
  punchNumber?: number;
  fullNameEn: string;
  fullNameBn?: string;
  nid?: string;
  dateOfBirth?: string;
  gender?: string;
  departmentId: number;
  sectionId?: number;
  designationId: number;
  lineId?: number;
  lineName?: string;
  groupId?: number;
  shiftId?: number;
  status: string;
  joinDate: string;
  email?: string;
  phoneNumber?: string;
  presentAddress?: string;
  presentDivision?: string;
  presentDistrict?: string;
  presentUpazila?: string;
  presentPostOffice?: string;
  presentPostalCode?: string;
  presentDivisionName?: string;
  presentDistrictName?: string;
  presentUpazilaName?: string;
  presentPostOfficeName?: string;
  permanentAddress?: string;
  permanentDivision?: string;
  permanentDistrict?: string;
  permanentUpazila?: string;
  permanentPostOffice?: string;
  permanentPostalCode?: string;
  permanentDivisionName?: string;
  permanentDistrictName?: string;
  permanentUpazilaName?: string;
  permanentPostOfficeName?: string;
  basicSalary?: number;
  houseRent?: number;
  medicalAllowance?: number;
  conveyance?: number;
  foodAllowance?: number;
  grossSalary?: number;
  profileImageUrl?: string;
  signatureImageUrl?: string;
  bankName?: string;
  bankBranchName?: string;
  bankAccountNo?: string;
  bankRoutingNo?: string;
  bankAccountType?: string;
  emergencyContactName?: string;
  emergencyContactRelation?: string;
  emergencyContactPhone?: string;
  emergencyContactAddress?: string;
  companyId?: number;
  religion?: string;
  bloodGroup?: string;
  fatherNameEn?: string;
  fatherNameBn?: string;
  motherNameEn?: string;
  motherNameBn?: string;
  maritalStatus?: string;
  spouseNameEn?: string;
  spouseNameBn?: string;
  spouseOccupation?: string;
  spouseContact?: string;
  educationLevel?: string;
  institution?: string;
  fieldOfStudy?: string;
  skills?: string;
  reference1Name?: string;
  reference1Relation?: string;
  reference1Phone?: string;
  reference1Address?: string;
  reference2Name?: string;
  reference2Relation?: string;
  reference2Phone?: string;
  reference2Address?: string;
  isOtEnabled?: boolean;
}

export interface ManpowerSummary {
  totalEmployees: number;
  activeEmployees: number;
  onLeaveEmployees: number;
  inactiveEmployees: number;
  departmentSummary: SummaryItem[];
  designationSummary: SummaryItem[];
  genderSummary: SummaryItem[];
  statusSummary: SummaryItem[];
}

export interface SummaryItem {
  id: string | number;
  name: string;
  count: number;
  percentage: number;
}

export type ManpowerFilterParams = {
  departmentId?: number;
  sectionId?: number;
  designationId?: number;
  status?: string;
  searchTerm?: string;
  companyId?: number;
  joinDateFrom?: string;
  joinDateTo?: string;
  gender?: string;
  religion?: string;
};

function mapSummaryBucket(row: HrManpowerSummary["departmentSummary"][number]): SummaryItem {
  return {
    id: row.id ?? row.name,
    name: row.name,
    count: row.count,
    percentage: Number(row.percentage),
  };
}

async function buildManpowerQueryParams(
  params?: ManpowerFilterParams,
  options?: {
    paging?: boolean;
    summary?: boolean;
    page?: number;
    pageSize?: number;
    getAll?: boolean;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
  },
): Promise<Record<string, string | number | boolean>> {
  const query: Record<string, string | number | boolean> = {};

  if (options?.paging !== false) {
    Object.assign(
      query,
      buildPaginationParams({
        page: options?.page,
        pageSize: options?.pageSize,
        getAll: options?.getAll,
        sortBy: options?.sortBy,
        sortOrder: options?.sortOrder,
      }),
    );
  }

  if (params?.searchTerm?.trim()) {
    query.search = params.searchTerm.trim();
  }

  if (params?.status && params.status.toLowerCase() !== "all") {
    query.status = params.status;
  }

  if (params?.companyId !== undefined) {
    const company = (await companyService.getAll()).find(
      (c) => c.id === params.companyId,
    );
    if (company?.entityId) {
      query.companyId = company.entityId;
    }
  }

  if (params?.departmentId !== undefined) {
    const departmentId = await resolveDepartmentGuid(params.departmentId);
    if (departmentId) query.departmentId = departmentId;
  }

  if (params?.sectionId !== undefined) {
    const sectionId = await resolveSectionGuid(params.sectionId);
    if (sectionId) query.sectionId = sectionId;
  }

  if (params?.designationId !== undefined) {
    const designationId = await resolveDesignationGuid(params.designationId);
    if (designationId) query.designationId = designationId;
  }

  if (params?.gender && params.gender.toLowerCase() !== "all") {
    query.gender = params.gender;
  }

  if (params?.religion && params.religion.toLowerCase() !== "all") {
    query.religion = params.religion;
  }

  if (options?.summary) {
    if (params?.joinDateFrom) {
      query.joinDateFrom = params.joinDateFrom;
    }
    if (params?.joinDateTo) {
      query.joinDateTo = params.joinDateTo;
    }
  }

  return query;
}

export interface UpdateEmployeeDto extends CreateEmployeeDto {
  isActive: boolean;
  isOtEnabled?: boolean;
}

export interface EmployeeMini {
  id: number;
  entityId?: string;
  employeeId: string;
  punchNumber?: number;
  fullNameEn: string;
  departmentName?: string;
  sectionName?: string;
  designationName?: string;
  lineName?: string;
  shiftName?: string;
  groupName?: string;
}

export interface EmployeeSimple {
  id: number;
  entityId?: string;
  employeeId: string;
  punchNumber?: number;
  fullNameEn: string;
  companyId?: number;
  companyEntityId?: string;
  companyName?: string;
  departmentName?: string;
  designationName?: string;
  sectionName?: string;
  lineName?: string;
  gender?: string;
  religion?: string;
  shiftName?: string;
  status?: string;
  groupName?: string;
  floorName?: string;
}

export const employeeService = {
  getEmployeesByEntityIds: async (ids: string[]) => {
    const unique = Array.from(
      new Set((ids ?? []).map((x) => String(x).trim()).filter(Boolean)),
    );
    if (unique.length === 0) return [];

    const response = await api.post<unknown>("hr/Employees/batch", {
      ids: unique,
    });
    const rows = unwrapApiData<HrEmployeeListItem[]>(response.data) ?? [];
    return rows.map(mapHrListItemToEmployee);
  },

  getEmployeesPage: async (params?: {
    page?: number;
    pageSize?: number;
    getAll?: boolean;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
    departmentId?: number;
    sectionId?: number;
    designationId?: number;
    lineId?: number;
    shiftId?: number;
    groupId?: number;
    floorId?: number;
    status?: string;
    isActive?: boolean;
    searchTerm?: string;
    companyId?: number;
    companyName?: string;
    joinDateFrom?: string;
    joinDateTo?: string;
    gender?: string;
    religion?: string;
    employeeId?: string;
  }): Promise<EmployeePage> => {
    const listParams = {
      page: params?.page ?? 1,
      pageSize: params?.pageSize,
      getAll: params?.getAll,
      sortBy: params?.sortBy,
      sortOrder: params?.sortOrder,
      searchTerm: params?.searchTerm,
      employeeId: params?.employeeId,
      companyId: params?.companyId,
      departmentId: params?.departmentId,
      sectionId: params?.sectionId,
      designationId: params?.designationId,
      status: params?.status,
      gender: params?.gender,
      religion: params?.religion,
      joinDateFrom: params?.joinDateFrom,
      joinDateTo: params?.joinDateTo,
    };

    if (
      needsManpowerListApi(listParams) ||
      listParams.sectionId !== undefined ||
      listParams.designationId !== undefined
    ) {
      const page = await employeeService.getManpowerPage(listParams);
      return page;
    }

    const page = await fetchHrEmployeesPage({
      page: listParams.page,
      pageSize: listParams.pageSize,
      getAll: listParams.getAll,
      sortBy: listParams.sortBy,
      sortOrder: listParams.sortOrder,
      searchTerm: listParams.searchTerm,
      employeeId: listParams.employeeId,
      companyId: listParams.companyId,
      departmentId: listParams.departmentId,
      sectionId: listParams.sectionId,
      designationId: listParams.designationId,
      joinDateFrom: listParams.joinDateFrom,
      joinDateTo: listParams.joinDateTo,
      status: listParams.status,
      gender: listParams.gender,
      religion: listParams.religion,
    });
    return {
      ...page,
      items: page.items.map(mapHrListItemToEmployee),
    };
  },

  getEmployeesSimple: async (params?: {
    departmentId?: number;
    sectionId?: number;
    designationId?: number;
    lineId?: number;
    shiftId?: number;
    groupId?: number;
    floorId?: number;
    status?: string;
    isActive?: boolean;
    searchTerm?: string;
    companyId?: number;
    companyName?: string;
  }) => {
    const page = await fetchHrEmployeesPage({
      searchTerm: params?.searchTerm,
      companyId: params?.companyId,
      status: params?.status,
      pageSize: 10,
    });
    return page.items.map(mapHrListItemToSimple);
  },

  getEmployees: async (params?: {
    departmentId?: number;
    sectionId?: number;
    designationId?: number;
    lineId?: number;
    shiftId?: number;
    groupId?: number;
    floorId?: number;
    status?: string;
    isActive?: boolean;
    searchTerm?: string;
    companyId?: number;
    companyEntityId?: string;
    companyName?: string;
    joinDateFrom?: string;
    joinDateTo?: string;
    gender?: string;
    religion?: string;
    employeeId?: string;
  }) => {
    if (needsManpowerListApi(params)) {
      return employeeService.getManpower({
        departmentId: params?.departmentId,
        sectionId: params?.sectionId,
        designationId: params?.designationId,
        status: params?.status,
        searchTerm: params?.searchTerm ?? params?.employeeId,
        companyId: params?.companyId,
        joinDateFrom: params?.joinDateFrom,
        joinDateTo: params?.joinDateTo,
        gender: params?.gender,
        religion: params?.religion,
      });
    }

    const page = await fetchHrEmployeesPage({
      searchTerm: params?.searchTerm ?? params?.employeeId,
      companyId: params?.companyId,
      companyEntityId: params?.companyEntityId,
      departmentId: params?.departmentId,
      status: params?.status ?? (params?.isActive ? "Active" : undefined),
      gender: params?.gender,
      religion: params?.religion,
      pageSize: 10,
    });
    return page.items.map(mapHrListItemToEmployee);
  },

  getEmployeesMini: async (params?: {
    departmentId?: number;
    sectionId?: number;
    designationId?: number;
    lineId?: number;
    shiftId?: number;
    groupId?: number;
    searchTerm?: string;
  }) => {
    const page = await fetchHrEmployeesPage({
      searchTerm: params?.searchTerm,
      pageSize: 10,
    });
    return page.items.map(mapHrListItemToMini);
  },

  getEmployeeDetails: async (employeeId: string, companyId?: number) => {
    const id = isGuid(employeeId)
      ? employeeId
      : await resolveEmployeeGuid(employeeId, companyId);
    return fetchHrEmployeeDetails(id);
  },

  getEmployee: async (employeeId: string, companyId: number) => {
    const details = await employeeService.getEmployeeDetails(employeeId, companyId);
    return enrichEmployeeShift(mapHrDetailsToEmployee(details));
  },

  getEmployeeById: async (id: number) => {
    const page = await fetchHrEmployeesPage({ pageSize: 10 });
    const row = page.items.find(
      (employee) => stableIntFromGuid(employee.id) === id,
    );
    if (!row) throw new Error("Employee not found.");
    return enrichEmployeeShift(mapHrDetailsToEmployee(await fetchHrEmployeeDetails(row.id)));
  },

  createEmployee: async (data: CreateEmployeeDto) => {
    const companyId =
      (await resolveCompanyGuid(data.companyId)) ?? (await firstCompanyGuid());
    if (!companyId)
      throw new Error("Please select a company before creating an employee.");
    const departmentId = await resolveDepartmentGuid(data.departmentId);
    const sectionId = data.sectionId
      ? await resolveSectionGuid(data.sectionId)
      : undefined;
    const designationId = await resolveDesignationGuid(data.designationId);
    const groupId = data.groupId
      ? await resolveGroupGuid(data.groupId, data.companyId)
      : undefined;
    if (!departmentId || !designationId) {
      throw new Error("Department and designation are required.");
    }
    if (!data.punchNumber || data.punchNumber <= 0) {
      throw new Error("Punch number (device badge) is required and must be a positive integer.");
    }
    const employeeID = normalizeHrEmployeeId(data.employeeId);
    if (employeeID && !isValidHrEmployeeId(employeeID)) {
      throw new Error(
        "Employee ID must be 1-32 characters without spaces, or leave empty to auto-generate.",
      );
    }
    const workLocation = await resolveWorkLocation(data);
    try {
      const response = await api.post<unknown>("hr/Employees", {
        companyId,
        punchNumber: data.punchNumber,
        employeeID: employeeID ?? null,
        fullName: data.fullNameEn,
        banglaName: data.fullNameBn || null,
        gender: data.gender || null,
        dateOfBirth: data.dateOfBirth || null,
        nationalId: data.nid || null,
        birthCertificateNo: null,
        phone: data.phoneNumber || null,
        email: data.email || null,
        joinDate: data.joinDate,
        employmentType: data.status === "Probation" ? "Probation" : "Permanent",
        departmentId,
        sectionId: sectionId || null,
        designationId,
        gradeId: null,
        groupId: groupId || null,
        workLocation: workLocation || null,
        basicSalary: data.basicSalary ?? 0,
        houseRent: data.houseRent ?? 0,
        medicalAllowance: data.medicalAllowance ?? 0,
        conveyanceAllowance: data.conveyance ?? 0,
        foodAllowance: data.foodAllowance ?? 0,
        isOtEnabled: data.isOtEnabled ?? true,
        ...employeeProfilePayload(data),
      });
      const createdId = unwrapApiData<string>(response.data);
      await syncEmployeeSubResources(createdId, data);
      return createdId;
    } catch (error) {
      throw new Error(getHttpErrorMessage(error, "Failed to create employee"));
    }
  },

  updateEmployee: async (
    employeeId: string,
    data: UpdateEmployeeDto,
    companyId: number,
  ) => {
    const id = isGuid(employeeId)
      ? employeeId
      : await resolveEmployeeGuid(employeeId, companyId);

    try {
      await api.put(`hr/Employees/${encodeURIComponent(id)}`, {
        fullName: data.fullNameEn,
        banglaName: data.fullNameBn || null,
        gender: data.gender || null,
        dateOfBirth: data.dateOfBirth || null,
        nationalId: data.nid || null,
        birthCertificateNo: null,
        phone: data.phoneNumber || null,
        email: data.email || null,
        joinDate: data.joinDate,
        employmentType: data.status === "Probation" ? "Probation" : "Permanent",
        status: data.status || (data.isActive ? "Active" : "Inactive"),
        isOtEnabled: data.isOtEnabled ?? true,
        basicSalary: data.basicSalary ?? 0,
        houseRent: data.houseRent ?? 0,
        medicalAllowance: data.medicalAllowance ?? 0,
        conveyanceAllowance: data.conveyance ?? 0,
        foodAllowance: data.foodAllowance ?? 0,
        ...employeeProfilePayload(data),
      });

      const fresh = await fetchHrEmployeeDetails(id);
      await syncEmployeeSubResources(id, data, fresh);

      return { success: true };
    } catch (error) {
      throw new Error(getHttpErrorMessage(error, "Failed to update employee"));
    }
  },

  deleteEmployee: async (employeeId: string, companyId: number) => {
    const id = isGuid(employeeId)
      ? employeeId
      : await resolveEmployeeGuid(employeeId, companyId);
    const response = await api.delete(`hr/Employees/${encodeURIComponent(id)}`);
    return unwrapApiData<string>(response.data);
  },

  searchEmployees: async (query: string) => {
    return employeeService.getEmployees({ searchTerm: query });
  },

  exportEmployees: async (params?: {
    departmentId?: number;
    sectionId?: number;
    designationId?: number;
    lineId?: number;
    shiftId?: number;
    groupId?: number;
    floorId?: number;
    status?: string;
    isActive?: boolean;
    searchTerm?: string;
    companyId?: number;
    companyName?: string;
    joinDateFrom?: string;
    joinDateTo?: string;
    gender?: string;
    religion?: string;
    employeeId?: string;
  }) => {
    const rows = await employeeService.getEmployees(params);
    const header = [
      "Employee ID",
      "Full Name",
      "Email",
      "Phone",
      "Department",
      "Designation",
      "Join Date",
      "Status",
    ];
    const body = rows.map((e) =>
      [
        e.employeeId,
        e.fullNameEn,
        e.email ?? "",
        e.phoneNumber ?? "",
        e.departmentName ?? "",
        e.designationName ?? "",
        e.joinDate ? new Date(e.joinDate).toISOString().slice(0, 10) : "",
        e.status,
      ]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(","),
    );

    const url = window.URL.createObjectURL(
      new Blob([[header.join(","), ...body].join("\n")], {
        type: "text/csv;charset=utf-8",
      }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `Employee_List_${new Date().toISOString().slice(0, 10)}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  transferEmployee: async (
    employeeId: string,
    data: {
      departmentId?: number;
      sectionId?: number;
      designationId?: number;
      groupId?: number;
      groupGuid?: string | null;
      gradeId?: string;
      supervisorId?: string;
      workLocation?: string;
      reason?: string;
      effectiveFrom: string;
      companyId?: number;
    },
  ) => {
    const id = await resolveEmployeeGuid(employeeId, data.companyId);
    const resolvedGroupGuid =
      data.groupGuid !== undefined
        ? data.groupGuid
        : data.groupId
          ? await resolveGroupGuid(data.groupId, data.companyId)
          : null;
    await api.post(`hr/Employees/${encodeURIComponent(id)}/transfer`, {
      departmentId: data.departmentId
        ? await resolveDepartmentGuid(data.departmentId)
        : null,
      sectionId: data.sectionId
        ? await resolveSectionGuid(data.sectionId)
        : null,
      designationId: data.designationId
        ? await resolveDesignationGuid(data.designationId)
        : null,
      groupId: resolvedGroupGuid,
      gradeId: data.gradeId || null,
      supervisorId: data.supervisorId || null,
      workLocation: data.workLocation || null,
      reason: data.reason || null,
      effectiveFrom: data.effectiveFrom,
    });
    return { success: true };
  },

  getStatusHistory: async (employeeId: string, companyId?: number) => {
    const id = await resolveEmployeeGuid(employeeId, companyId);
    const response = await api.get<unknown>(
      `hr/Employees/${encodeURIComponent(id)}/status-history`,
    );
    return unwrapApiData<HrStatusHistoryItem[]>(response.data) ?? [];
  },

  getEmployeeTransfers: async (employeeId: string, companyId?: number) => {
    const id = isGuid(employeeId)
      ? employeeId
      : await resolveEmployeeGuid(employeeId, companyId);
    try {
      const response = await api.get<unknown>(
        `hr/Employees/${encodeURIComponent(id)}/transfers`,
      );
      return unwrapApiData<HrTransferItem[]>(response.data) ?? [];
    } catch {
      const paged = await employeeService.listTransfers({
        companyId,
        employeeId: id,
        pageSize: 10,
      });
      return paged?.items ?? [];
    }
  },

  listTransfers: async (params?: {
    companyId?: number;
    employeeId?: string;
    fromDate?: string;
    toDate?: string;
    page?: number;
    pageSize?: number;
    getAll?: boolean;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
  }) => {
    const companyGuid = params?.companyId
      ? (await companyService.getAll()).find((c) => c.id === params.companyId)
          ?.entityId
      : undefined;
    const pagination = buildPaginationParams({
      page: params?.page,
      pageSize: params?.pageSize,
      getAll: params?.getAll,
    });
    const response = await api.get<unknown>("hr/Employees/transfers", {
      params: {
        ...pagination,
        ...(companyGuid ? { companyId: companyGuid } : {}),
        ...(params?.employeeId ? { employeeId: params.employeeId } : {}),
        ...(params?.fromDate ? { fromDate: params.fromDate } : {}),
        ...(params?.toDate ? { toDate: params.toDate } : {}),
      },
    });
    const body = response.data;
    try {
      const paginated = unwrapPaginatedApiData<HrTransferItem>(body);
      let page: LegacyPagedResult<HrTransferItem> = toLegacyPagedResult(paginated);
      if (params?.getAll && page.items.length < page.totalCount) {
        page = await ensureFullPageItems(page, (nextPage, nextPageSize) =>
          employeeService.listTransfers({
            ...params,
            page: nextPage,
            pageSize: nextPageSize,
            getAll: false,
          }),
        );
      } else if (params?.getAll) {
        page = { ...page, getAll: true };
      }
      return page;
    } catch {
      return unwrapApiData<PagedResult<HrTransferItem>>(body);
    }
  },

  changeStatus: async (
    employeeId: string,
    data: {
      status: string;
      effectiveFrom: string;
      remarks?: string;
      companyId?: number;
    },
  ) => {
    const id = await resolveEmployeeGuid(employeeId, data.companyId);
    await api.post(`hr/Employees/${encodeURIComponent(id)}/status`, {
      status: data.status,
      effectiveFrom: data.effectiveFrom,
      remarks: data.remarks || null,
    });
    return { success: true };
  },

  updateSalary: async (
    employeeId: string,
    data: {
      basicSalary: number;
      houseRent: number;
      medicalAllowance: number;
      conveyanceAllowance: number;
      foodAllowance: number;
      effectiveFrom: string;
      companyId?: number;
    },
  ) => {
    const id = await resolveEmployeeGuid(employeeId, data.companyId);
    await api.post(`hr/Employees/${encodeURIComponent(id)}/salary`, {
      basicSalary: data.basicSalary,
      houseRent: data.houseRent,
      medicalAllowance: data.medicalAllowance,
      conveyanceAllowance: data.conveyanceAllowance,
      foodAllowance: data.foodAllowance,
      effectiveFrom: data.effectiveFrom,
    });
    return { success: true };
  },

  addAddress: async (
    employeeId: string,
    data: {
      addressType: string;
      country: string;
      division?: string;
      district?: string;
      upazila?: string;
      postOffice?: string;
      postalCode?: string;
      addressLine?: string;
      companyId?: number;
    },
  ) => {
    const id = await resolveEmployeeGuid(employeeId, data.companyId);
    await api.post(`hr/Employees/${encodeURIComponent(id)}/addresses`, data);
    return { success: true };
  },

  updateAddress: async (
    addressId: string,
    data: {
      addressType: string;
      country: string;
      division?: string;
      district?: string;
      upazila?: string;
      postOffice?: string;
      postalCode?: string;
      addressLine?: string;
    },
  ) => {
    await api.put(
      `hr/Employees/addresses/${encodeURIComponent(addressId)}`,
      data,
    );
    return { success: true };
  },

  deleteAddress: async (addressId: string) => {
    await api.delete(`hr/Employees/addresses/${encodeURIComponent(addressId)}`);
    return { success: true };
  },

  addBankAccount: async (
    employeeId: string,
    data: {
      bankName?: string;
      branchName?: string;
      accountNo?: string;
      routingNo?: string;
      mobileBankingType?: string;
      mobileBankingNo?: string;
      isPrimary: boolean;
      companyId?: number;
    },
  ) => {
    const id = await resolveEmployeeGuid(employeeId, data.companyId);
    await api.post(`hr/Employees/${encodeURIComponent(id)}/bank-accounts`, {
      bankName: data.bankName || null,
      branchName: data.branchName || null,
      accountNo: data.accountNo || null,
      routingNo: data.routingNo || null,
      mobileBankingType: data.mobileBankingType || null,
      mobileBankingNo: data.mobileBankingNo || null,
      isPrimary: data.isPrimary,
    });
    return { success: true };
  },

  updateBankAccount: async (
    accountId: string,
    data: {
      bankName?: string;
      branchName?: string;
      accountNo?: string;
      routingNo?: string;
      mobileBankingType?: string;
      mobileBankingNo?: string;
      isPrimary: boolean;
    },
  ) => {
    await api.put(
      `hr/Employees/bank-accounts/${encodeURIComponent(accountId)}`,
      data,
    );
    return { success: true };
  },

  deleteBankAccount: async (accountId: string) => {
    await api.delete(
      `hr/Employees/bank-accounts/${encodeURIComponent(accountId)}`,
    );
    return { success: true };
  },

  addEmergencyContact: async (
    employeeId: string,
    data: {
      contactName: string;
      relation?: string;
      phone: string;
      address?: string;
      companyId?: number;
    },
  ) => {
    const id = await resolveEmployeeGuid(employeeId, data.companyId);
    await api.post(
      `hr/Employees/${encodeURIComponent(id)}/emergency-contacts`,
      {
        contactName: data.contactName,
        relation: data.relation || null,
        phone: data.phone,
        address: data.address || null,
      },
    );
    return { success: true };
  },

  updateEmergencyContact: async (
    contactId: string,
    data: {
      contactName: string;
      relation?: string;
      phone: string;
      address?: string;
    },
  ) => {
    await api.put(
      `hr/Employees/emergency-contacts/${encodeURIComponent(contactId)}`,
      data,
    );
    return { success: true };
  },

  deleteEmergencyContact: async (contactId: string) => {
    await api.delete(
      `hr/Employees/emergency-contacts/${encodeURIComponent(contactId)}`,
    );
    return { success: true };
  },

  addDocument: async (
    employeeId: string,
    data: { documentType: string; fileUrl: string; companyId?: number },
  ) => {
    const id = await resolveEmployeeGuid(employeeId, data.companyId);
    await api.post(`hr/Employees/${encodeURIComponent(id)}/documents`, {
      documentType: data.documentType,
      fileUrl: data.fileUrl,
    });
    return { success: true };
  },

  deleteDocument: async (documentId: string) => {
    await api.delete(
      `hr/Employees/documents/${encodeURIComponent(documentId)}`,
    );
    return { success: true };
  },

  uploadProfilePicture: async (
    employeeEntityId: string,
    file: File,
    companyId?: number,
  ): Promise<{ success: boolean; message: string; imageUrl?: string }> => {
    try {
      const id = await resolveEmployeeGuid(employeeEntityId, companyId);
      const form = new FormData();
      form.append("file", file);
      const res = await api.post(
        `hr/Employees/${encodeURIComponent(id)}/profile-picture`,
        form,
      );
      const data = unwrapApiData<{ imageUrl: string }>(res.data);
      return { success: true, message: "Profile picture updated.", imageUrl: data.imageUrl };
    } catch (e: unknown) {
      const ax = e as { response?: { data?: unknown }; message?: string };
      return {
        success: false,
        message:
          firstApiErrorMessage(ax.response?.data) ||
          ax.message ||
          "Failed to upload profile picture.",
      };
    }
  },

  removeProfilePicture: async (
    employeeEntityId: string,
    companyId?: number,
  ): Promise<{ success: boolean; message: string }> => {
    try {
      const id = await resolveEmployeeGuid(employeeEntityId, companyId);
      await api.delete(
        `hr/Employees/${encodeURIComponent(id)}/profile-picture`,
      );
      return { success: true, message: "Profile picture removed." };
    } catch (e: unknown) {
      const ax = e as { response?: { data?: unknown }; message?: string };
      return {
        success: false,
        message:
          firstApiErrorMessage(ax.response?.data) ||
          ax.message ||
          "Failed to remove profile picture.",
      };
    }
  },

  uploadSignature: async (
    employeeEntityId: string,
    file: File,
    companyId?: number,
  ): Promise<{ success: boolean; message: string; imageUrl?: string }> => {
    try {
      const id = await resolveEmployeeGuid(employeeEntityId, companyId);
      const form = new FormData();
      form.append("file", file);
      const res = await api.post(
        `hr/Employees/${encodeURIComponent(id)}/signature`,
        form,
      );
      const data = unwrapApiData<{ imageUrl: string }>(res.data);
      return { success: true, message: "Signature updated.", imageUrl: data.imageUrl };
    } catch (e: unknown) {
      const ax = e as { response?: { data?: unknown }; message?: string };
      return {
        success: false,
        message:
          firstApiErrorMessage(ax.response?.data) ||
          ax.message ||
          "Failed to upload signature.",
      };
    }
  },

  removeSignature: async (
    employeeEntityId: string,
    companyId?: number,
  ): Promise<{ success: boolean; message: string }> => {
    try {
      const id = await resolveEmployeeGuid(employeeEntityId, companyId);
      await api.delete(`hr/Employees/${encodeURIComponent(id)}/signature`);
      return { success: true, message: "Signature removed." };
    } catch (e: unknown) {
      const ax = e as { response?: { data?: unknown }; message?: string };
      return {
        success: false,
        message:
          firstApiErrorMessage(ax.response?.data) ||
          ax.message ||
          "Failed to remove signature.",
      };
    }
  },

  getManpower: async (params?: ManpowerFilterParams) => {
    const query = await buildManpowerQueryParams(params, { paging: true });
    const response = await api.get<unknown>("hr/Employees/manpower", {
      params: query,
    });
    const paginated = unwrapPaginatedApiData<HrManpowerListItem>(response.data);
    return paginated.data.map(mapHrManpowerToEmployee);
  },

  getManpowerPage: async (
    params?: ManpowerFilterParams & {
      page?: number;
      pageSize?: number;
      getAll?: boolean;
      sortBy?: string;
      sortOrder?: "asc" | "desc";
    },
  ) => {
    const query = await buildManpowerQueryParams(params, {
      paging: true,
      page: params?.page ?? 1,
      pageSize: params?.pageSize,
      getAll: params?.getAll,
      sortBy: params?.sortBy,
      sortOrder: params?.sortOrder,
    });
    const response = await api.get<unknown>("hr/Employees/manpower", {
      params: query,
    });
    const paginated = unwrapPaginatedApiData<HrManpowerListItem>(response.data);
    let page: LegacyPagedResult<HrManpowerListItem> = toLegacyPagedResult(paginated);

    if (params?.getAll && page.items.length < page.totalCount) {
      page = await ensureFullPageItems(page, async (nextPage, nextPageSize) => {
        const nextQuery = await buildManpowerQueryParams(params, {
          paging: true,
          page: nextPage,
          pageSize: nextPageSize,
          getAll: false,
          sortBy: params?.sortBy,
          sortOrder: params?.sortOrder,
        });
        const nextRes = await api.get<unknown>("hr/Employees/manpower", {
          params: nextQuery,
        });
        return toLegacyPagedResult(
          unwrapPaginatedApiData<HrManpowerListItem>(nextRes.data),
        );
      });
    } else if (params?.getAll) {
      page = { ...page, getAll: true };
    }

    return {
      ...page,
      items: page.items.map(mapHrManpowerToEmployee),
    } as unknown as EmployeePage;
  },

  getManpowerSummary: async (params?: ManpowerFilterParams) => {
    const query = await buildManpowerQueryParams(params, {
      paging: false,
      summary: true,
    });
    const response = await api.get<unknown>("hr/Employees/manpower/summary", {
      params: query,
    });
    const data = unwrapApiData<HrManpowerSummary>(response.data) as HrManpowerSummary;
    return {
      totalEmployees: data.totalEmployees,
      activeEmployees: data.activeEmployees,
      onLeaveEmployees: data.onLeaveEmployees,
      inactiveEmployees: data.inactiveEmployees,
      departmentSummary: (data.departmentSummary ?? []).map(mapSummaryBucket),
      designationSummary: (data.designationSummary ?? []).map(mapSummaryBucket),
      genderSummary: (data.genderSummary ?? []).map(mapSummaryBucket),
      statusSummary: (data.statusSummary ?? []).map(mapSummaryBucket),
    };
  },
};
