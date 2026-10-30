import { merchandisingService } from "@/lib/services/merchandising";
import type { Guid, Order } from "@/lib/types/merchandising";

export interface ProductionOrderOption {
  orderId: Guid;
  orderNo: string;
  buyerName: string;
  totalOrderQty: number;
  orderStatus: string;
  label: string;
}

export async function getProductionOrders(companyId: Guid): Promise<Order[]> {
  return merchandisingService.getOrders(companyId);
}

export async function getProductionOrderOptions(companyId: Guid): Promise<ProductionOrderOption[]> {
  const [orders, buyers] = await Promise.all([
    merchandisingService.getOrders(companyId),
    merchandisingService.getBuyers(companyId),
  ]);
  const buyerMap = new Map(buyers.map((b) => [b.id, b.buyerName]));
  return orders.map((o) => {
    const buyerName = buyerMap.get(o.buyerId) ?? "—";
    return {
      orderId: o.id,
      orderNo: o.orderNo,
      buyerName,
      totalOrderQty: o.totalOrderQty,
      orderStatus: o.orderStatus,
      label: `${o.orderNo} · ${buyerName}`,
    };
  });
}
