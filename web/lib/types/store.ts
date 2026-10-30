/** Store API types (Guid-based, matches StoreService DTOs). */

export type Guid = string;

export interface ItemCategory {
  id: Guid;
  companyId: Guid;
  categoryName: string;
  description?: string | null;
  isActive: boolean;
}

export interface StoreUnit {
  id: Guid;
  companyId: Guid;
  unitName: string;
  shortName: string;
  unitType?: string | null;
  isActive: boolean;
}

export interface StoreItem {
  id: Guid;
  companyId: Guid;
  itemCode: string;
  itemName: string;
  categoryId: Guid;
  categoryName?: string | null;
  unitId: Guid;
  unitName?: string | null;
  openingStock: number;
  currentStock: number;
  minimumStockLevel: number;
  unitPrice: number;
  description?: string | null;
  isActive: boolean;
  inventoryItemId?: Guid | null;
}

export interface StoreBuyer {
  id: Guid;
  companyId: Guid;
  buyerName: string;
  country?: string | null;
  contactPerson?: string | null;
  email?: string | null;
  phone?: string | null;
  isActive: boolean;
}

export interface StoreOrderLine {
  id: Guid;
  itemId: Guid;
  itemName?: string | null;
  quantity: number;
  unitPrice: number;
  unitName?: string | null;
  lineTotal: number;
}

export interface StoreOrder {
  id: Guid;
  companyId: Guid;
  orderNumber: string;
  buyerId: Guid;
  buyerName: string;
  orderDate: string;
  status: string;
  remarks?: string | null;
  orderItemsCount: number;
  lines: StoreOrderLine[];
}

export interface StoreBooking {
  id: Guid;
  companyId: Guid;
  bookingNumber: string;
  orderId: Guid;
  orderNumber: string;
  itemId: Guid;
  itemName: string;
  itemCode: string;
  unitName?: string | null;
  bookedQuantity: number;
  issuedQty: number;
  bookingDate: string;
  bookingType: string;
  status: string;
  remarks?: string | null;
}

export interface GrnLine {
  id: Guid;
  itemId?: Guid | null;
  itemName: string;
  quantity: number;
  rate: number;
  lineTotal: number;
}

export interface Grn {
  id: Guid;
  companyId: Guid;
  grnNo: string;
  grnDate: string;
  supplier: string;
  poReference?: string | null;
  status: string;
  totalAmount: number;
  lines: GrnLine[];
}

export interface StockTransaction {
  id: Guid;
  companyId: Guid;
  transactionNumber: string;
  itemId: Guid;
  itemName?: string | null;
  transactionType: string;
  quantity: number;
  referenceNumber?: string | null;
  departmentOrLine?: string | null;
  locationOrBin?: string | null;
  supplierName?: string | null;
  transactionDate: string;
}

export interface StockDashboardSummary {
  totalStockValue: number;
  activeSKUs: number;
  lowStockItems: number;
  totalOrders: number;
  pendingBookings: number;
}

export interface StockLedgerEntry {
  transactionId: Guid;
  transactionNumber: string;
  transactionDate: string;
  transactionType: string;
  quantityIn: number;
  quantityOut: number;
  runningBalance: number;
  referenceNumber?: string | null;
}

export interface OrderConsumptionLine {
  orderId: Guid;
  orderNumber: string;
  itemId: Guid;
  itemName: string;
  bookedQuantity: number;
  issuedQuantity: number;
  consumedQuantity: number;
}

export interface BookingVsIssueLine {
  bookingId: Guid;
  bookingNumber: string;
  orderNumber: string;
  itemName: string;
  bookedQuantity: number;
  issuedQty: number;
  remaining: number;
}

export interface CreateItemCategoryRequest {
  companyId: Guid;
  categoryName: string;
  description?: string;
}

export interface UpdateItemCategoryRequest {
  categoryName: string;
  description?: string;
  isActive: boolean;
}

export interface CreateStoreUnitRequest {
  companyId: Guid;
  unitName: string;
  shortName: string;
  unitType?: string;
}

export interface UpdateStoreUnitRequest {
  unitName: string;
  shortName: string;
  unitType?: string;
  isActive: boolean;
}

export interface CreateStoreItemRequest {
  companyId: Guid;
  itemCode: string;
  itemName: string;
  categoryId: Guid;
  unitId: Guid;
  openingStock: number;
  minimumStockLevel: number;
  unitPrice: number;
  description?: string;
}

export interface UpdateStoreItemRequest {
  itemName: string;
  categoryId: Guid;
  unitId: Guid;
  minimumStockLevel: number;
  unitPrice: number;
  description?: string;
  isActive: boolean;
}

export interface CreateStoreBuyerRequest {
  companyId: Guid;
  buyerName: string;
  country?: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
}

export interface UpdateStoreBuyerRequest {
  buyerName: string;
  country?: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  isActive: boolean;
}

export interface CreateStoreOrderLineRequest {
  itemId: Guid;
  quantity: number;
  unitPrice: number;
  unitName?: string;
}

export interface CreateStoreOrderRequest {
  companyId: Guid;
  orderNumber: string;
  buyerId: Guid;
  orderDate: string;
  remarks?: string;
  lines: CreateStoreOrderLineRequest[];
}

export interface UpdateStoreOrderRequest {
  status: string;
  remarks?: string;
}

export interface CreateStoreBookingRequest {
  companyId: Guid;
  orderId: Guid;
  itemId: Guid;
  bookingType: string;
  bookedQuantity: number;
  bookingDate: string;
  remarks?: string;
}

export interface UpdateStoreBookingRequest {
  bookedQuantity: number;
  status: string;
  remarks?: string;
}

export interface IssueBookingRequest {
  quantity: number;
}

export interface StockMovementRequest {
  companyId: Guid;
  itemId: Guid;
  quantity: number;
  referenceNumber?: string;
  departmentOrLine?: string;
  locationOrBin?: string;
  supplierName?: string;
  transactionDate?: string;
}

export interface CreateGrnLineRequest {
  itemId?: Guid;
  itemName: string;
  quantity: number;
  rate: number;
}

export interface CreateGrnRequest {
  companyId: Guid;
  grnNo: string;
  grnDate: string;
  supplier: string;
  poReference?: string;
  lines: CreateGrnLineRequest[];
}

export interface UpdateGrnRequest {
  status: string;
  poReference?: string;
}
