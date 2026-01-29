import { PurchaseOrderStatus } from '../enums';

/**
 * PurchaseOrder Entity
 * Represents a purchase order placed with a supplier
 * Database table: purchase_orders
 * Owner Module: M-06 Procurement
 */
export interface PurchaseOrder {
  id: string;
  po_number: string;
  supplier_id: string;
  order_date: string;
  total_amount: number;
  status: PurchaseOrderStatus;
  notes: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface PurchaseOrderInsert {
  id?: string;
  po_number: string;
  supplier_id: string;
  order_date: string;
  total_amount: number;
  status?: PurchaseOrderStatus;
  notes?: string | null;
  created_at?: string;
  updated_at?: string | null;
}

export interface PurchaseOrderUpdate {
  id?: string;
  po_number?: string;
  supplier_id?: string;
  order_date?: string;
  total_amount?: number;
  status?: PurchaseOrderStatus;
  notes?: string | null;
  updated_at?: string | null;
}

export interface PurchaseOrderWithRelations extends PurchaseOrder {
  supplier?: {
    id: string;
    name: string;
  };
  items?: {
    id: string;
    brand: string;
    model: string;
    quantity: number;
    unit_cost: number;
  }[];
}
