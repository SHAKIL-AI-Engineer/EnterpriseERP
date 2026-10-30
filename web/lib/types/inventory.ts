/** Inventory API types (Guid-based, matches InventoryService DTOs). */

export type Guid = string;

export interface StockItem {
  id: Guid;
  companyId: Guid;
  itemCode: string;
  itemName: string;
  unitName: string;
  balanceQty: number;
}

export interface StockTransaction {
  id: Guid;
  companyId: Guid;
  stockItemId: Guid;
  itemCode: string;
  itemName: string;
  transactionType: string;
  quantity: number;
  referenceNo?: string | null;
  transactionDate: string;
}

export interface ReceiveStockRequest {
  companyId: Guid;
  itemCode: string;
  itemName: string;
  unitName: string;
  quantity: number;
  referenceNo?: string;
}

export interface IssueStockRequest {
  companyId: Guid;
  quantity: number;
  referenceNo?: string;
}
