export type Guid = string;

export type GatePassType =
  | 'MaterialIn'
  | 'MaterialOut'
  | 'Returnable'
  | 'NonReturnable'
  | 'Delivery'
  | 'Sample'
  | 'Machine'
  | 'Scrap'
  | 'Others';

export type GatePassDirection = 'IN' | 'OUT';

export type GatePassStatus =
  | 'Draft'
  | 'Submitted'
  | 'Approved'
  | 'Issued'
  | 'Completed'
  | 'Cancelled'
  | 'Hold';

export type ChalanType =
  | 'Delivery'
  | 'Receive'
  | 'Return'
  | 'Sample'
  | 'Fabric'
  | 'Accessories'
  | 'FinishedGoods'
  | 'Others';

export type BillType =
  | 'Transport'
  | 'Delivery'
  | 'Supplier'
  | 'Contractor'
  | 'Utility'
  | 'Others';

export type VisitorEntryStatus = 'CheckedIn' | 'CheckedOut' | 'Cancelled';
export type VehicleEntryStatus = 'In' | 'Out';
export type EmployeeOutPassStatus = 'Pending' | 'Approved' | 'Out' | 'Returned' | 'Cancelled';
export type ApprovalStatus = 'Pending' | 'Approved' | 'Rejected';
export type WorkflowStatus =
  | 'Draft'
  | 'Pending'
  | 'Approved'
  | 'Rejected'
  | 'SentToAccounts'
  | 'Cancelled'
  | 'Hold';

export type SecurityReferenceType =
  | 'VisitorEntry'
  | 'VehicleEntry'
  | 'GatePass'
  | 'Chalan'
  | 'BillEntry';

export type CheckResult = 'Passed' | 'Failed' | 'Hold';

export interface Gate {
  id: Guid;
  companyId: Guid;
  gateCode: string;
  gateName: string;
  locationName?: string | null;
  isActive: boolean;
}

export interface Visitor {
  id: Guid;
  companyId: Guid;
  visitorName: string;
  phone?: string | null;
  nidNo?: string | null;
  companyName?: string | null;
  address?: string | null;
  photoUrl?: string | null;
  isBlacklisted: boolean;
}

export interface VisitorEntry {
  id: Guid;
  companyId: Guid;
  gateId: Guid;
  visitorId: Guid;
  entryNo: string;
  visitDate: string;
  inTime: string;
  outTime?: string | null;
  purpose: string;
  personToMeetEmployeeId?: Guid | null;
  departmentId?: Guid | null;
  visitorCardNo?: string | null;
  status: VisitorEntryStatus;
}

export interface EmployeeOutPass {
  id: Guid;
  companyId: Guid;
  gateId: Guid;
  employeeId: Guid;
  passNo: string;
  passDate: string;
  outTime: string;
  expectedReturnTime?: string | null;
  actualReturnTime?: string | null;
  reason: string;
  approvalStatus: ApprovalStatus;
  approvedBy?: Guid | null;
  approvedAt?: string | null;
  status: EmployeeOutPassStatus;
}

export interface Vehicle {
  id: Guid;
  companyId: Guid;
  vehicleNo: string;
  vehicleType?: string | null;
  driverName?: string | null;
  driverPhone?: string | null;
  isActive: boolean;
}

export interface VehicleEntry {
  id: Guid;
  companyId: Guid;
  gateId: Guid;
  vehicleId: Guid;
  entryNo: string;
  entryDate: string;
  inTime: string;
  outTime?: string | null;
  purpose?: string | null;
  driverName?: string | null;
  driverPhone?: string | null;
  status: VehicleEntryStatus;
}

export interface GatePassItem {
  id: Guid;
  companyId: Guid;
  gatePassId: Guid;
  itemName: string;
  itemDescription?: string | null;
  unitName?: string | null;
  quantity: number;
  remarks?: string | null;
  returnedQty: number;
}

