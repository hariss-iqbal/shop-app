import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import {
  StockAlertConfig,
  UpdateStockAlertConfigRequest,
  StockAlert,
  StockAlertsResponse
} from '../../models/stock-alert-config.model';
import { PhoneStatus } from '../../enums';

@Injectable({
  providedIn: 'root'
})
export class StockAlertService {
  private supabase = inject(SupabaseService);

  async getConfig(): Promise<StockAlertConfig> {
    const { data, error } = await this.supabase
      .from('stock_alert_configs')
      .select('*')
      .limit(1)
      .single();

    if (error && error.code === 'PGRST116') {
      return this.createDefaultConfig();
    }

    if (error) {
      throw new Error(error.message);
    }

    return this.mapConfig(data);
  }

  async updateConfig(request: UpdateStockAlertConfigRequest): Promise<StockAlertConfig> {
    const current = await this.getConfig();

    const updatePayload: Record<string, unknown> = {};
    if (request.lowStockThreshold !== undefined) {
      updatePayload['low_stock_threshold'] = request.lowStockThreshold;
    }
    if (request.enableBrandZeroAlert !== undefined) {
      updatePayload['enable_brand_zero_alert'] = request.enableBrandZeroAlert;
    }

    const { data, error } = await this.supabase
      .from('stock_alert_configs')
      .update(updatePayload)
      .eq('id', current.id)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return this.mapConfig(data);
  }

  async getAlerts(): Promise<StockAlertsResponse> {
    const config = await this.getConfig();
    const alerts: StockAlert[] = [];

    const { count: totalStock, error: stockError } = await this.supabase
      .from('phones')
      .select('*', { count: 'exact', head: true })
      .eq('status', PhoneStatus.AVAILABLE);

    if (stockError) {
      throw new Error(stockError.message);
    }

    const availableStock = totalStock || 0;

    if (availableStock < config.lowStockThreshold) {
      alerts.push({
        type: 'low_stock',
        currentStock: availableStock,
        threshold: config.lowStockThreshold,
        message: `Total stock (${availableStock}) is below threshold (${config.lowStockThreshold})`
      });
    }

    if (config.enableBrandZeroAlert) {
      const { data: brands, error: brandsError } = await this.supabase
        .from('brands')
        .select('id, name')
        .order('name', { ascending: true });

      if (brandsError) {
        throw new Error(brandsError.message);
      }

      for (const brand of brands || []) {
        const { count: brandStock, error: brandError } = await this.supabase
          .from('phones')
          .select('*', { count: 'exact', head: true })
          .eq('status', PhoneStatus.AVAILABLE)
          .eq('brand_id', brand.id);

        if (brandError) {
          throw new Error(brandError.message);
        }

        if ((brandStock || 0) === 0) {
          alerts.push({
            type: 'brand_zero',
            brandId: brand.id,
            brandName: brand.name,
            currentStock: 0,
            threshold: 0,
            message: `${brand.name} has zero available stock`
          });
        }
      }
    }

    return { alerts, config };
  }

  private async createDefaultConfig(): Promise<StockAlertConfig> {
    const { data, error } = await this.supabase
      .from('stock_alert_configs')
      .insert({
        low_stock_threshold: 5,
        enable_brand_zero_alert: true
      })
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return this.mapConfig(data);
  }

  private mapConfig(data: Record<string, unknown>): StockAlertConfig {
    return {
      id: data['id'] as string,
      lowStockThreshold: data['low_stock_threshold'] as number,
      enableBrandZeroAlert: data['enable_brand_zero_alert'] as boolean,
      createdAt: data['created_at'] as string,
      updatedAt: data['updated_at'] as string | null,
    };
  }
}
