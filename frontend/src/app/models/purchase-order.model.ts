import { PurchaseOrderStatus, PhoneCondition } from '../enums';

/**
 * PurchaseOrder Model
 * Represents a purchase order placed with a supplier
 */
export interface PurchaseOrderItem {
  id: string;
  purchaseOrderId: string;
  brand: string;
  model: string;
  quantity: number;
  unitCost: number;
  lineTotal: number;
  createdAt: string;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplierId: string;
  supplierName: string;
  orderDate: string;
  totalAmount: number;
  status: PurchaseOrderStatus;
  notes: string | null;
  items: PurchaseOrderItem[];
  createdAt: string;
  updatedAt: string | null;
}

export interface CreatePurchaseOrderItemRequest {
  brand: string;
  model: string;
  quantity: number;
  unitCost: number;
}

export interface CreatePurchaseOrderRequest {
  supplierId: string;
  orderDate: string;
  notes?: string | null;
  items: CreatePurchaseOrderItemRequest[];
}

export interface UpdatePurchaseOrderRequest {
  supplierId?: string;
  orderDate?: string;
  notes?: string | null;
}

export interface PurchaseOrderListResponse {
  data: PurchaseOrder[];
  total: number;
}

export interface PurchaseOrderFilter {
  supplierId?: string;
  status?: PurchaseOrderStatus;
  startDate?: string;
  endDate?: string;
}

/**
 * Receiving Workflow Models (F-023)
 * Used for the Purchase Order receiving process
 */

/**
 * Represents a single phone record to be created during receiving
 * Pre-filled with brand/model from PO item, admin fills in rest
 */
export interface ReceivingPhoneRecord {
  /** Index of the PO line item this phone belongs to */
  lineItemIndex: number;
  /** Brand name from the PO item (pre-filled) */
  brand: string;
  /** Model name from the PO item (pre-filled) */
  model: string;
  /** Color of the phone */
  color?: string | null;
  /** IMEI number (unique per phone) */
  imei?: string | null;
  /** Phone condition */
  condition: PhoneCondition;
  /** Battery health percentage (0-100), applicable for used/refurbished */
  batteryHealth?: number | null;
  /** Storage capacity in GB */
  storageGb?: number | null;
  /** RAM in GB */
  ramGb?: number | null;
  /** Selling price for this phone */
  sellingPrice: number;
  /** Optional notes for this phone */
  notes?: string | null;
}

/**
 * Request for the receiving workflow
 * Contains all phone records to be created when marking PO as received
 */
export interface ReceivePurchaseOrderRequest {
  /** Array of phone records, one for each unit in the PO */
  phones: ReceivingPhoneRecord[];
}

/**
 * Response from the receiving workflow
 * Returns the updated PO and count of created phones
 */
export interface ReceivePurchaseOrderResponse {
  /** The updated purchase order with status = 'received' */
  purchaseOrder: PurchaseOrder;
  /** Number of phone records created */
  phonesCreated: number;
  /** IDs of the created phones */
  createdPhoneIds: string[];
}