export interface GatePass {
  id: Guid;
  companyId: Guid;
  gateId: Guid;
  gatePassNo: string;
  gatePassDate: string;
  gatePassType: GatePassType | string;
  direction: GatePassDirection | string;
  referenceType?: string | null;
  referenceId?: Guid | null;
  departmentId?: Guid | null;
  supplierId?: Guid | null;
  buyerId?: Guid | null;
  vehicleNo?: string | null;
  driverName?: string | null;
  purpose?: string | null;
  isReturnable: boolean;
  expectedReturnDate?: string | null;
  approvalStatus: ApprovalStatus | string;
  approvedBy?: Guid | null;
  approvedAt?: string | null;
  status: GatePassStatus | string;
  items: GatePassItem[];
}

export interface ReturnableGatePassReturnItem {
  id: Guid;
  companyId: Guid;
  returnId: Guid;
  gatePassItemId: Guid;
  returnQty: number;
}

export interface ReturnableGatePassReturn {
  id: Guid;
  companyId: Guid;
  gatePassId: Guid;
  returnDate: string;
  returnedBy?: string | null;
  receivedBy?: Guid | null;
  remarks?: string | null;
  items: ReturnableGatePassReturnItem[];
}

export interface ChalanItem {
  id: Guid;
  companyId: Guid;
  chalanId: Guid;
  itemName: string;
  unitName?: string | null;
  quantity: number;
  remarks?: string | null;
}

export interface Chalan {
  id: Guid;
  companyId: Guid;
  chalanNo: string;
  chalanDate: string;
  chalanType: ChalanType | string;
  supplierId?: Guid | null;
  buyerId?: Guid | null;
  orderId?: Guid | null;
  vehicleNo?: string | null;
  driverName?: string | null;
  remarks?: string | null;
  status: WorkflowStatus | string;
  gatePassId?: Guid | null;
  items: ChalanItem[];
}

export interface BillEntry {
  id: Guid;
  companyId: Guid;
  billNo: string;
  billDate: string;
  billType: BillType | string;
  supplierId?: Guid | null;
  chalanId?: Guid | null;
  gatePassId?: Guid | null;
  amount: number;
  vatAmount: number;
  totalAmount: number;
  description?: string | null;
  status: WorkflowStatus | string;
  approvedBy?: Guid | null;
  approvedAt?: string | null;
}

export interface SecurityCheckLog {
  id: Guid;
  companyId: Guid;
  gateId: Guid;
  referenceType: SecurityReferenceType | string;
  referenceId: Guid;
  checkTime: string;
  checkedBy?: Guid | null;
  checkResult: CheckResult | string;
  remarks?: string | null;
}

export interface DailyGateRegister {
  date: string;
  visitors: VisitorEntry[];
  vehicles: VehicleEntry[];
  gatePasses: GatePass[];
}

export interface MaterialInOutReport {
  fromDate: string;
  toDate: string;
  materialIn: GatePass[];
  materialOut: GatePass[];
}

export interface ReturnablePending {
  gatePassId: Guid;
  gatePassNo: string;
  gatePassDate: string;
  expectedReturnDate?: string | null;
  itemName: string;
  quantity: number;
  returnedQty: number;
  pendingQty: number;
}

export interface SecurityReport {
  reportName: string;
  data: unknown;
}

export interface ExportResult {
  jobId: string;
  status: string;
  downloadUrl?: string | null;
}

export interface CreateGateRequest {
  companyId: Guid;
  gateCode: string;
  gateName: string;
  locationName?: string | null;
}

export interface UpdateGateRequest {
  gateCode: string;
  gateName: string;
  locationName?: string | null;
  isActive: boolean;
}

export interface CreateVisitorRequest {
  companyId: Guid;
  visitorName: string;
  phone?: string | null;
  nidNo?: string | null;
  companyName?: string | null;
  address?: string | null;
  photoUrl?: string | null;
}

export interface CreateVisitorEntryRequest {
  companyId: Guid;
  gateId: Guid;
  visitorId: Guid;
  entryNo: string;
  visitDate: string;
  inTime: string;
  purpose: string;
  personToMeetEmployeeId?: Guid | null;
  departmentId?: Guid | null;
  visitorCardNo?: string | null;
}

export interface CheckoutVisitorEntryRequest {
  outTime: string;
}

