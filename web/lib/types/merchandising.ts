/** Canonical merchandising API types (Guid-based, matches backend DTOs). */

export type Guid = string;

export type MasterDataResource =
  | 'colors'
  | 'sizes'
  | 'size-ratios'
  | 'units'
  | 'currencies'
  | 'fabric-types'
  | 'trims-types'
  | 'suppliers'
  | 'brands'
  | 'garment-categories';

export interface Buyer {
  id: Guid;
  companyId: Guid;
  buyerCode: string;
  buyerName: string;
  country?: string | null;
  contactPerson?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  paymentTerms?: string | null;
  currency?: string | null;
  leadTimeDays?: number | null;
  isActive: boolean;
}

export interface BuyerContact {
  id: Guid;
  companyId: Guid;
  buyerId: Guid;
  name: string;
  email?: string | null;
  phone?: string | null;
  role?: string | null;
}

export interface BuyerPaymentTerm {
  id: Guid;
  companyId: Guid;
  buyerId: Guid;
  termName: string;
  days: number;
  description?: string | null;
}

export interface BuyerComplianceRule {
  id: Guid;
  companyId: Guid;
  buyerId: Guid;
  ruleName: string;
  ruleType: string;
  description?: string | null;
  isMandatory: boolean;
}

export interface Season {
  id: Guid;
  companyId: Guid;
  seasonCode: string;
  seasonName: string;
  yearNo?: number | null;
  isActive: boolean;
}

export interface GarmentItem {
  id: Guid;
  companyId: Guid;
  itemCode: string;
  itemName: string;
  category?: string | null;
  isActive: boolean;
}

export interface Brand {
  id: Guid;
  companyId: Guid;
  code: string;
  name: string;
  isActive: boolean;
  /** Buyer id when resource is `brands` master data. */
  extra?: string | null;
}

export interface Style {
  id: Guid;
  companyId: Guid;
  buyerId: Guid;
  seasonId?: Guid | null;
  garmentItemId?: Guid | null;
  brandId?: Guid | null;
  styleNo: string;
  styleName?: string | null;
  description?: string | null;
  fabricDescription?: string | null;
}

export interface StyleVersion {
  id: Guid;
  companyId: Guid;
  styleId: Guid;
  versionNo: number;
  description?: string | null;
  effectiveDate: string;
}

export interface StyleBomItem {
  id: Guid;
  companyId: Guid;
  styleId: Guid;
  itemType: string;
  itemCode?: string | null;
  itemName: string;
  unitName: string;
  consumption: number;
  wastagePercent: number;
  unitPrice: number;
}

export interface Order {
  id: Guid;
  companyId: Guid;
  buyerId: Guid;
  styleId: Guid;
  orderNo: string;
  orderDate: string;
  shipmentDate?: string | null;
  totalOrderQty: number;
  unitPrice: number;
  totalValue: number;
  currencyCode: string;
  orderStatus: string;
}

export interface BuyerPurchaseOrder {
  id: Guid;
  companyId: Guid;
  orderId: Guid;
  poNo: string;
  poDate?: string | null;
  shipmentDate?: string | null;
  orderQty: number;
  unitPrice: number;
  totalValue: number;
  status: string;
}

export interface ColorSizeBreakdown {
  id: Guid;
  companyId: Guid;
  orderId: Guid;
  buyerPurchaseOrderId?: Guid | null;
  colorName: string;
  sizeName: string;
  quantity: number;
}

export interface BomItem {
  id: Guid;
  companyId: Guid;
  orderId: Guid;
  itemType: string;
  itemCode?: string | null;
  itemName: string;
  unitName: string;
  consumption: number;
  wastagePercent: number;
  requiredQty: number;
  unitPrice: number;
  totalCost: number;
}

export interface BomCalculationResult {
  orderId: Guid;
  totalRequiredItems: number;
  totalRequiredQuantity: number;
  totalCost: number;
}

