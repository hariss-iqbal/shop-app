/**
 * StockAlertConfig DTOs
 * Data Transfer Objects for StockAlertConfig entity
 */

export interface UpdateStockAlertConfigDto {
  lowStockThreshold?: number;
  enableBrandZeroAlert?: boolean;
}

export interface StockAlertConfigResponseDto {
  id: string;
  lowStockThreshold: number;
  enableBrandZeroAlert: boolean;
  createdAt: string;
  updatedAt: string | null;
}

export interface StockAlertDto {
  type: 'low_stock' | 'brand_zero';
  brandId?: string;
  brandName?: string;
  currentStock: number;
  threshold: number;
  message: string;
}

export interface StockAlertsResponseDto {
  alerts: StockAlertDto[];
  config: StockAlertConfigResponseDto;
}
