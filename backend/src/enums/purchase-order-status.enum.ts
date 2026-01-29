/**
 * Purchase order status enumeration - stored in database
 * Used for PurchaseOrder.status field
 */
export enum PurchaseOrderStatus {
  PENDING = 'pending',
  RECEIVED = 'received',
  CANCELLED = 'cancelled'
}