export interface CreateEmployeeOutPassRequest {
  companyId: Guid;
  gateId: Guid;
  employeeId: Guid;
  passNo: string;
  passDate: string;
  outTime: string;
  expectedReturnTime?: string | null;
  reason: string;
}

export interface EmployeeOutPassReturnRequest {
  actualReturnTime: string;
}

export interface CreateVehicleRequest {
  companyId: Guid;
  vehicleNo: string;
  vehicleType?: string | null;
  driverName?: string | null;
  driverPhone?: string | null;
}

export interface CreateVehicleEntryRequest {
  companyId: Guid;
  gateId: Guid;
  vehicleId: Guid;
  entryNo: string;
  entryDate: string;
  inTime: string;
  purpose?: string | null;
  driverName?: string | null;
  driverPhone?: string | null;
}

export interface VehicleExitRequest {
  outTime: string;
}

export interface CreateGatePassItemRequest {
  itemName: string;
  itemDescription?: string | null;
  unitName?: string | null;
  quantity: number;
  remarks?: string | null;
}

export interface CreateGatePassRequest {
  companyId: Guid;
  gateId: Guid;
  gatePassNo: string;
  gatePassDate: string;
  gatePassType: string;
  direction: string;
  referenceType?: string | null;
  referenceId?: Guid | null;
  departmentId?: Guid | null;
  supplierId?: Guid | null;
  buyerId?: Guid | null;
  vehicleNo?: string | null;
  driverName?: string | null;
  purpose?: string | null;
  isReturnable: boolean;
  expectedReturnDate?: string | null;
  items: CreateGatePassItemRequest[];
}

export interface CreateReturnableGatePassReturnItemRequest {
  gatePassItemId: Guid;
  returnQty: number;
}

export interface CreateReturnableGatePassReturnRequest {
  companyId: Guid;
  gatePassId: Guid;
  returnDate: string;
  returnedBy?: string | null;
  receivedBy?: Guid | null;
  remarks?: string | null;
  items: CreateReturnableGatePassReturnItemRequest[];
}

export interface CreateChalanItemRequest {
  itemName: string;
  unitName?: string | null;
  quantity: number;
  remarks?: string | null;
}

export interface CreateChalanRequest {
  companyId: Guid;
  chalanNo: string;
  chalanDate: string;
  chalanType: string;
  supplierId?: Guid | null;
  buyerId?: Guid | null;
  orderId?: Guid | null;
  vehicleNo?: string | null;
  driverName?: string | null;
  remarks?: string | null;
  gatePassId?: Guid | null;
  items: CreateChalanItemRequest[];
}

export interface CreateBillEntryRequest {
  companyId: Guid;
  billNo: string;
  billDate: string;
  billType: string;
  supplierId?: Guid | null;
  chalanId?: Guid | null;
  gatePassId?: Guid | null;
  amount: number;
  vatAmount: number;
  totalAmount: number;
  description?: string | null;
}

export interface CreateSecurityCheckRequest {
  companyId: Guid;
  gateId: Guid;
  referenceType: string;
  referenceId: Guid;
  checkTime: string;
  checkResult: string;
  remarks?: string | null;
}

export interface ReportExportRequest {
  companyId: Guid;
  reportName: string;
  format: string;
  date?: string | null;
  fromDate?: string | null;
  toDate?: string | null;
}

export const GATE_PASS_TYPES: GatePassType[] = [
  'MaterialIn', 'MaterialOut', 'Returnable', 'NonReturnable',
  'Delivery', 'Sample', 'Machine', 'Scrap', 'Others',
];

export const CHALAN_TYPES: ChalanType[] = [
  'Delivery', 'Receive', 'Return', 'Sample', 'Fabric',
  'Accessories', 'FinishedGoods', 'Others',
];

export const BILL_TYPES: BillType[] = [
  'Transport', 'Delivery', 'Supplier', 'Contractor', 'Utility', 'Others',
];

export const SECURITY_REFERENCE_TYPES: SecurityReferenceType[] = [
  'VisitorEntry', 'VehicleEntry', 'GatePass', 'Chalan', 'BillEntry',
];

export const CHECK_RESULTS: CheckResult[] = ['Passed', 'Failed', 'Hold'];