export interface OrderCosting {
  id: Guid;
  companyId: Guid;
  orderId: Guid;
  fabricCost: number;
  accessoriesCost: number;
  cm: number;
  washingCost: number;
  embroideryCost: number;
  printingCost: number;
  otherCost: number;
  totalCost: number;
  sellingPrice: number;
  profitAmount: number;
  profitPercent: number;
  freightCost: number;
  commercialCost: number;
  bankCharges: number;
  commission: number;
  finalFob: number;
  approvalStatus: string;
}

export interface OrderDetails {
  order: Order;
  buyerPurchaseOrders: BuyerPurchaseOrder[];
  colorSizeBreakdowns: ColorSizeBreakdown[];
  bomItems: BomItem[];
  costing?: OrderCosting | null;
  shipmentPlans: ShipmentPlan[];
}

export interface OrderAssignment {
  id: Guid;
  companyId: Guid;
  orderId: Guid;
  assignedTo: string;
  role: string;
  assignedAt: string;
}

export interface OrderCommercialTerms {
  id: Guid;
  companyId: Guid;
  orderId: Guid;
  paymentTerms?: string | null;
  incoterms?: string | null;
  lcBank?: string | null;
  commission: number;
}

export interface ProgramSizeBreakdownWorksheet {
  sizeName: string;
  quantity: number;
  buyerPackingNumber?: string;
}

export interface ProgramColorWorksheet {
  colorName: string;
  sizeBreakdowns: ProgramSizeBreakdownWorksheet[];
}

export interface ProgramArticleWorksheet {
  styleNo: string;
  styleName?: string | null;
  totalQty: number;
  colors: ProgramColorWorksheet[];
}

export interface ProgramOrderWorksheet {
  id: Guid;
  companyId: Guid;
  programNumber: string;
  buyerName: string;
  customerName?: string | null;
  fabricDescription?: string | null;
  programName?: string | null;
  orderDate: string;
  orderStatus: string;
  articles: ProgramArticleWorksheet[];
}

export interface Sample {
  id: Guid;
  companyId: Guid;
  buyerId: Guid;
  styleId: Guid;
  sampleType: string;
  requestDate: string;
  submitDate?: string | null;
  approvalDate?: string | null;
  status: string;
  remarks?: string | null;
}

export interface SampleCosting {
  id: Guid;
  companyId: Guid;
  sampleId: Guid;
  fabricCost: number;
  trimsCost: number;
  cmCost: number;
  totalCost: number;
}

