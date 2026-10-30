import api from '@/lib/api';
import { unwrapApiData } from '@/lib/api-response';
import { getActiveCompanyHeaderValue } from '@/lib/active-company-storage';
import { downloadBlob } from '@/lib/services/api-helpers';

export type * from '@/lib/types/merchandising';

import type {
  AddQuotationNegotiationRequest,
  ApprovalRequest,
  ApproveStepRequest,
  BomCalculationResult,
  BomItem,
  BookingAllocation,
  BookingStatusReportRow,
  Buyer,
  BuyerContact,
  BuyerComplianceRule,
  BuyerPaymentTerm,
  BuyerPurchaseOrder,
  ColorSizeBreakdown,
  CommunicationLog,
  ConvertQuotationToOrderRequest,
  CreateApprovalRequestRequest,
  CreateBomItemRequest,
  CreateBuyerPoRequest,
  CreateBuyerRequest,
  CreateColorSizeBreakdownRequest,
  CreateCommunicationLogRequest,
  CreateMasterDataRequest,
  CreateMaterialBookingRequest,
  CreateOrderCostingRequest,
  CreateOrderDocumentRequest,
  CreateOrderRequest,
  ColorImportResultDto,
  OrderImportPreviewDto,
  OrderImportResultDto,
  OrderImportRowDto,
  CreatePurchaseRequisitionRequest,
  CreateQuotationRequest,
  CreateSampleCostingRequest,
  CreateSampleRequest,
  CreateShipmentPlanRequest,
  CreateStyleDocumentRequest,
  CreateStyleRequest,
  FabricBookingDetail,
  GarmentItem,
  Guid,
  MasterDataDto,
  MasterDataResource,
  MaterialBooking,
  Order,
  OrderAssignment,
  OrderCommercialTerms,
  OrderCosting,
  OrderDetails,
  OrderDocument,
  OrderPipelineReportRow,
  PackingList,
  ProgramOrderWorksheet,
  PurchaseRequisition,
  Quotation,
  QuotationNegotiation,
  RejectStepRequest,
  Sample,
  SampleCosting,
  Season,
  ShipmentExecution,
  ShipmentPlan,
  Style,
  StyleBomItem,
  StyleDocument,
  StyleVersion,
  TnaCalendar,
  TnaDelayLog,
  TnaDelayReportRow,
  TnaMilestone,
  TnaTemplate,
  TrimsBookingDetail,
  UpdateBomItemRequest,
  UpdateBuyerPoRequest,
  UpdateBuyerRequest,
  UpdateColorSizeBreakdownRequest,
  UpdateMasterDataRequest,
  UpdateOrderRequest,
  UpdateQuotationRequest,
  UpdateShipmentPlanRequest,
  UpdateStyleRequest,
} from '@/lib/types/merchandising';

const BASE = 'merchandising';

function companyGuid(companyId?: Guid): Guid {
  if (companyId?.includes('-')) return companyId;
  return getActiveCompanyHeaderValue() ?? companyId ?? '';
}

function params(companyId?: Guid, extra?: Record<string, string | undefined>): Record<string, string> {
  const out: Record<string, string> = { companyId: companyGuid(companyId) };
  if (extra) {
    for (const [k, v] of Object.entries(extra)) {
      if (v !== undefined && v !== '') out[k] = v;
    }
  }
  return out;
}

async function downloadCsv(path: string, filename: string, companyId?: Guid, extra?: Record<string, string | undefined>) {
  const res = await api.get(path, { params: params(companyId, extra), responseType: 'blob' });
  downloadBlob(res.data, filename, 'text/csv');
}

