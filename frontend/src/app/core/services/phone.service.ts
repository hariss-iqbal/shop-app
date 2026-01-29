import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Phone, PhoneDetail, PhoneDetailImage, PhoneListResponse, PhoneFilter, CreatePhoneRequest, UpdatePhoneRequest } from '../../models/phone.model';
import { PhoneStatus } from '../../enums';

export interface LazyLoadParams {
  first: number;
  rows: number;
  sortField?: string;
  sortOrder?: number;
  globalFilter?: string;
}

export interface CatalogPaginationParams {
  first: number;
  rows: number;
  sortField?: string;
  sortOrder?: number;
}

@Injectable({
  providedIn: 'root'
})
export class PhoneService {
  private supabase = inject(SupabaseService);

  async getPhones(params: LazyLoadParams, filter?: PhoneFilter): Promise<PhoneListResponse> {
    const { first, rows, sortField, sortOrder, globalFilter } = params;
    const searchTerm = (globalFilter || filter?.search || '').toLowerCase().trim();

    // For server-side search, we need to find matching brand IDs first
    let brandIdsMatchingSearch: string[] | null = null;

    if (searchTerm) {
      const { data: matchingBrands } = await this.supabase
        .from('brands')
        .select('id')
        .ilike('name', `%${searchTerm}%`);

      brandIdsMatchingSearch = matchingBrands?.map(b => b.id as string) || [];
    }

    let query = this.supabase
      .from('phones')
      .select(`
        *,
        brand:brands!brand_id(id, name, logo_url),
        supplier:suppliers!supplier_id(id, name),
        images:phone_images(id, image_url, is_primary, display_order)
      `, { count: 'exact' });

    // Apply status filter
    if (filter?.status) {
      query = query.eq('status', filter.status);
    }

    // Apply brand filter
    if (filter?.brandId) {
      query = query.eq('brand_id', filter.brandId);
    }

    // Apply condition filters
    if (filter?.conditions && filter.conditions.length > 0) {
      query = query.in('condition', filter.conditions);
    } else if (filter?.condition) {
      query = query.eq('condition', filter.condition);
    }

    // Apply storage filters
    if (filter?.storageGbOptions && filter.storageGbOptions.length > 0) {
      query = query.in('storage_gb', filter.storageGbOptions);
    } else if (filter?.storageGb) {
      query = query.eq('storage_gb', filter.storageGb);
    }

    // Apply price range filters
    if (filter?.minPrice !== undefined && filter?.minPrice !== null) {
      query = query.gte('selling_price', filter.minPrice);
    }

    if (filter?.maxPrice !== undefined && filter?.maxPrice !== null) {
      query = query.lte('selling_price', filter.maxPrice);
    }

    // Apply server-side search filter (search on model OR brand name)
    if (searchTerm) {
      if (brandIdsMatchingSearch && brandIdsMatchingSearch.length > 0) {
        query = query.or(`model.ilike.%${searchTerm}%,brand_id.in.(${brandIdsMatchingSearch.join(',')})`);
      } else {
        query = query.ilike('model', `%${searchTerm}%`);
      }
    }

    // Handle sorting - profitMargin requires special handling as it's computed
    const isComputedSort = sortField === 'profitMargin';

    if (sortField && !isComputedSort) {
      const sortColumn = this.mapSortField(sortField);
      query = query.order(sortColumn, { ascending: sortOrder === 1 });
    } else if (!isComputedSort) {
      query = query.order('created_at', { ascending: false });
    }

    // If sorting by computed field (profitMargin), we need to fetch all and sort client-side
    // Otherwise, apply server-side pagination
    if (isComputedSort) {
      const { data, error, count } = await query;

      if (error) {
        throw new Error(error.message);
      }

      let phones = (data || []).map(this.mapToPhone);

      // Sort by profit margin client-side
      const ascending = sortOrder === 1;
      phones.sort((a, b) => ascending ? a.profitMargin - b.profitMargin : b.profitMargin - a.profitMargin);

      const total = count ?? phones.length;
      const paginatedPhones = phones.slice(first, first + rows);

      return {
        data: paginatedPhones,
        total
      };
    }

    // Apply server-side pagination for non-computed sorts
    const end = first + rows - 1;
    query = query.range(first, end);

    const { data, error, count } = await query;

    if (error) {
      throw new Error(error.message);
    }

    const phones = (data || []).map(this.mapToPhone);

    return {
      data: phones,
      total: count ?? 0
    };
  }

