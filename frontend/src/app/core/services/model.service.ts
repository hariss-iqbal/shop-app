import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { PhoneModel, CreateModelRequest, PhoneModelFilter } from '../../models/phone-model.model';

@Injectable({
  providedIn: 'root'
})
export class ModelService {
  constructor(private supabase: SupabaseService) { }

  async getModels(filter?: PhoneModelFilter): Promise<PhoneModel[]> {
    let query = this.supabase
      .from('models')
      .select('*, brand:brands!brand_id(id, name, logo_url)')
      .order('name', { ascending: true });

    if (filter?.brandId) {
      query = query.eq('brand_id', filter.brandId);
    }

    if (filter?.search) {
      query = query.ilike('name', `%${filter.search}%`);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(error.message);
    }

    return (data || []).map(this.mapToPhoneModel);
  }

  async getModelsByBrand(brandId: string): Promise<PhoneModel[]> {
    const { data, error } = await this.supabase
      .from('models')
      .select('*, brand:brands!brand_id(id, name, logo_url)')
      .eq('brand_id', brandId)
      .order('name', { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    return (data || []).map(this.mapToPhoneModel);
  }

  async createModel(request: CreateModelRequest): Promise<PhoneModel> {
    const { data, error } = await this.supabase
      .from('models')
      .insert({
        brand_id: request.brandId,
        name: request.name.trim()
      })
      .select('*, brand:brands!brand_id(id, name, logo_url)')
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return this.mapToPhoneModel(data);
  }

  async updateModel(id: string, request: { name: string }): Promise<PhoneModel> {
    const { data, error } = await this.supabase
      .from('models')
      .update({ name: request.name.trim() })
      .eq('id', id)
      .select('*, brand:brands!brand_id(id, name, logo_url)')
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return this.mapToPhoneModel(data);
  }

  async getStockCounts(): Promise<Map<string, number>> {
    const { data, error } = await this.supabase
      .from('products')
      .select('model_id')
      .not('model_id', 'is', null)
      .eq('status', 'available');

    if (error) {
      throw new Error(error.message);
    }

    const counts = new Map<string, number>();
    for (const row of data || []) {
      const id = row.model_id;
      counts.set(id, (counts.get(id) || 0) + 1);
    }
    return counts;
  }

  async deleteModel(id: string): Promise<void> {
    const { count } = await this.supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('model_id', id);

    if (count && count > 0) {
      throw new Error(`Cannot delete model: ${count} product(s) are using this model`);
    }

    const { error } = await this.supabase
      .from('models')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(error.message);
    }
  }

  private mapToPhoneModel(data: Record<string, unknown>): PhoneModel {
    const brand = data['brand'] as Record<string, unknown> | null;
    return {
      id: data['id'] as string,
      brandId: data['brand_id'] as string,
      brandName: brand?.['name'] as string || '',
      brandLogoUrl: brand?.['logo_url'] as string | null,
      name: data['name'] as string,
      createdAt: data['created_at'] as string
    };
  }
}