export const merchandisingService = {
  /* ── Buyers ── */
  async getBuyers(companyId?: Guid): Promise<Buyer[]> {
    const res = await api.get(`${BASE}/buyers`, { params: params(companyId) });
    return unwrapApiData<Buyer[]>(res.data);
  },

  async getBuyerById(id: Guid, companyId?: Guid): Promise<Buyer> {
    const res = await api.get(`${BASE}/buyers/${id}`, { params: params(companyId) });
    return unwrapApiData<Buyer>(res.data);
  },

  async createBuyer(payload: CreateBuyerRequest): Promise<Buyer> {
    const res = await api.post(`${BASE}/buyers`, payload);
    return unwrapApiData<Buyer>(res.data);
  },

  async updateBuyer(id: Guid, payload: UpdateBuyerRequest): Promise<Buyer> {
    const res = await api.put(`${BASE}/buyers/${id}`, payload);
    return unwrapApiData<Buyer>(res.data);
  },

  async activateBuyer(id: Guid): Promise<Buyer> {
    const res = await api.patch(`${BASE}/buyers/${id}/activate`);
    return unwrapApiData<Buyer>(res.data);
  },

  async deactivateBuyer(id: Guid): Promise<Buyer> {
    const res = await api.patch(`${BASE}/buyers/${id}/deactivate`);
    return unwrapApiData<Buyer>(res.data);
  },

  async getBuyerContacts(buyerId: Guid): Promise<BuyerContact[]> {
    const res = await api.get(`${BASE}/buyers/${buyerId}/contacts`);
    return unwrapApiData<BuyerContact[]>(res.data);
  },

  async createBuyerContact(payload: {
    companyId: Guid;
    buyerId: Guid;
    name: string;
    email?: string;
    phone?: string;
    role?: string;
  }): Promise<BuyerContact> {
    const res = await api.post(`${BASE}/buyers/contacts`, payload);
    return unwrapApiData<BuyerContact>(res.data);
  },

  async getBuyerPaymentTerms(buyerId: Guid): Promise<BuyerPaymentTerm[]> {
    const res = await api.get(`${BASE}/buyers/${buyerId}/payment-terms`);
    return unwrapApiData<BuyerPaymentTerm[]>(res.data);
  },

  async getBuyerComplianceRules(buyerId: Guid): Promise<BuyerComplianceRule[]> {
    const res = await api.get(`${BASE}/buyers/${buyerId}/compliance-rules`);
    return unwrapApiData<BuyerComplianceRule[]>(res.data);
  },

  async createBuyerPaymentTerm(payload: {
    companyId: Guid;
    buyerId: Guid;
    termName: string;
    days: number;
    description?: string;
  }): Promise<BuyerPaymentTerm> {
    const res = await api.post(`${BASE}/buyers/payment-terms`, payload);
    return unwrapApiData<BuyerPaymentTerm>(res.data);
  },

  async createBuyerComplianceRule(payload: {
    companyId: Guid;
    buyerId: Guid;
    ruleName: string;
    ruleType: string;
    description?: string;
    isMandatory: boolean;
  }): Promise<BuyerComplianceRule> {
    const res = await api.post(`${BASE}/buyers/compliance-rules`, payload);
    return unwrapApiData<BuyerComplianceRule>(res.data);
  },

  /* ── Catalog: seasons, garment items, styles ── */
  async getSeasons(companyId?: Guid): Promise<Season[]> {
    const res = await api.get(`${BASE}/seasons`, { params: params(companyId) });
    return unwrapApiData<Season[]>(res.data);
  },

  async createSeason(payload: {
    companyId: Guid;
    seasonCode: string;
    seasonName: string;
    yearNo?: number;
  }): Promise<Season> {
    const res = await api.post(`${BASE}/seasons`, payload);
    return unwrapApiData<Season>(res.data);
  },

  async getGarmentItems(companyId?: Guid): Promise<GarmentItem[]> {
    const res = await api.get(`${BASE}/garment-items`, { params: params(companyId) });
    return unwrapApiData<GarmentItem[]>(res.data);
  },

  async createGarmentItem(payload: {
    companyId: Guid;
    itemCode: string;
    itemName: string;
    category?: string;
  }): Promise<GarmentItem> {
    const res = await api.post(`${BASE}/garment-items`, payload);
    return unwrapApiData<GarmentItem>(res.data);
  },

  async getStyles(companyId?: Guid, buyerId?: Guid): Promise<Style[]> {
    const res = await api.get(`${BASE}/styles`, {
      params: params(companyId, buyerId ? { buyerId } : undefined),
    });
    return unwrapApiData<Style[]>(res.data);
  },

  async getStyleById(id: Guid, companyId?: Guid): Promise<Style> {
    const res = await api.get(`${BASE}/styles/${id}`, { params: params(companyId) });
    return unwrapApiData<Style>(res.data);
  },

  async createStyle(payload: CreateStyleRequest): Promise<Style> {
    const res = await api.post(`${BASE}/styles`, payload);
    return unwrapApiData<Style>(res.data);
  },

  async updateStyle(id: Guid, payload: UpdateStyleRequest): Promise<Style> {
    const res = await api.put(`${BASE}/styles/${id}`, payload);
    return unwrapApiData<Style>(res.data);
  },

  async getStyleVersions(styleId: Guid): Promise<StyleVersion[]> {
    const res = await api.get(`${BASE}/styles/${styleId}/versions`);
    return unwrapApiData<StyleVersion[]>(res.data);
  },

  async createStyleVersion(payload: {
    companyId: Guid;
    styleId: Guid;
    versionNo: number;
    description?: string;
    effectiveDate: string;
  }): Promise<StyleVersion> {
    const res = await api.post(`${BASE}/styles/versions`, payload);
    return unwrapApiData<StyleVersion>(res.data);
  },

  async getStyleBomItems(styleId: Guid): Promise<StyleBomItem[]> {
    const res = await api.get(`${BASE}/styles/${styleId}/bom-items`);
    return unwrapApiData<StyleBomItem[]>(res.data);
  },

  async createStyleBomItem(payload: {
    companyId: Guid;
    styleId: Guid;
    itemType: string;
    itemCode?: string;
    itemName: string;
    unitName: string;
    consumption: number;
    wastagePercent: number;
    unitPrice: number;
  }): Promise<StyleBomItem> {
    const res = await api.post(`${BASE}/styles/bom-items`, payload);
    return unwrapApiData<StyleBomItem>(res.data);
  },

  /* ── Master data (colors, sizes, units, suppliers, brands, …) ── */
  async getMasterData(resource: MasterDataResource, companyId?: Guid): Promise<MasterDataDto[]> {
    const res = await api.get(`${BASE}/master/${resource}`, { params: params(companyId) });
    return unwrapApiData<MasterDataDto[]>(res.data);
  },

  async getMasterDataById(resource: MasterDataResource, id: Guid, companyId?: Guid): Promise<MasterDataDto> {
    const res = await api.get(`${BASE}/master/${resource}/${id}`, { params: params(companyId) });
    return unwrapApiData<MasterDataDto>(res.data);
  },

  async createMasterData(resource: MasterDataResource, payload: CreateMasterDataRequest): Promise<MasterDataDto> {
    const res = await api.post(`${BASE}/master/${resource}`, payload);
    return unwrapApiData<MasterDataDto>(res.data);
  },

  async updateMasterData(resource: MasterDataResource, id: Guid, payload: UpdateMasterDataRequest): Promise<MasterDataDto> {
    const res = await api.put(`${BASE}/master/${resource}/${id}`, payload);
    return unwrapApiData<MasterDataDto>(res.data);
  },

  async deleteMasterData(resource: MasterDataResource, id: Guid): Promise<boolean> {
    const res = await api.delete(`${BASE}/master/${resource}/${id}`);
    return unwrapApiData<boolean>(res.data);
  },

  async downloadColorImportTemplate(): Promise<void> {
    const res = await api.get(`${BASE}/master/colors/template`, { responseType: 'blob' });
    downloadBlob(res.data, 'color-import-template.csv', 'text/csv');
  },

  async importColors(file: File, companyId?: Guid): Promise<ColorImportResultDto> {
    const cid = companyId ?? getActiveCompanyHeaderValue();
    if (!cid) throw new Error('No active company selected');
    const formData = new FormData();
    formData.append('file', file);
    const res = await api.post(`${BASE}/master/colors/import`, formData, {
      params: { companyId: cid },
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return unwrapApiData<ColorImportResultDto>(res.data);
  },

  getColors: (companyId?: Guid) => merchandisingService.getMasterData('colors', companyId),
  getSizes: (companyId?: Guid) => merchandisingService.getMasterData('sizes', companyId),
  getUnits: (companyId?: Guid) => merchandisingService.getMasterData('units', companyId),
  getSuppliers: (companyId?: Guid) => merchandisingService.getMasterData('suppliers', companyId),
  getBrands: (companyId?: Guid) => merchandisingService.getMasterData('brands', companyId),
  /** Brands linked to a buyer via master-data `extra` field (buyer GUID). */
  getBrandsByBuyer: async (buyerId: Guid, companyId?: Guid): Promise<MasterDataDto[]> => {
    const brands = await merchandisingService.getBrands(companyId);
    return brands.filter((b) => b.extra === buyerId);
  },

  getBrandsForBuyer: (buyerId: Guid, companyId?: Guid) =>
    merchandisingService.getBrandsByBuyer(buyerId, companyId),

  /* ── Orders ── */
  async getOrders(companyId?: Guid, buyerId?: Guid, status?: string): Promise<Order[]> {
    const res = await api.get(`${BASE}/orders`, {
      params: params(companyId, { buyerId, status }),
    });
    return unwrapApiData<Order[]>(res.data);
  },

  async getOrderById(id: Guid, companyId?: Guid): Promise<Order> {
    const res = await api.get(`${BASE}/orders/${id}`, { params: params(companyId) });
    return unwrapApiData<Order>(res.data);
  },

  async getOrderDetails(orderId: Guid): Promise<OrderDetails> {
    const res = await api.get(`${BASE}/orders/${orderId}/details`);
    return unwrapApiData<OrderDetails>(res.data);
  },

  async createOrder(payload: CreateOrderRequest): Promise<Order> {
    const res = await api.post(`${BASE}/orders`, payload);
    return unwrapApiData<Order>(res.data);
  },

  async updateOrder(id: Guid, payload: UpdateOrderRequest): Promise<Order> {
    const res = await api.put(`${BASE}/orders/${id}`, payload);
    return unwrapApiData<Order>(res.data);
  },

  async confirmOrder(id: Guid, createRequisition = false): Promise<Order> {
    const res = await api.patch(`${BASE}/orders/${id}/confirm`, null, {
      params: { createRequisition: String(createRequisition) },
    });
    return unwrapApiData<Order>(res.data);
  },

  async cancelOrder(id: Guid): Promise<Order> {
    const res = await api.patch(`${BASE}/orders/${id}/cancel`);
    return unwrapApiData<Order>(res.data);
  },

  async getOrderWorksheet(orderId: Guid): Promise<ProgramOrderWorksheet> {
    const res = await api.get(`${BASE}/orders/${orderId}/worksheet`);
    return unwrapApiData<ProgramOrderWorksheet>(res.data);
  },

  async copyStyleBomToOrder(orderId: Guid, companyId: Guid): Promise<BomItem[]> {
    const res = await api.post(`${BASE}/orders/${orderId}/copy-style-bom`, { companyId });
    return unwrapApiData<BomItem[]>(res.data);
  },

  async createOrderAssignment(orderId: Guid, payload: {
    companyId: Guid;
    assignedTo: string;
    role: string;
  }): Promise<OrderAssignment> {
    const res = await api.post(`${BASE}/orders/${orderId}/assignment`, payload);
    return unwrapApiData<OrderAssignment>(res.data);
  },

  async createOrderCommercialTerms(orderId: Guid, payload: {
    companyId: Guid;
    paymentTerms?: string;
    incoterms?: string;
    lcBank?: string;
    commission: number;
  }): Promise<OrderCommercialTerms> {
    const res = await api.post(`${BASE}/orders/${orderId}/commercial-terms`, payload);
    return unwrapApiData<OrderCommercialTerms>(res.data);
  },

  /* ── Buyer POs ── */
  async getBuyerPos(orderId: Guid): Promise<BuyerPurchaseOrder[]> {
    const res = await api.get(`${BASE}/orders/${orderId}/buyer-pos`);
    return unwrapApiData<BuyerPurchaseOrder[]>(res.data);
  },

  async createBuyerPo(orderId: Guid, payload: CreateBuyerPoRequest): Promise<BuyerPurchaseOrder> {
    const res = await api.post(`${BASE}/orders/${orderId}/buyer-pos`, payload);
    return unwrapApiData<BuyerPurchaseOrder>(res.data);
  },

  async updateBuyerPo(id: Guid, payload: UpdateBuyerPoRequest): Promise<BuyerPurchaseOrder> {
    const res = await api.put(`${BASE}/buyer-pos/${id}`, payload);
    return unwrapApiData<BuyerPurchaseOrder>(res.data);
  },

  /* ── Color / size breakdown ── */
  async getColorSizeBreakdown(orderId: Guid): Promise<ColorSizeBreakdown[]> {
    const res = await api.get(`${BASE}/orders/${orderId}/color-size-breakdown`);
    return unwrapApiData<ColorSizeBreakdown[]>(res.data);
  },

  async createColorSizeBreakdown(orderId: Guid, payload: CreateColorSizeBreakdownRequest): Promise<ColorSizeBreakdown> {
    const res = await api.post(`${BASE}/orders/${orderId}/color-size-breakdown`, payload);
    return unwrapApiData<ColorSizeBreakdown>(res.data);
  },

  async updateColorSizeBreakdown(id: Guid, payload: UpdateColorSizeBreakdownRequest): Promise<ColorSizeBreakdown> {
    const res = await api.put(`${BASE}/color-size-breakdown/${id}`, payload);
    return unwrapApiData<ColorSizeBreakdown>(res.data);
  },

  async deleteColorSizeBreakdown(id: Guid): Promise<boolean> {
    const res = await api.delete(`${BASE}/color-size-breakdown/${id}`);
    return unwrapApiData<boolean>(res.data);
  },

  /* ── BOM ── */
  async getBomItems(orderId: Guid): Promise<BomItem[]> {
    const res = await api.get(`${BASE}/orders/${orderId}/bom-items`);
    return unwrapApiData<BomItem[]>(res.data);
  },

  async createBomItem(orderId: Guid, payload: CreateBomItemRequest): Promise<BomItem> {
    const res = await api.post(`${BASE}/orders/${orderId}/bom-items`, payload);
    return unwrapApiData<BomItem>(res.data);
  },

  async updateBomItem(id: Guid, payload: UpdateBomItemRequest): Promise<BomItem> {
    const res = await api.put(`${BASE}/bom-items/${id}`, payload);
    return unwrapApiData<BomItem>(res.data);
  },

  async deleteBomItem(id: Guid): Promise<boolean> {
    const res = await api.delete(`${BASE}/bom-items/${id}`);
    return unwrapApiData<boolean>(res.data);
  },

  async calculateBom(orderId: Guid): Promise<BomCalculationResult> {
    const res = await api.post(`${BASE}/orders/${orderId}/bom-calculate`);
    return unwrapApiData<BomCalculationResult>(res.data);
  },

  /* ── Costing ── */
  async getOrderCosting(orderId: Guid): Promise<OrderCosting | null> {
    const res = await api.get(`${BASE}/orders/${orderId}/costing`);
    return unwrapApiData<OrderCosting | null>(res.data);
  },

  async createOrderCosting(orderId: Guid, payload: CreateOrderCostingRequest): Promise<OrderCosting> {
    const res = await api.post(`${BASE}/orders/${orderId}/costing`, payload);
    return unwrapApiData<OrderCosting>(res.data);
  },

  async updateOrderCosting(orderId: Guid, payload: CreateOrderCostingRequest): Promise<OrderCosting> {
    const res = await api.put(`${BASE}/orders/${orderId}/costing`, payload);
    return unwrapApiData<OrderCosting>(res.data);
  },

  async submitCostingApproval(orderId: Guid, notes?: string): Promise<OrderCosting> {
    const res = await api.post(`${BASE}/orders/${orderId}/costing/submit-approval`, { notes });
    return unwrapApiData<OrderCosting>(res.data);
  },

  /* ── Order import / export ── */
  async previewOrderImport(file: File, companyId?: Guid): Promise<OrderImportPreviewDto> {
    const formData = new FormData();
    formData.append('file', file);
    const res = await api.post(`${BASE}/orders/import/preview`, formData, {
      params: companyId ? { companyId } : undefined,
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return unwrapApiData<OrderImportPreviewDto>(res.data);
  },

  async importOrders(payload: { companyId: Guid; rows: OrderImportRowDto[] }): Promise<OrderImportResultDto> {
    const res = await api.post(`${BASE}/orders/import`, payload);
    return unwrapApiData<OrderImportResultDto>(res.data);
  },

  async downloadOrderImportTemplate(): Promise<void> {
    const res = await api.get(`${BASE}/orders/template`, { responseType: 'blob' });
    downloadBlob(res.data, 'merchandising-orders-import-template.csv', 'text/csv');
  },

  async exportOrder(orderId: Guid): Promise<void> {
    const res = await api.get(`${BASE}/orders/${orderId}/export`, { responseType: 'blob' });
    downloadBlob(res.data, `order-${orderId}.xlsx`);
  },

  /* ── Samples ── */
  async getSamples(companyId?: Guid, styleId?: Guid): Promise<Sample[]> {
    const res = await api.get(`${BASE}/samples`, {
      params: params(companyId, styleId ? { styleId } : undefined),
    });
    return unwrapApiData<Sample[]>(res.data);
  },

  async createSample(payload: CreateSampleRequest): Promise<Sample> {
    const res = await api.post(`${BASE}/samples`, payload);
    return unwrapApiData<Sample>(res.data);
  },

  async approveSample(id: Guid): Promise<Sample> {
    const res = await api.patch(`${BASE}/samples/${id}/approve`);
    return unwrapApiData<Sample>(res.data);
  },

  async rejectSample(id: Guid): Promise<Sample> {
    const res = await api.patch(`${BASE}/samples/${id}/reject`);
    return unwrapApiData<Sample>(res.data);
  },

  async submitSample(id: Guid, payload: { submitDate: string; remarks?: string }): Promise<Sample> {
    const res = await api.patch(`${BASE}/samples/${id}/submit`, payload);
    return unwrapApiData<Sample>(res.data);
  },

  async reviseSample(id: Guid, payload: { remarks?: string }): Promise<Sample> {
    const res = await api.patch(`${BASE}/samples/${id}/revise`, payload);
    return unwrapApiData<Sample>(res.data);
  },

  async createSampleCosting(id: Guid, payload: CreateSampleCostingRequest): Promise<SampleCosting> {
    const res = await api.post(`${BASE}/samples/${id}/costing`, payload);
    return unwrapApiData<SampleCosting>(res.data);
  },

  /* ── Quotations ── */
  async getQuotations(companyId?: Guid, buyerId?: Guid): Promise<Quotation[]> {
    const res = await api.get(`${BASE}/quotations`, {
      params: params(companyId, buyerId ? { buyerId } : undefined),
    });
    return unwrapApiData<Quotation[]>(res.data);
  },

  async getQuotationById(id: Guid, companyId?: Guid): Promise<Quotation> {
    const res = await api.get(`${BASE}/quotations/${id}`, { params: params(companyId) });
    return unwrapApiData<Quotation>(res.data);
  },

  async createQuotation(payload: CreateQuotationRequest): Promise<Quotation> {
    const res = await api.post(`${BASE}/quotations`, payload);
    return unwrapApiData<Quotation>(res.data);
  },

  async updateQuotation(id: Guid, payload: UpdateQuotationRequest): Promise<Quotation> {
    const res = await api.put(`${BASE}/quotations/${id}`, payload);
    return unwrapApiData<Quotation>(res.data);
  },

  async getQuotationNegotiations(id: Guid, companyId?: Guid): Promise<QuotationNegotiation[]> {
    const res = await api.get(`${BASE}/quotations/${id}/negotiations`, { params: params(companyId) });
    return unwrapApiData<QuotationNegotiation[]>(res.data);
  },

  async addQuotationNegotiation(id: Guid, payload: AddQuotationNegotiationRequest): Promise<QuotationNegotiation> {
    const res = await api.post(`${BASE}/quotations/${id}/negotiations`, payload);
    return unwrapApiData<QuotationNegotiation>(res.data);
  },

  async convertQuotationToOrder(id: Guid, payload: ConvertQuotationToOrderRequest): Promise<Order> {
    const res = await api.post(`${BASE}/quotations/${id}/convert-to-order`, payload);
    return unwrapApiData<Order>(res.data);
  },

  /* ── TNA ── */
  async createTnaTemplate(payload: {
    companyId: Guid;
    templateName: string;
    description?: string;
    isDefault: boolean;
    milestones?: Array<{ milestoneName: string; sequenceNo: number; daysFromStart: number }>;
  }): Promise<TnaTemplate> {
    const res = await api.post(`${BASE}/tna/templates`, payload);
    return unwrapApiData<TnaTemplate>(res.data);
  },

  async generateTnaForOrder(orderId: Guid): Promise<TnaCalendar> {
    const res = await api.post(`${BASE}/tna/orders/${orderId}/generate`);
    return unwrapApiData<TnaCalendar>(res.data);
  },

  async getTnaByOrder(orderId: Guid): Promise<TnaCalendar | null> {
    const res = await api.get(`${BASE}/tna/orders/${orderId}`);
    return unwrapApiData<TnaCalendar | null>(res.data);
  },

  async updateTnaMilestone(id: Guid, payload: { actualDate?: string; status: string }): Promise<TnaMilestone> {
    const res = await api.put(`${BASE}/tna/milestones/${id}`, payload);
    return unwrapApiData<TnaMilestone>(res.data);
  },

  async logTnaDelay(milestoneId: Guid, payload: { companyId: Guid; delayDays: number; reason: string }): Promise<TnaDelayLog> {
    const res = await api.post(`${BASE}/tna/milestones/${milestoneId}/delays`, payload);
    return unwrapApiData<TnaDelayLog>(res.data);
  },

  /* ── Material bookings ── */
  async getMaterialBookings(companyId?: Guid, orderId?: Guid, itemType?: string): Promise<MaterialBooking[]> {
    const res = await api.get(`${BASE}/bookings`, {
      params: params(companyId, {
        ...(orderId ? { orderId } : {}),
        ...(itemType ? { itemType } : {}),
      }),
    });
    const rows = unwrapApiData<MaterialBooking[]>(res.data);
    if (!itemType) return rows;
    const normalized = itemType.toLowerCase();
    return rows.filter((b) => b.bookingType.toLowerCase() === normalized);
  },

  async createMaterialBooking(payload: CreateMaterialBookingRequest): Promise<MaterialBooking> {
    const res = await api.post(`${BASE}/bookings`, payload);
    return unwrapApiData<MaterialBooking>(res.data);
  },

  async autoCalculateBooking(id: Guid, companyId: Guid): Promise<MaterialBooking> {
    const res = await api.post(`${BASE}/bookings/${id}/auto-calculate`, { companyId });
    return unwrapApiData<MaterialBooking>(res.data);
  },

  async addFabricBookingDetail(id: Guid, payload: {
    companyId: Guid;
    fabricTypeId?: Guid;
    colorName: string;
    requiredQty: number;
    supplierId?: Guid;
  }): Promise<FabricBookingDetail> {
    const res = await api.post(`${BASE}/bookings/${id}/fabric-details`, payload);
    return unwrapApiData<FabricBookingDetail>(res.data);
  },

  async addTrimsBookingDetail(id: Guid, payload: {
    companyId: Guid;
    trimsTypeId?: Guid;
    itemName: string;
    requiredQty: number;
    supplierId?: Guid;
  }): Promise<TrimsBookingDetail> {
    const res = await api.post(`${BASE}/bookings/${id}/trims-details`, payload);
    return unwrapApiData<TrimsBookingDetail>(res.data);
  },

  async addBookingAllocation(id: Guid, payload: {
    companyId: Guid;
    detailId: Guid;
    detailType: string;
    allocatedQty: number;
    allocationDate: string;
  }): Promise<BookingAllocation> {
    const res = await api.post(`${BASE}/bookings/${id}/allocations`, payload);
    return unwrapApiData<BookingAllocation>(res.data);
  },

  /* ── Requisitions ── */
  async getRequisitions(companyId?: Guid, orderId?: Guid): Promise<PurchaseRequisition[]> {
    const res = await api.get(`${BASE}/requisitions`, {
      params: params(companyId, orderId ? { orderId } : undefined),
    });
    return unwrapApiData<PurchaseRequisition[]>(res.data);
  },

  async createRequisition(payload: CreatePurchaseRequisitionRequest): Promise<PurchaseRequisition> {
    const res = await api.post(`${BASE}/requisitions`, payload);
    return unwrapApiData<PurchaseRequisition>(res.data);
  },

  async submitRequisition(id: Guid): Promise<PurchaseRequisition> {
    const res = await api.post(`${BASE}/requisitions/${id}/submit`);
    return unwrapApiData<PurchaseRequisition>(res.data);
  },

  async createRequisitionFromOrder(orderId: Guid, payload: CreatePurchaseRequisitionRequest): Promise<PurchaseRequisition> {
    const res = await api.post(`${BASE}/requisitions/from-order/${orderId}`, payload);
    return unwrapApiData<PurchaseRequisition>(res.data);
  },

  /* ── Documents ── */
  async getStyleDocuments(styleId: Guid, companyId?: Guid): Promise<StyleDocument[]> {
    const res = await api.get(`${BASE}/styles/${styleId}/documents`, { params: params(companyId) });
    return unwrapApiData<StyleDocument[]>(res.data);
  },

  async createStyleDocument(styleId: Guid, payload: CreateStyleDocumentRequest): Promise<StyleDocument> {
    const res = await api.post(`${BASE}/styles/${styleId}/documents`, payload);
    return unwrapApiData<StyleDocument>(res.data);
  },

  async getOrderDocuments(orderId: Guid, companyId?: Guid): Promise<OrderDocument[]> {
    const res = await api.get(`${BASE}/orders/${orderId}/documents`, { params: params(companyId) });
    return unwrapApiData<OrderDocument[]>(res.data);
  },

  async createOrderDocument(orderId: Guid, payload: CreateOrderDocumentRequest): Promise<OrderDocument> {
    const res = await api.post(`${BASE}/orders/${orderId}/documents`, payload);
    return unwrapApiData<OrderDocument>(res.data);
  },

  /* ── Communications ── */
  async getCommunications(companyId?: Guid, styleId?: Guid, orderId?: Guid): Promise<CommunicationLog[]> {
    const res = await api.get(`${BASE}/communications`, {
      params: params(companyId, { styleId, orderId }),
    });
    return unwrapApiData<CommunicationLog[]>(res.data);
  },

  async createCommunication(payload: CreateCommunicationLogRequest): Promise<CommunicationLog> {
    const res = await api.post(`${BASE}/communications`, payload);
    return unwrapApiData<CommunicationLog>(res.data);
  },

  /* ── Approvals ── */
  async createApprovalRequest(payload: CreateApprovalRequestRequest): Promise<ApprovalRequest> {
    const res = await api.post(`${BASE}/approvals`, payload);
    return unwrapApiData<ApprovalRequest>(res.data);
  },

  async getApprovalRequest(id: Guid, companyId?: Guid): Promise<ApprovalRequest> {
    const res = await api.get(`${BASE}/approvals/${id}`, { params: params(companyId) });
    return unwrapApiData<ApprovalRequest>(res.data);
  },

  async getPendingApprovals(companyId?: Guid): Promise<ApprovalRequest[]> {
    const res = await api.get(`${BASE}/approvals/pending`, { params: params(companyId) });
    return unwrapApiData<ApprovalRequest[]>(res.data);
  },

  async approveStep(requestId: Guid, stepId: Guid, payload: ApproveStepRequest): Promise<ApprovalRequest> {
    const res = await api.post(`${BASE}/approvals/${requestId}/steps/${stepId}/approve`, payload);
    return unwrapApiData<ApprovalRequest>(res.data);
  },

  async rejectStep(requestId: Guid, stepId: Guid, payload: RejectStepRequest): Promise<ApprovalRequest> {
    const res = await api.post(`${BASE}/approvals/${requestId}/steps/${stepId}/reject`, payload);
    return unwrapApiData<ApprovalRequest>(res.data);
  },

  /* ── Shipment ── */
  async getShipmentPlans(companyId?: Guid, orderId?: Guid): Promise<ShipmentPlan[]> {
    const res = await api.get(`${BASE}/shipment-plans`, {
      params: params(companyId, orderId ? { orderId } : undefined),
    });
    return unwrapApiData<ShipmentPlan[]>(res.data);
  },

  async createShipmentPlan(payload: CreateShipmentPlanRequest): Promise<ShipmentPlan> {
    const res = await api.post(`${BASE}/shipment-plans`, payload);
    return unwrapApiData<ShipmentPlan>(res.data);
  },

  async updateShipmentPlan(id: Guid, payload: UpdateShipmentPlanRequest): Promise<ShipmentPlan> {
    const res = await api.put(`${BASE}/shipment-plans/${id}`, payload);
    return unwrapApiData<ShipmentPlan>(res.data);
  },

  async createShipmentExecution(payload: {
    companyId: Guid;
    shipmentPlanId: Guid;
    actualShipmentDate?: string;
    shippedQty: number;
    status?: string;
  }): Promise<ShipmentExecution> {
    const res = await api.post(`${BASE}/shipment-executions`, payload);
    return unwrapApiData<ShipmentExecution>(res.data);
  },

  async getShipmentExecutionByPlan(companyId: Guid, shipmentPlanId: Guid): Promise<ShipmentExecution | null> {
    const res = await api.get(`${BASE}/shipment-executions`, {
      params: { companyId, shipmentPlanId },
    });
    return unwrapApiData<ShipmentExecution | null>(res.data);
  },

  async createPackingList(payload: {
    companyId: Guid;
    shipmentExecutionId: Guid;
    cartonCount: number;
    grossWeightKg: number;
    netWeightKg: number;
    remarks?: string;
    cartons?: Array<{ cartonNo: number; colorName: string; sizeName: string; quantity: number }>;
  }): Promise<PackingList> {
    const res = await api.post(`${BASE}/shipment-executions/packing-lists`, payload);
    return unwrapApiData<PackingList>(res.data);
  },

  /* ── Reports ── */
  async getOrderSummaryReport(companyId?: Guid, buyerId?: Guid, status?: string): Promise<Order[]> {
    const res = await api.get(`${BASE}/reports/order-summary`, {
      params: params(companyId, { buyerId, status }),
    });
    return unwrapApiData<Order[]>(res.data);
  },

  async exportOrderSummaryReport(companyId?: Guid, buyerId?: Guid, status?: string): Promise<void> {
    await downloadCsv(`${BASE}/reports/order-summary.csv`, 'merchandising-order-summary.csv', companyId, { buyerId, status });
  },

  async getTnaDelayReport(companyId?: Guid): Promise<TnaDelayReportRow[]> {
    const res = await api.get(`${BASE}/reports/tna-delay`, { params: params(companyId) });
    return unwrapApiData<TnaDelayReportRow[]>(res.data);
  },

  async exportTnaDelayReport(companyId?: Guid): Promise<void> {
    await downloadCsv(`${BASE}/reports/tna-delay.csv`, 'merchandising-tna-delay.csv', companyId);
  },

  async getBookingStatusReport(companyId?: Guid, orderId?: Guid): Promise<BookingStatusReportRow[]> {
    const res = await api.get(`${BASE}/reports/booking-status`, {
      params: params(companyId, orderId ? { orderId } : undefined),
    });
    return unwrapApiData<BookingStatusReportRow[]>(res.data);
  },

  async exportBookingStatusReport(companyId?: Guid, orderId?: Guid): Promise<void> {
    await downloadCsv(`${BASE}/reports/booking-status.csv`, 'merchandising-booking-status.csv', companyId, orderId ? { orderId } : undefined);
  },

  async getOrderPipelineReport(companyId?: Guid): Promise<OrderPipelineReportRow[]> {
    const res = await api.get(`${BASE}/reports/order-pipeline`, { params: params(companyId) });
    return unwrapApiData<OrderPipelineReportRow[]>(res.data);
  },

  async exportOrderPipelineReport(companyId?: Guid): Promise<void> {
    await downloadCsv(`${BASE}/reports/order-pipeline.csv`, 'merchandising-order-pipeline.csv', companyId);
  },
};

export default merchandisingService;
