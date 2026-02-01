import { SupabaseClient } from '@supabase/supabase-js';
import { StockAlertConfig, StockAlertConfigInsert, StockAlertConfigUpdate } from '../entities/stock-alert-config.entity';

/**
 * StockAlertConfig Repository
 * Handles database operations for StockAlertConfig entity
 * Table: stock_alert_configs
 * Note: This is a singleton table - only one row exists
 */
export class StockAlertConfigRepository {
  private readonly tableName = 'stock_alert_configs';

  constructor(private readonly supabase: SupabaseClient) {}

  async get(): Promise<StockAlertConfig | null> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async create(config: StockAlertConfigInsert): Promise<StockAlertConfig> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .insert(config)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async update(id: string, config: StockAlertConfigUpdate): Promise<StockAlertConfig> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .update(config)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getOrCreate(): Promise<StockAlertConfig> {
    const existing = await this.get();
    if (existing) {
      return existing;
    }

    return this.create({
      low_stock_threshold: 5,
      enable_brand_zero_alert: true,
      allow_oversell: true
    });
  }
}
