/**
 * StockAlertConfig Model
 * Configuration for dashboard stock alerts
 */
export interface StockAlertConfig {
  id: string;
  lowStockThreshold: number;
  enableBrandZeroAlert: boolean;
  createdAt: string;
  updatedAt: string | null;
}

export interface UpdateStockAlertConfigRequest {
  lowStockThreshold?: number;
  enableBrandZeroAlert?: boolean;
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