  async getCatalogPhones(
    params: CatalogPaginationParams,
    filter?: PhoneFilter
  ): Promise<PhoneListResponse> {
    const { first, rows, sortField, sortOrder } = params;
    const searchTerm = filter?.search?.toLowerCase().trim();

    let brandIdsMatchingSearch: string[] | null = null;

    if (searchTerm) {
      const { data: matchingBrands } = await this.supabase
        .from('brands')
        .select('id')
        .ilike('name', `%${searchTerm}%`);

      brandIdsMatchingSearch = matchingBrands?.map(b => b.id as string) || [];
    }

    let query = this.supabase
      .from('phones')
      .select(`
        *,
        brand:brands!brand_id(id, name, logo_url),
        supplier:suppliers!supplier_id(id, name),
        images:phone_images(id, image_url, is_primary, display_order)
      `, { count: 'exact' });

    if (filter?.status) {
      query = query.eq('status', filter.status);
    }

    if (filter?.brandId) {
      query = query.eq('brand_id', filter.brandId);
    }

    if (filter?.conditions && filter.conditions.length > 0) {
      query = query.in('condition', filter.conditions);
    } else if (filter?.condition) {
      query = query.eq('condition', filter.condition);
    }

    if (filter?.storageGbOptions && filter.storageGbOptions.length > 0) {
      query = query.in('storage_gb', filter.storageGbOptions);
    } else if (filter?.storageGb) {
      query = query.eq('storage_gb', filter.storageGb);
    }

    if (filter?.minPrice !== undefined && filter?.minPrice !== null) {
      query = query.gte('selling_price', filter.minPrice);
    }

    if (filter?.maxPrice !== undefined && filter?.maxPrice !== null) {
      query = query.lte('selling_price', filter.maxPrice);
    }

    if (searchTerm) {
      if (brandIdsMatchingSearch && brandIdsMatchingSearch.length > 0) {
        query = query.or(`model.ilike.%${searchTerm}%,brand_id.in.(${brandIdsMatchingSearch.join(',')})`);
      } else {
        query = query.ilike('model', `%${searchTerm}%`);
      }
    }

    if (sortField) {
      const sortColumn = this.mapSortField(sortField);
      query = query.order(sortColumn, { ascending: sortOrder === 1 });
    } else {
      query = query.order('created_at', { ascending: false });
    }

    const end = first + rows - 1;
    query = query.range(first, end);

    const { data, error, count } = await query;

    if (error) {
      throw new Error(error.message);
    }

    const phones = (data || []).map(this.mapToPhone);

    return {
      data: phones,
      total: count ?? 0
    };
  }

