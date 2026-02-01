/**
 * Inventory Transfer Status Enum
 * Represents the status of an inventory transfer between locations
 * Feature: F-024 Multi-Location Inventory Support
 */
export enum InventoryTransferStatus {
  PENDING = 'pending',
  IN_TRANSIT = 'in_transit',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export const InventoryTransferStatusLabels: Record<InventoryTransferStatus, string> = {
  [InventoryTransferStatus.PENDING]: 'Pending',
  [InventoryTransferStatus.IN_TRANSIT]: 'In Transit',
  [InventoryTransferStatus.COMPLETED]: 'Completed',
  [InventoryTransferStatus.CANCELLED]: 'Cancelled'
};

export const InventoryTransferStatusSeverity: Record<InventoryTransferStatus, 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast'> = {
  [InventoryTransferStatus.PENDING]: 'warn',
  [InventoryTransferStatus.IN_TRANSIT]: 'info',
  [InventoryTransferStatus.COMPLETED]: 'success',
  [InventoryTransferStatus.CANCELLED]: 'danger'
};

export function isValidInventoryTransferStatus(value: string): value is InventoryTransferStatus {
  return Object.values(InventoryTransferStatus).includes(value as InventoryTransferStatus);
}

export function getInventoryTransferStatusLabel(status: InventoryTransferStatus): string {
  return InventoryTransferStatusLabels[status] || status;
}
