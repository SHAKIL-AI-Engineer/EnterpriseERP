export type Guid = string;

export interface SewingLine {
  id: Guid;
  companyId: Guid;
  serialNo: number;
  lineName: string;
  status: string;
}

export interface ProductionAssignment {
  id: Guid;
  companyId: Guid;
  orderId: Guid;
  sewingLineId: Guid;
  styleNo?: string;
  buyerName?: string;
  totalTarget: number;
  assignDate: string;
  status: string;
  lineName?: string;
}

export interface ProductionTarget {
  id: Guid;
  companyId: Guid;
  assignmentId: Guid;
  targetDate: string;
  dailyTarget: number;
  hourlyTarget: number;
  remarks?: string;
}

export interface DailyProductionRecord {
  id: Guid;
  companyId: Guid;
  assignmentId: Guid;
  recordDate: string;
  dailyTarget: number;
  hourlyTarget: number;
  h1: number;
  h2: number;
  h3: number;
  h4: number;
  h5: number;
  h6: number;
  h7: number;
  h8: number;
  h9: number;
  h10: number;
  h11: number;
  h12: number;
  h13: number;
  h14: number;
  h15: number;
  h16: number;
  h17: number;
  h18: number;
  h19: number;
  totalCompleted: number;
}

export interface LineCapacityPlan {
  id: Guid;
  companyId: Guid;
  orderId: Guid;
  lineCode: string;
  lineName: string;
  planDate: string;
  plannedQty: number;
  dailyCapacity: number;
  status: string;
}

export interface ShipmentExecution {
  id: Guid;
  companyId: Guid;
  orderId: Guid;
  merchandisingShipmentPlanId?: Guid;
  actualShipmentDate?: string;
  shippedQty: number;
  status: string;
  destination?: string;
}