  async getPhoneById(id: string): Promise<Phone | null> {
    const { data, error } = await this.supabase
      .from('phones')
      .select(`
        *,
        brand:brands!brand_id(id, name, logo_url),
        supplier:suppliers!supplier_id(id, name),
        images:phone_images(id, image_url, is_primary, display_order)
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(error.message);
    }

    return this.mapToPhone(data);
  }

  async getAvailablePhoneDetail(id: string): Promise<PhoneDetail | null> {
    const { data, error } = await this.supabase
      .from('phones')
      .select(`
        *,
        brand:brands!brand_id(id, name, logo_url),
        supplier:suppliers!supplier_id(id, name),
        images:phone_images(id, image_url, is_primary, display_order)
      `)
      .eq('id', id)
      .eq('status', PhoneStatus.AVAILABLE)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(error.message);
    }

    return this.mapToPhoneDetail(data);
  }

  private mapToPhoneDetail(data: Record<string, unknown>): PhoneDetail {
    const phone = this.mapToPhone(data);
    const rawImages = (data['images'] as Array<Record<string, unknown>>) || [];

    const images: PhoneDetailImage[] = rawImages
      .map(img => ({
        id: img['id'] as string,
        imageUrl: img['image_url'] as string,
        isPrimary: img['is_primary'] as boolean,
        displayOrder: img['display_order'] as number
      }))
      .sort((a, b) => {
        if (a.isPrimary && !b.isPrimary) return -1;
        if (!a.isPrimary && b.isPrimary) return 1;
        return a.displayOrder - b.displayOrder;
      });

    return {
      ...phone,
      images
    };
  }

  async createPhone(request: CreatePhoneRequest): Promise<Phone> {
    const { data, error } = await this.supabase
      .from('phones')
      .insert({
        brand_id: request.brandId,
        model: request.model,
        description: request.description,
        storage_gb: request.storageGb,
        ram_gb: request.ramGb,
        color: request.color,
        condition: request.condition,
        battery_health: request.batteryHealth,
        imei: request.imei,
        cost_price: request.costPrice,
        selling_price: request.sellingPrice,
        status: request.status || PhoneStatus.AVAILABLE,
        purchase_date: request.purchaseDate,
        supplier_id: request.supplierId,
        notes: request.notes
      })
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    const phone = await this.getPhoneById(data.id);
    return phone!;
  }

  async updatePhone(id: string, request: UpdatePhoneRequest): Promise<Phone> {
    const updateData: Record<string, unknown> = {};

    if (request.brandId !== undefined) updateData['brand_id'] = request.brandId;
    if (request.model !== undefined) updateData['model'] = request.model;
    if (request.description !== undefined) updateData['description'] = request.description;
    if (request.storageGb !== undefined) updateData['storage_gb'] = request.storageGb;
    if (request.ramGb !== undefined) updateData['ram_gb'] = request.ramGb;
    if (request.color !== undefined) updateData['color'] = request.color;
    if (request.condition !== undefined) updateData['condition'] = request.condition;
    if (request.batteryHealth !== undefined) updateData['battery_health'] = request.batteryHealth;
    if (request.imei !== undefined) updateData['imei'] = request.imei;
    if (request.costPrice !== undefined) updateData['cost_price'] = request.costPrice;
    if (request.sellingPrice !== undefined) updateData['selling_price'] = request.sellingPrice;
    if (request.status !== undefined) updateData['status'] = request.status;
    if (request.purchaseDate !== undefined) updateData['purchase_date'] = request.purchaseDate;
    if (request.supplierId !== undefined) updateData['supplier_id'] = request.supplierId;
    if (request.notes !== undefined) updateData['notes'] = request.notes;

    const { error } = await this.supabase
      .from('phones')
      .update(updateData)
      .eq('id', id);

    if (error) {
      throw new Error(error.message);
    }

    const phone = await this.getPhoneById(id);
    return phone!;
  }

  async updatePhoneStatus(id: string, status: PhoneStatus): Promise<Phone> {
    return this.updatePhone(id, { status });
  }

  async updatePhonesStatus(ids: string[], status: PhoneStatus): Promise<void> {
    const { error } = await this.supabase
      .from('phones')
      .update({ status })
      .in('id', ids);

    if (error) {
      throw new Error(error.message);
    }
  }

  async deletePhone(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('phones')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(error.message);
    }
  }

  async deletePhones(ids: string[]): Promise<void> {
    const { error } = await this.supabase
      .from('phones')
      .delete()
      .in('id', ids);

    if (error) {
      throw new Error(error.message);
    }
  }

  async getExportPhones(globalFilter?: string): Promise<Phone[]> {
    let query = this.supabase
      .from('phones')
      .select(`
        *,
        brand:brands!brand_id(id, name, logo_url),
        supplier:suppliers!supplier_id(id, name),
        images:phone_images(id, image_url, is_primary, display_order)
      `);

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) {
      throw new Error(error.message);
    }

    let phones = (data || []).map(this.mapToPhone);

    if (globalFilter) {
      const searchTerm = globalFilter.toLowerCase();
      phones = phones.filter(phone =>
        phone.model.toLowerCase().includes(searchTerm) ||
        phone.brandName.toLowerCase().includes(searchTerm)
      );
    }

    return phones;
  }

  async getDistinctStorageOptions(): Promise<number[]> {
    const { data, error } = await this.supabase
      .from('phones')
      .select('storage_gb')
      .eq('status', PhoneStatus.AVAILABLE)
      .not('storage_gb', 'is', null);

    if (error) {
      throw new Error(error.message);
    }

    const storageValues = [...new Set((data || []).map(p => p.storage_gb as number))];
    return storageValues.sort((a, b) => a - b);
  }

  async getPriceRange(): Promise<{ min: number; max: number }> {
    const { data, error } = await this.supabase
      .from('phones')
      .select('selling_price')
      .eq('status', PhoneStatus.AVAILABLE);

    if (error) {
      throw new Error(error.message);
    }

    if (!data || data.length === 0) {
      return { min: 0, max: 1000 };
    }

    const prices = data.map(p => p.selling_price as number);
    return {
      min: Math.floor(Math.min(...prices)),
      max: Math.ceil(Math.max(...prices))
    };
  }

  private mapSortField(field: string): string {
    const fieldMap: Record<string, string> = {
      'brandName': 'brand_id',
      'model': 'model',
      'storageGb': 'storage_gb',
      'condition': 'condition',
      'costPrice': 'cost_price',
      'sellingPrice': 'selling_price',
      'status': 'status',
      'createdAt': 'created_at'
    };
    return fieldMap[field] || field;
  }

  private mapToPhone(data: Record<string, unknown>): Phone {
    const brand = data['brand'] as Record<string, unknown> | null;
    const supplier = data['supplier'] as Record<string, unknown> | null;
    const images = (data['images'] as Array<Record<string, unknown>>) || [];
    const primaryImage = images.find(img => img['is_primary']) || images[0];
    const costPrice = data['cost_price'] as number;
    const sellingPrice = data['selling_price'] as number;
    const profitMargin = sellingPrice > 0
      ? Math.round(((sellingPrice - costPrice) / sellingPrice) * 10000) / 100
      : 0;

    return {
      id: data['id'] as string,
      brandId: data['brand_id'] as string,
      brandName: brand?.['name'] as string || '',
      brandLogoUrl: brand?.['logo_url'] as string | null,
      model: data['model'] as string,
      description: data['description'] as string | null,
      storageGb: data['storage_gb'] as number | null,
      ramGb: data['ram_gb'] as number | null,
      color: data['color'] as string | null,
      condition: data['condition'] as Phone['condition'],
      batteryHealth: data['battery_health'] as number | null,
      imei: data['imei'] as string | null,
      costPrice,
      sellingPrice,
      profitMargin,
      status: data['status'] as Phone['status'],
      purchaseDate: data['purchase_date'] as string | null,
      supplierId: data['supplier_id'] as string | null,
      supplierName: supplier?.['name'] as string | null,
      notes: data['notes'] as string | null,
      primaryImageUrl: primaryImage?.['image_url'] as string | null,
      createdAt: data['created_at'] as string,
      updatedAt: data['updated_at'] as string | null
    };
  }
}
