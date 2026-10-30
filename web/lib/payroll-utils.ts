import { companyService, type Company } from "@/lib/services/company";
import { payrollService } from "@/lib/services/payroll";
import type {
  SalarySheetRowDto,
  EmployeePayrollDto,
  DailySalarySheetRowDto,
  BankSheetRowDto,
} from "@/lib/services/payroll-types";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export function monthName(month: number): string {
  return MONTH_NAMES[month - 1] ?? String(month);
}

export async function resolveCompanyGuid(companyId: number | string | undefined): Promise<string | undefined> {
  if (!companyId || companyId === "all") return undefined;
  const companies = await companyService.getAll();
  const numeric = typeof companyId === "number" ? companyId : parseInt(String(companyId), 10);
  const company = companies.find((c) => c.id === numeric);
  return company?.entityId;
}

export function companyGuidFromSelection(
  companies: Company[],
  selectedCompanyId: string,
): string | undefined {
  if (selectedCompanyId === "all") return undefined;
  return companies.find((c) => String(c.id) === selectedCompanyId)?.entityId;
}

/** Stable key for legacy UI rows that still reference periodId. */
export function payrollMonthKey(companyGuid: string, year: number, month: number): string {
  return `${companyGuid}:${year}:${month}`;
}

export function parsePayrollMonthKey(key: string): { companyId: string; year: number; month: number } | null {
  const parts = key.split(":");
  if (parts.length !== 3) return null;
  const year = parseInt(parts[1], 10);
  const month = parseInt(parts[2], 10);
  if (!parts[0] || Number.isNaN(year) || Number.isNaN(month)) return null;
  return { companyId: parts[0], year, month };
}

/** Legacy table shape used by existing payroll pages. */
export interface MonthlySalarySheet {
  id: string;
  periodId: string;
  employeeId: string;
  employeeGuid: string;
  companyId?: number;
  employeeName: string;
  department: string;
  designation: string;
  year: number;
  month: number;
  monthName: string;
  grossSalary: number;
  basicSalary: number;
  houseRent: number;
  medicalAllowance: number;
  foodAllowance: number;
  conveyance: number;
  totalDays: number;
  presentDays: number;
  absentDays: number;
  leaveDays: number;
  holidays: number;
  weekendDays: number;
  otHours: number;
  otRate: number;
  otAmount: number;
  attendanceBonus: number;
  otherAllowances: number;
  totalEarning: number;
  absentDeduction: number;
  totalDeduction: number;
  netPayable: number;
  status: string;
  companyName?: string;
  joinedDate?: string;
  bankAccountNo?: string;
}

export function mapSalarySheetRow(
  row: SalarySheetRowDto,
  periodId: string,
  year: number,
  month: number,
): MonthlySalarySheet {
  return {
    id: row.employeeId,
    periodId,
    employeeGuid: row.employeeId,
    employeeId: row.employeeCode ?? row.employeeId,
    employeeName: row.employeeName ?? "",
    department: row.departmentName ?? "",
    designation: row.designationName ?? "",
    year,
    month,
    monthName: monthName(month),
    grossSalary: row.grossSalary,
    basicSalary: row.basicSalary,
    houseRent: 0,
    medicalAllowance: 0,
    foodAllowance: 0,
    conveyance: 0,
    totalDays: row.totalDays,
    presentDays: row.presentDays,
    absentDays: row.absentDays,
    leaveDays: 0,
    holidays: 0,
    weekendDays: 0,
    otHours: row.overtimeHours,
    otRate: 0,
    otAmount: row.overtimeAmount,
    attendanceBonus: 0,
    otherAllowances: 0,
    totalEarning: row.totalEarnings,
    absentDeduction: 0,
    totalDeduction: row.totalDeduction,
    netPayable: row.netSalary,
    status: row.status,
  };
}

export function mapEmployeePayrollRow(
  row: EmployeePayrollDto,
  periodId: string,
  year: number,
  month: number,
  employeeMeta?: { code?: string; name?: string; department?: string; designation?: string },
): MonthlySalarySheet {
  return {
    id: row.id,
    periodId,
    employeeGuid: row.employeeId,
    employeeId: employeeMeta?.code ?? row.employeeId,
    employeeName: employeeMeta?.name ?? "",
    department: employeeMeta?.department ?? "",
    designation: employeeMeta?.designation ?? "",
    year,
    month,
    monthName: monthName(month),
    grossSalary: row.grossSalary,
    basicSalary: row.basicSalary,
    houseRent: 0,
    medicalAllowance: 0,
    foodAllowance: 0,
    conveyance: 0,
    totalDays: row.totalDays,
    presentDays: row.presentDays,
    absentDays: row.absentDays,
    leaveDays: row.leaveDays,
    holidays: 0,
    weekendDays: 0,
    otHours: row.overtimeHours,
    otRate: row.overtimeRate,
    otAmount: row.overtimeAmount,
    attendanceBonus: row.attendanceBonusAmount,
    otherAllowances: row.tiffinBillAmount + row.nightBillAmount,
    totalEarning: row.totalEarnings,
    absentDeduction: 0,
    totalDeduction: row.totalDeduction,
    netPayable: row.netSalary,
    status: row.status,
  };
}

export interface DailySalarySheet {
  id: string;
  employeeId: string;
  companyId: number;
  employeeName: string;
  department: string;
  designation: string;
  date: string;
  grossSalary: number;
  perDaySalary: number;
  attendanceStatus: string;
  otHours: number;
  otAmount: number;
  totalEarning: number;
  deduction: number;
  netPayable: number;
}

export function mapDailyRow(row: DailySalarySheetRowDto): DailySalarySheet {
  return {
    id: row.employeeId,
    employeeId: row.employeeCode ?? row.employeeId,
    companyId: 0,
    employeeName: row.employeeName ?? "",
    department: row.departmentName ?? "",
    designation: row.designationName ?? "",
    date: row.date,
    grossSalary: row.grossSalary,
    perDaySalary: row.perDaySalary,
    attendanceStatus: row.attendanceStatus,
    otHours: row.otHours,
    otAmount: row.otAmount,
    totalEarning: row.totalEarning,
    deduction: row.deduction,
    netPayable: row.netPayable,
  };
}

export interface BankSheet {
  id: string;
  employeeId: string;
  employeeName?: string;
  companyId: number;
  bankName: string;
  bankAccountNo: string;
  bankBranchName: string;
  netPayable: number;
  status: string;
  department: string;
}

export function mapBankSheetRow(row: BankSheetRowDto, employeeName?: string): BankSheet {
  return {
    id: row.employeeId,
    employeeId: row.employeeId,
    employeeName,
    companyId: 0,
    bankName: row.bankName,
    bankAccountNo: row.bankAccountNo,
    bankBranchName: "",
    netPayable: row.netSalary,
    status: "Processed",
    department: "",
  };
}
