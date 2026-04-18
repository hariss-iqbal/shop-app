import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { LegacyBill, LegacyBillFilter, LegacyBillListResponse } from '../../models/legacy-bill.model';

@Injectable({ providedIn: 'root' })
export class LegacyBillService {

  constructor(private supabase: SupabaseService) {}

  async getLegacyBills(filter?: LegacyBillFilter): Promise<LegacyBillListResponse> {
    const limit = filter?.limit || 25;
    const page = filter?.page || 1;
    const offset = (page - 1) * limit;
    const search = filter?.search?.trim() || null;

    const { data, error } = await this.supabase.rpc('search_legacy_bills', {
      p_search: search,
      p_limit: limit,
      p_offset: offset,
    });

    if (error) {
      throw new Error(error.message);
    }

    const rows = data || [];
    const total = rows.length > 0 ? rows[0].total_count : 0;

    return {
      data: rows.map(this.mapToLegacyBill),
      total,
    };
  }

  private mapToLegacyBill(raw: any): LegacyBill {
    return {
      id: raw.id,
      rowNum: raw.row_num,
      billNum: raw.bill_num,
      billDate: raw.bill_date,
      customerName: raw.customer_name,
      phone: raw.phone,
      phoneMissing: raw.phone_missing,
      customerId: raw.customer_id,
      brand: raw.brand,
      primaryProduct: raw.primary_product,
      allProducts: raw.all_products,
      qty: raw.qty,
      amount: raw.amount,
      storage: raw.storage,
      imei: raw.imei,
      conditionNotes: raw.condition_notes,
      rawDetails: raw.raw_details,
      severity: raw.severity,
      doubtReasons: raw.doubt_reasons,
      createdAt: raw.created_at,
    };
  }
}
