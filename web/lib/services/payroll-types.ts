/** PayrollService API DTOs (camelCase JSON). */

export type SalaryProcessingMode = "FullCompliance" | "NonCompliance" | "MultiSalaryOt";

export interface SalarySheetRowDto {
  employeeId: string;
  employeeCode?: string | null;
  employeeName?: string | null;
  departmentName?: string | null;
  designationName?: string | null;
  grossSalary: number;
  basicSalary: number;
  totalDays: number;
  presentDays: number;
  absentDays: number;
  overtimeHours: number;
  overtimeAmount: number;
  totalEarnings: number;
  totalDeduction: number;
  netSalary: number;
  status: string;
}

export interface PayrollSummaryDto {
  companyId: string;
  yearNo: number;
  monthNo: number;
  totalEmployees: number;
  grossSalary: number;
  totalEarnings: number;
  totalDeduction: number;
  netSalary: number;
  status: string;
}

export interface SummaryGroupDto {
  name: string;
  totalGrossSalary: number;
  totalOTAmount: number;
  totalDeductions: number;
  totalNetPayable: number;
  employeeCount: number;
}

export interface PayrollSummaryBreakdownDto {
  summary: PayrollSummaryDto;
  departmentSummaries: SummaryGroupDto[];
  sectionSummaries: SummaryGroupDto[];
  lineSummaries: SummaryGroupDto[];
  groupSummaries: SummaryGroupDto[];
}

export interface EmployeePayrollDto {
  id: string;
  companyId: string;
  yearNo: number;
  monthNo: number;
  payrollRunId: string;
  employeeId: string;
  processingMode: string;
  salaryCalculationType: string;
  overtimeCalculationType?: string | null;
  grossSalary: number;
  basicSalary: number;
  totalDays: number;
  workingDays: number;
  presentDays: number;
  absentDays: number;
  leaveDays: number;
  leaveWithoutPayDays: number;
  lateDays: number;
  overtimeHours: number;
  overtimeRate: number;
  overtimeAmount: number;
  tiffinBillAmount: number;
  nightBillAmount: number;
  attendanceBonusAmount: number;
  festivalBonusAmount: number;
  earnLeaveEncashmentAmount: number;
  totalEarnings: number;
  totalDeduction: number;
  netSalary: number;
  status: string;
  earnings: PayrollEarningDto[];
  deductions: PayrollDeductionDto[];
}

export interface PayrollEarningDto {
  earningCode: string;
  earningName: string;
  amount: number;
  isManual: boolean;
  remarks?: string | null;
}

export interface PayrollDeductionDto {
  deductionCode: string;
  deductionName: string;
  amount: number;
  isManual: boolean;
  remarks?: string | null;
}

export interface PayslipDto {
  payroll: EmployeePayrollDto;
  periodSummary: PayrollSummaryDto;
}

export interface BankSheetRowDto {
  employeeId: string;
  bankAccountNo: string;
  bankName: string;
  netSalary: number;
}

export interface SalaryStructureDto {
  id: string;
  companyId: string;
  structureCode: string;
  structureName: string;
  gradeId?: string | null;
  isActive: boolean;
  components: SalaryStructureComponentDto[];
}

export interface SalaryStructureComponentDto {
  id: string;
  companyId: string;
  salaryStructureId: string;
  componentCode: string;
  componentName: string;
  componentType: string;
  calculationType: string;
  amount: number;
  percentage: number;
  basedOnComponentCode?: string | null;
  isTaxable: boolean;
  isActive: boolean;
}

export interface EmployeeSalaryDto {
  id: string;
  companyId: string;
  employeeId: string;
  salaryStructureId?: string | null;
  salaryCalculationType: string;
  grossSalary: number;
  basicSalary: number;
  houseRent: number;
  medicalAllowance: number;
  conveyanceAllowance: number;
  foodAllowance: number;
  effectiveFrom: string;
  effectiveTo?: string | null;
  isCurrent: boolean;
}

export interface SalaryAdvanceDto {
  id: string;
  companyId: string;
  employeeId: string;
  advanceNo: string;
  advanceAmount: number;
  paidAmount: number;
  balanceAmount: number;
  advanceDate: string;
  installmentAmount: number;
  status: string;
}

export interface SalaryAdvanceSummaryDto {
  totalCount: number;
  totalAmount: number;
  totalBalance: number;
  approvedCount: number;
  pendingCount: number;
}

export interface SalaryIncrementDto {
  id: string;
  companyId: string;
  employeeId: string;
  oldGrossSalary: number;
  newGrossSalary: number;
  incrementAmount: number;
  incrementPercentage: number;
  effectiveFrom: string;
  status: string;
}

export interface AllowanceBillDto {
  id: string;
  companyId: string;
  employeeId: string;
  allowanceType: string;
  billDate: string;
  quantity: number;
  rate: number;
  amount: number;
  status: string;
  remarks?: string | null;
}

export interface DeductionDto {
  id: string;
  companyId: string;
  employeeId: string;
  deductionType: string;
  amount: number;
  yearNo: number;
  monthNo: number;
  status: string;
  remarks?: string | null;
}

export interface FinalSettlementDto {
  id: string;
  companyId: string;
  employeeId: string;
  settlementDate: string;
  lastWorkingDate: string;
  netPayable: number;
  status: string;
}

export interface DailySalarySheetRowDto {
  employeeId: string;
  employeeCode?: string | null;
  employeeName?: string | null;
  departmentName?: string | null;
  designationName?: string | null;
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

export interface PayrollBonusRowDto {
  id: string;
  employeeId: string;
  employeeName?: string | null;
  bonusType: string;
  amount: number;
  yearNo: number;
  monthNo: number;
  status: string;
}

export interface PayrollApprovalRequest {
  userId: string;
  remarks?: string | null;
}

export interface PayrollProcessRequest {
  companyId: string;
  yearNo: number;
  monthNo: number;
  processedBy?: string | null;
  forceReprocess?: boolean;
}

export interface PayrollPolicyTemplateDto {
  id: string;
  policyCode: string;
  policyName: string;
  version: number;
  complianceMode: string;
  otBase: string;
  otDivisor: number;
  otMultiplier: number;
  absentBase: string;
  absentDayDivisor: string;
  monthDayCalculationType: string;
  requireAttendanceApproval: boolean;
  summary: string;
}

export interface CompanyPayrollPolicyAssignmentDto {
  id: string;
  companyId: string;
  policyTemplateId: string;
  policyCode: string;
  policyName: string;
  policyVersion: number;
  fixedOvertimeRate?: number | null;
  effectiveFrom: string;
  isActive: boolean;
  assignedAt: string;
}

export interface CompanyPayrollPolicySummaryDto {
  companyId: string;
  policyCode: string;
  policyName: string;
  version: number;
  fixedOvertimeRate?: number | null;
  effectiveFrom?: string | null;
}

export interface AssignCompanyPayrollPolicyRequest {
  companyId: string;
  policyCode: string;
  effectiveFrom: string;
  assignedBy?: string | null;
  fixedOvertimeRate?: number | null;
}
