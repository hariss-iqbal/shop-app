/**
 * Product status enumeration - stored in database
 */
export enum ProductStatus {
  AVAILABLE = 'available',
  SOLD = 'sold',
  RESERVED = 'reserved'
}

export const ProductStatusLabels: Record<ProductStatus, string> = {
  [ProductStatus.AVAILABLE]: 'Available',
  [ProductStatus.SOLD]: 'Sold',
  [ProductStatus.RESERVED]: 'Reserved'
};

export const ProductStatusColors: Record<ProductStatus, string> = {
  [ProductStatus.AVAILABLE]: 'success',
  [ProductStatus.SOLD]: 'danger',
  [ProductStatus.RESERVED]: 'warning'
};
