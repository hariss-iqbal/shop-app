/**
 * PurchaseOrderItem Entity
 * Line item within a purchase order
 * Database table: purchase_order_items
 * Owner Module: M-06 Procurement
 */
export interface PurchaseOrderItem {
  id: string;
  purchase_order_id: string;
  brand: string;
  model: string;
  quantity: number;
  unit_cost: number;
  created_at: string;
}

export interface PurchaseOrderItemInsert {
  id?: string;
  purchase_order_id: string;
  brand: string;
  model: string;
  quantity: number;
  unit_cost: number;
  created_at?: string;
}

export interface PurchaseOrderItemUpdate {
  id?: string;
  purchase_order_id?: string;
  brand?: string;
  model?: string;
  quantity?: number;
  unit_cost?: number;
}
