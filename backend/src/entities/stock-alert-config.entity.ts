/**
 * StockAlertConfig Entity
 * Singleton configuration entity for dashboard stock alerts
 * Database table: stock_alert_configs
 * Owner Module: M-09 Dashboard
 */
export interface StockAlertConfig {
  id: string;
  low_stock_threshold: number;
  enable_brand_zero_alert: boolean;
  allow_oversell: boolean;
  created_at: string;
  updated_at: string | null;
}

export interface StockAlertConfigInsert {
  id?: string;
  low_stock_threshold?: number;
  enable_brand_zero_alert?: boolean;
  allow_oversell?: boolean;
  created_at?: string;
  updated_at?: string | null;
}

export interface StockAlertConfigUpdate {
  id?: string;
  low_stock_threshold?: number;
  enable_brand_zero_alert?: boolean;
  allow_oversell?: boolean;
  updated_at?: string | null;
}
