/**
 * Purchase order status enumeration - stored in database
 */
export enum PurchaseOrderStatus {
  PENDING = 'pending',
  RECEIVED = 'received',
  CANCELLED = 'cancelled'
}

export const PurchaseOrderStatusLabels: Record<PurchaseOrderStatus, string> = {
  [PurchaseOrderStatus.PENDING]: 'Pending',
  [PurchaseOrderStatus.RECEIVED]: 'Received',
  [PurchaseOrderStatus.CANCELLED]: 'Cancelled'
};

export const PurchaseOrderStatusColors: Record<PurchaseOrderStatus, string> = {
  [PurchaseOrderStatus.PENDING]: 'warning',
  [PurchaseOrderStatus.RECEIVED]: 'success',
  [PurchaseOrderStatus.CANCELLED]: 'danger'
};
