/**
 * StockAlertConfig Model
 * Configuration for dashboard stock alerts
 * Feature: F-008 Automatic Inventory Deduction (allowOversell configuration)
 */
export interface StockAlertConfig {
  id: string;
  lowStockThreshold: number;
  enableBrandZeroAlert: boolean;
  /**
   * When true, system displays warning but allows sale completion when attempting
   * to sell items with insufficient stock or reserved status.
   * When false, sale is blocked if any item is unavailable.
   * Feature: F-008 Automatic Inventory Deduction
   */
  allowOversell: boolean;
  createdAt: string;
  updatedAt: string | null;
}

export interface UpdateStockAlertConfigRequest {
  lowStockThreshold?: number;
  enableBrandZeroAlert?: boolean;
  /** Feature: F-008 Automatic Inventory Deduction */
  allowOversell?: boolean;
}

export interface StockAlert {
  type: 'low_stock' | 'brand_zero';
  brandId?: string;
  brandName?: string;
  currentStock: number;
  threshold: number;
  message: string;
}

export interface StockAlertsResponse {
  alerts: StockAlert[];
  config: StockAlertConfig;
}
