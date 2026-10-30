/** Cutting API types (Guid-based, matches CuttingService DTOs). */

export type Guid = string;

export interface CuttingPlan {
  id: Guid;
  companyId: Guid;
  orderId: Guid;
  styleId?: Guid | null;
  planNo: string;
  planDate: string;
  colorName?: string | null;
  totalPlanQty: number;
  status: string;
}

export interface CuttingPlanSizeBreakdown {
  id: Guid;
  companyId: Guid;
  cuttingPlanId: Guid;
  sizeName: string;
  planQty: number;
}

export interface FabricIssueToCutting {
  id: Guid;
  companyId: Guid;
  orderId: Guid;
  cuttingPlanId?: Guid | null;
  inventoryIssueId?: Guid | null;
  issueNo: string;
  issueDate: string;
  fabricItemId: Guid;
  issueQty: number;
  unitName: string;
  lotNo?: string | null;
  batchNo?: string | null;
  colorName?: string | null;
  status: string;
}

export interface CuttingLaySizeDetail {
  id: Guid;
  companyId: Guid;
  cuttingLayId: Guid;
  sizeName: string;
  ratioQty: number;
  plyQty: number;
  cutQty: number;
}

export interface CuttingLay {
  id: Guid;
  companyId: Guid;
  cuttingPlanId: Guid;
  layNo: string;
  layDate: string;
  markerNo?: string | null;
  fabricLength: number;
  plyQty: number;
  layQty: number;
  status: string;
  sizeDetails: CuttingLaySizeDetail[];
}

export interface CuttingOutput {
  id: Guid;
  companyId: Guid;
  cuttingPlanId: Guid;
  cuttingLayId?: Guid | null;
  orderId: Guid;
  outputDate: string;
  colorName?: string | null;
  sizeName: string;
  outputQty: number;
  status: string;
}

export interface CuttingWastage {
  id: Guid;
  companyId: Guid;
  cuttingPlanId: Guid;
  orderId: Guid;
  wastageDate: string;
  fabricItemId?: Guid | null;
  wastageQty: number;
  wastageReason: string;
}

export interface CuttingBalance {
  id: Guid;
  companyId: Guid;
  orderId: Guid;
  colorName?: string | null;
  sizeName: string;
  orderQty: number;
  planQty: number;
  cutQty: number;
  transferredQty: number;
  balanceQty: number;
}

export interface CuttingPanelTransferItem {
  id: Guid;
  companyId: Guid;
  cuttingPanelTransferId: Guid;
  colorName?: string | null;
  sizeName: string;
  transferQty: number;
}

export interface CuttingPanelTransfer {
  id: Guid;
  companyId: Guid;
  orderId: Guid;
  cuttingPlanId: Guid;
  transferNo: string;
  transferDate: string;
  toDepartment: string;
  totalTransferQty: number;
  status: string;
  items: CuttingPanelTransferItem[];
}

export interface CuttingBundle {
  id: Guid;
  companyId: Guid;
  orderId: Guid;
  cuttingPlanId: Guid;
  cuttingLayId?: Guid | null;
  cuttingOutputId?: Guid | null;
  bundleTag: string;
  planNo?: string | null;
  styleName?: string | null;
  sizeName: string;
  pieceCount: number;
  serialFrom?: number | null;
  serialTo?: number | null;
  serialRange?: string | null;
  weightKg?: number | null;
  currentLocation?: string | null;
  status: string;
}

export interface CuttingReportRow {
  reportType: string;
  companyId: Guid;
  orderId: Guid;
  planNo?: string | null;
  date: string;
  colorName?: string | null;
  sizeName: string;
  quantity: number;
  wastageQty: number;
  status?: string | null;
}

export interface CreateCuttingPlanRequest {
  companyId: Guid;
  orderId: Guid;
  styleId?: Guid;
  planNo: string;
  planDate: string;
  colorName?: string;
  totalPlanQty: number;
}

export interface UpdateCuttingPlanRequest {
  styleId?: Guid;
  planDate: string;
  colorName?: string;
  totalPlanQty: number;
}

export interface AddCuttingPlanSizeBreakdownRequest {
  companyId: Guid;
  sizeName: string;
  planQty: number;
}

export interface UpdateCuttingPlanSizeBreakdownRequest {
  sizeName: string;
  planQty: number;
}

export interface CreateFabricIssueToCuttingRequest {
  companyId: Guid;
  orderId: Guid;
  cuttingPlanId?: Guid;
  inventoryIssueId?: Guid;
  issueNo: string;
  issueDate: string;
  fabricItemId: Guid;
  issueQty: number;
  unitName: string;
  lotNo?: string;
  batchNo?: string;
  colorName?: string;
}

export interface CreateCuttingLaySizeDetailRequest {
  sizeName: string;
  ratioQty: number;
  plyQty: number;
}

export interface CreateCuttingLayRequest {
  companyId: Guid;
  cuttingPlanId: Guid;
  layNo: string;
  layDate: string;
  markerNo?: string;
  fabricLength: number;
  plyQty: number;
  layQty: number;
  sizeDetails: CreateCuttingLaySizeDetailRequest[];
}

export interface UpdateCuttingLayRequest {
  layNo: string;
  layDate: string;
  markerNo?: string;
  fabricLength: number;
  plyQty: number;
  layQty: number;
  status: string;
}

export interface CreateCuttingOutputRequest {
  companyId: Guid;
  cuttingPlanId: Guid;
  cuttingLayId?: Guid;
  orderId: Guid;
  outputDate: string;
  colorName?: string;
  sizeName: string;
  outputQty: number;
  isOverageApproved?: boolean;
}

export interface CreateCuttingWastageRequest {
  companyId: Guid;
  cuttingPlanId: Guid;
  orderId: Guid;
  wastageDate: string;
  fabricItemId?: Guid;
  wastageQty: number;
  wastageReason: string;
}

export interface CreatePanelTransferItemRequest {
  colorName?: string;
  sizeName: string;
  transferQty: number;
}

export interface CreatePanelTransferRequest {
  companyId: Guid;
  orderId: Guid;
  cuttingPlanId: Guid;
  transferNo: string;
  transferDate: string;
  toDepartment?: string;
  items: CreatePanelTransferItemRequest[];
}

export interface CreateCuttingBundleRequest {
  companyId: Guid;
  orderId: Guid;
  cuttingPlanId: Guid;
  cuttingLayId?: Guid;
  cuttingOutputId?: Guid;
  bundleTag: string;
  sizeName: string;
  pieceCount: number;
  serialFrom?: number;
  serialTo?: number;
  serialRange?: string;
  weightKg?: number;
  currentLocation?: string;
  styleName?: string;
}

export interface UpdateCuttingBundleRequest {
  sizeName: string;
  pieceCount: number;
  serialFrom?: number;
  serialTo?: number;
  serialRange?: string;
  weightKg?: number;
  currentLocation?: string;
}

export interface UpdateBundleStatusRequest {
  status: string;
  currentLocation?: string;
}

export interface CuttingReportExportRequest {
  companyId: Guid;
  orderId?: Guid;
  reportType: string;
  fromDate?: string;
  toDate?: string;
  format: string;
}
