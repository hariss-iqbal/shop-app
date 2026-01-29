import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import {
  Sale,
  SaleListResponse,
  SaleFilter,
  SaleSummary,
  MarkAsSoldRequest
} from '../../models/sale.model';

@Injectable({
  providedIn: 'root'
})
export class SaleService {
  private supabase = inject(SupabaseService);

  async getSales(filter?: SaleFilter): Promise<SaleListResponse> {
    let query = this.supabase
      .from('sales')
      .select(`
        *,
        phone:phones(
          id,
          model,
          brand:brands(id, name)
        )
      `, { count: 'exact' });

    if (filter?.startDate) {
      query = query.gte('sale_date', filter.startDate);
    }

    if (filter?.endDate) {
      query = query.lte('sale_date', filter.endDate);
    }

    query = query.order('sale_date', { ascending: false });

    const { data, error, count } = await query;

    if (error) {
      throw new Error(error.message);
    }

    return {
      data: (data || []).map(this.mapToSale),
      total: count || 0
    };
  }

  async getSummary(filter?: SaleFilter): Promise<SaleSummary> {
    let query = this.supabase
      .from('sales')
      .select('sale_price, cost_price, sale_date');

    if (filter?.startDate) {
      query = query.gte('sale_date', filter.startDate);
    }

    if (filter?.endDate) {
      query = query.lte('sale_date', filter.endDate);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(error.message);
    }

    const sales = data || [];
    const totalSales = sales.length;
    const totalRevenue = sales.reduce((sum, s) => sum + (s.sale_price || 0), 0);
    const totalCost = sales.reduce((sum, s) => sum + (s.cost_price || 0), 0);
    const totalProfit = totalRevenue - totalCost;
    const averageMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

    return {
      totalSales,
      totalRevenue,
      totalCost,
      totalProfit,
      averageMargin
    };
  }

  async markAsSold(request: MarkAsSoldRequest): Promise<Sale> {
    const { data: phone, error: phoneError } = await this.supabase
      .from('phones')
      .select('cost_price')
      .eq('id', request.phoneId)
      .single();

    if (phoneError) {
      throw new Error(phoneError.message);
    }

    const { data: sale, error: saleError } = await this.supabase
      .from('sales')
      .insert({
        phone_id: request.phoneId,
        sale_date: request.saleDate,
        sale_price: request.salePrice,
        cost_price: phone.cost_price,
        buyer_name: request.buyerName?.trim() || null,
        buyer_phone: request.buyerPhone?.trim() || null,
        buyer_email: request.buyerEmail?.trim() || null,
        notes: request.notes?.trim() || null
      })
      .select(`
        *,
        phone:phones(
          id,
          model,
          brand:brands(id, name)
        )
      `)
      .single();

    if (saleError) {
      throw new Error(saleError.message);
    }

    const { error: statusError } = await this.supabase
      .from('phones')
      .update({ status: 'sold' })
      .eq('id', request.phoneId);

    if (statusError) {
      throw new Error(statusError.message);
    }

    return this.mapToSale(sale);
  }

  private mapToSale(data: Record<string, unknown>): Sale {
    const phone = data['phone'] as Record<string, unknown> | null;
    const brand = phone ? (phone['brand'] as Record<string, unknown> | null) : null;

    const salePrice = data['sale_price'] as number;
    const costPrice = data['cost_price'] as number;

    return {
      id: data['id'] as string,
      phoneId: data['phone_id'] as string,
      brandName: brand ? (brand['name'] as string) : '',
      phoneName: phone ? (phone['model'] as string) : '',
      saleDate: data['sale_date'] as string,
      salePrice,
      costPrice,
      profit: salePrice - costPrice,
      buyerName: data['buyer_name'] as string | null,
      buyerPhone: data['buyer_phone'] as string | null,
      buyerEmail: data['buyer_email'] as string | null,
      notes: data['notes'] as string | null,
      createdAt: data['created_at'] as string,
      updatedAt: data['updated_at'] as string | null
    };
  }
}