export interface QuotationLine {
  id: Guid;
  companyId: Guid;
  quotationId: Guid;
  itemDescription: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface QuotationNegotiation {
  id: Guid;
  companyId: Guid;
  quotationId: Guid;
  roundNo: number;
  proposedAmount: number;
  counterAmount?: number | null;
  notes?: string | null;
  negotiatedAt: string;
}

export interface Quotation {
  id: Guid;
  companyId: Guid;
  buyerId: Guid;
  styleId: Guid;
  quotationNo: string;
  quotationDate: string;
  validUntil?: string | null;
  status: string;
  totalAmount: number;
  lines?: QuotationLine[] | null;
}

export interface TnaTemplate {
  id: Guid;
  companyId: Guid;
  templateName: string;
  description?: string | null;
  isDefault: boolean;
}

export interface TnaMilestone {
  id: Guid;
  companyId: Guid;
  tnaCalendarId?: Guid | null;
  milestoneName: string;
  sequenceNo: number;
  plannedDate: string;
  actualDate?: string | null;
  status: string;
}

export interface TnaDelayLog {
  id: Guid;
  companyId: Guid;
  tnaMilestoneId: Guid;
  delayDays: number;
  reason: string;
  loggedAt: string;
}

export interface TnaCalendar {
  id: Guid;
  companyId: Guid;
  orderId: Guid;
  templateId?: Guid | null;
  startDate: string;
  endDate?: string | null;
  status: string;
  milestones?: TnaMilestone[] | null;
}

export interface MaterialBooking {
  id: Guid;
  companyId: Guid;
  orderId: Guid;
  bookingNo: string;
  bookingType: string;
  status: string;
  totalQty: number;
}

export interface FabricBookingDetail {
  id: Guid;
  companyId: Guid;
  materialBookingId: Guid;
  fabricTypeId?: Guid | null;
  colorName: string;
  requiredQty: number;
  bookedQty: number;
  supplierId?: Guid | null;
}

export interface TrimsBookingDetail {
  id: Guid;
  companyId: Guid;
  materialBookingId: Guid;
  trimsTypeId?: Guid | null;
  itemName: string;
  requiredQty: number;
  bookedQty: number;
  supplierId?: Guid | null;
}

export interface BookingAllocation {
  id: Guid;
  companyId: Guid;
  materialBookingId: Guid;
  detailId: Guid;
  detailType: string;
  allocatedQty: number;
  allocationDate: string;
}

export interface RequisitionLine {
  id: Guid;
  companyId: Guid;
  requisitionId: Guid;
  itemType: string;
  itemCode?: string | null;
  itemName: string;
  requiredQty: number;
  unitName: string;
  status: string;
}

export interface PurchaseRequisition {
  id: Guid;
  companyId: Guid;
  orderId?: Guid | null;
  requisitionNo: string;
  status: string;
  requestedDate: string;
  lines?: RequisitionLine[] | null;
}

export interface ShipmentPlan {
  id: Guid;
  companyId: Guid;
  orderId: Guid;
  buyerPurchaseOrderId?: Guid | null;
  plannedShipmentDate: string;
  plannedQty: number;
  shipmentMode?: string | null;
  destination?: string | null;
  status: string;
}

export interface ShipmentExecution {
  id: Guid;
  companyId: Guid;
  shipmentPlanId: Guid;
  actualShipmentDate?: string | null;
  shippedQty: number;
  status: string;
}

export interface CartonBreakdown {
  id: Guid;
  companyId: Guid;
  packingListId: Guid;
  cartonNo: number;
  colorName: string;
  sizeName: string;
  quantity: number;
}

export interface PackingList {
  id: Guid;
  companyId: Guid;
  shipmentExecutionId: Guid;
  cartonCount: number;
  grossWeightKg: number;
  netWeightKg: number;
  remarks?: string | null;
  cartonBreakdowns?: CartonBreakdown[] | null;
}

export interface StyleDocument {
  id: Guid;
  companyId: Guid;
  styleId: Guid;
  documentType: string;
  fileName: string;
  fileUrl: string;
  version?: string | null;
  remarks?: string | null;
}

export interface OrderDocument {
  id: Guid;
  companyId: Guid;
  orderId: Guid;
  documentType: string;
  fileName: string;
  fileUrl: string;
  version?: string | null;
  remarks?: string | null;
}

export interface CommunicationLog {
  id: Guid;
  companyId: Guid;
  styleId?: Guid | null;
  orderId?: Guid | null;
  direction: string;
  subject: string;
  message: string;
  contactName?: string | null;
  loggedAt: string;
}

export interface ApprovalStep {
  id: Guid;
  companyId: Guid;
  approvalRequestId: Guid;
  approvalLevel: number;
  approverUserId?: Guid | null;
  status: string;
  remarks?: string | null;
  actionAt?: string | null;
}

export interface ApprovalRequest {
  id: Guid;
  companyId: Guid;
  entityType: string;
  entityId: Guid;
  requestType: string;
  status: string;
  requestedBy: string;
  requestedAt: string;
  steps?: ApprovalStep[] | null;
}

export interface MasterDataDto {
  id: Guid;
  companyId: Guid;
  code: string;
  name: string;
  isActive: boolean;
  extra?: string | null;
}

/** Alias for color master rows (`merchandising/master/colors`). */
export type ColorMaster = MasterDataDto;

export interface TnaDelayReportRow {
  orderId: Guid;
  orderNo: string;
  milestoneId: Guid;
  milestoneName: string;
  plannedDate: string;
  actualDate?: string | null;
  delayDays: number;
  status: string;
}

export interface BookingStatusReportRow {
  orderId: Guid;
  orderNo: string;
  bookingId: Guid;
  bookingNo: string;
  bookingType: string;
  status: string;
  totalQty: number;
  bookedQty: number;
}

export interface OrderPipelineReportRow {
  orderStatus: string;
  orderCount: number;
  totalQuantity: number;
  totalValue: number;
}

/* ── Request payloads ── */

export interface CreateBuyerRequest {
  companyId: Guid;
  buyerCode: string;
  buyerName: string;
  country?: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  paymentTerms?: string;
  currency?: string;
  leadTimeDays?: number;
}

export interface UpdateBuyerRequest {
  buyerName: string;
  country?: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  isActive: boolean;
  paymentTerms?: string;
  currency?: string;
  leadTimeDays?: number;
}

export interface CreateStyleRequest {
  companyId: Guid;
  buyerId: Guid;
  seasonId?: Guid;
  garmentItemId?: Guid;
  brandId?: Guid;
  styleNo: string;
  styleName?: string;
  description?: string;
  fabricDescription?: string;
}

export interface UpdateStyleRequest {
  seasonId?: Guid;
  garmentItemId?: Guid;
  brandId?: Guid;
  styleName?: string;
  description?: string;
  fabricDescription?: string;
}

export interface CreateOrderRequest {
  companyId: Guid;
  buyerId: Guid;
  styleId: Guid;
  orderNo: string;
  orderDate: string;
  shipmentDate?: string;
  totalOrderQty: number;
  unitPrice: number;
  currencyCode?: string;
}

export interface UpdateOrderRequest {
  shipmentDate?: string;
  totalOrderQty: number;
  unitPrice: number;
  currencyCode: string;
}

export interface CreateBuyerPoRequest {
  companyId: Guid;
  poNo: string;
  poDate?: string;
  shipmentDate?: string;
  orderQty: number;
  unitPrice: number;
}

export interface UpdateBuyerPoRequest {
  poDate?: string;
  shipmentDate?: string;
  orderQty: number;
  unitPrice: number;
  status: string;
}

export interface CreateColorSizeBreakdownRequest {
  companyId: Guid;
  buyerPurchaseOrderId?: Guid;
  colorName: string;
  sizeName: string;
  quantity: number;
}

export interface UpdateColorSizeBreakdownRequest {
  buyerPurchaseOrderId?: Guid;
  colorName: string;
  sizeName: string;
  quantity: number;
}

export interface CreateBomItemRequest {
  companyId: Guid;
  itemType: string;
  itemCode?: string;
  itemName: string;
  unitName: string;
  consumption: number;
  wastagePercent: number;
  unitPrice: number;
}

export interface UpdateBomItemRequest {
  itemType: string;
  itemCode?: string;
  itemName: string;
  unitName: string;
  consumption: number;
  wastagePercent: number;
  unitPrice: number;
}

export interface CreateOrderCostingRequest {
  companyId: Guid;
  fabricCost: number;
  accessoriesCost: number;
  cm: number;
  washingCost: number;
  embroideryCost: number;
  printingCost: number;
  otherCost: number;
  sellingPrice: number;
  freightCost?: number;
  commercialCost?: number;
  bankCharges?: number;
  commission?: number;
}

export interface CreateMasterDataRequest {
  companyId: Guid;
  code: string;
  name: string;
  extra?: string;
}

export interface UpdateMasterDataRequest {
  name: string;
  isActive: boolean;
  extra?: string;
}

export interface CreateSampleRequest {
  companyId: Guid;
  buyerId: Guid;
  styleId: Guid;
  sampleType: string;
  requestDate: string;
  submitDate?: string;
  remarks?: string;
}

export interface CreateStyleDocumentRequest {
  companyId: Guid;
  documentType: string;
  fileName: string;
  fileUrl: string;
  version?: string;
  remarks?: string;
}

export interface CreateOrderDocumentRequest {
  companyId: Guid;
  documentType: string;
  fileName: string;
  fileUrl: string;
  version?: string;
  remarks?: string;
}

export interface CreateSampleCostingRequest {
  companyId: Guid;
  fabricCost: number;
  trimsCost: number;
  cmCost: number;
}

export interface CreateQuotationLineRequest {
  itemDescription: string;
  quantity: number;
  unitPrice: number;
}

export interface CreateQuotationRequest {
  companyId: Guid;
  buyerId: Guid;
  styleId: Guid;
  quotationNo: string;
  quotationDate: string;
  validUntil?: string;
  lines: CreateQuotationLineRequest[];
}

export interface UpdateQuotationRequest {
  validUntil?: string;
  status: string;
}

export interface AddQuotationNegotiationRequest {
  proposedAmount: number;
  counterAmount?: number;
  notes?: string;
}

export interface ConvertQuotationToOrderRequest {
  orderNo: string;
  orderDate: string;
  totalOrderQty: number;
  unitPrice: number;
  currencyCode?: string;
}

export interface CreateShipmentPlanRequest {
  companyId: Guid;
  orderId: Guid;
  buyerPurchaseOrderId?: Guid;
  plannedShipmentDate: string;
  plannedQty: number;
  shipmentMode?: string;
  destination?: string;
}

export interface UpdateShipmentPlanRequest {
  buyerPurchaseOrderId?: Guid;
  plannedShipmentDate: string;
  plannedQty: number;
  shipmentMode?: string;
  destination?: string;
  status: string;
}

export interface CreateMaterialBookingRequest {
  companyId: Guid;
  orderId: Guid;
  bookingNo: string;
  bookingType: string;
}

export interface CreatePurchaseRequisitionRequest {
  companyId: Guid;
  orderId?: Guid;
  requisitionNo: string;
  requestedDate: string;
  lines?: Array<{
    itemType: string;
    itemCode?: string;
    itemName: string;
    requiredQty: number;
    unitName: string;
  }>;
}

export interface CreateCommunicationLogRequest {
  companyId: Guid;
  styleId?: Guid;
  orderId?: Guid;
  direction: string;
  subject: string;
  message: string;
  contactName?: string;
}

export interface CreateApprovalRequestRequest {
  companyId: Guid;
  entityType: string;
  entityId: Guid;
  requestType: string;
  requestedBy: string;
  steps: Array<{ approvalLevel: number; approverUserId?: Guid }>;
}

export interface ApproveStepRequest {
  approverUserId: Guid;
  remarks?: string;
}

export interface RejectStepRequest {
  approverUserId: Guid;
  remarks?: string;
}

/* ── Order import ── */

export interface OrderImportRowDto {
  orderNo: string;
  buyerCode: string;
  styleNo: string;
  orderDate: string;
  shipmentDate?: string;
  totalQty: number;
  unitPrice: number;
  currency: string;
  colorName: string;
  sizeName: string;
  quantity: number;
}

export interface OrderImportPreviewRowDto {
  rowNumber: number;
  orderNo: string;
  buyerCode: string;
  styleNo: string;
  colorName: string;
  sizeName: string;
  quantity: number;
  isValid: boolean;
  errorMessage?: string | null;
}

export interface OrderImportPreviewDto {
  rows: OrderImportPreviewRowDto[];
  totalCount: number;
  validCount: number;
  invalidCount: number;
}

export interface OrderImportResultDto {
  createdOrderCount: number;
  createdBreakdownCount: number;
  orders: Order[];
}

export interface ColorImportResultDto {
  createdCount: number;
  updatedCount: number;
  skippedCount: number;
  errors: string[];
}
