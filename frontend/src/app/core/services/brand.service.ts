import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Brand, CreateBrandRequest, UpdateBrandRequest } from '../../models/brand.model';

@Injectable({
  providedIn: 'root'
})
export class BrandService {
  constructor(private supabase: SupabaseService) { }

  async getBrands(): Promise<Brand[]> {
    const { data, error } = await this.supabase
      .from('brands')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    return (data || []).map(this.mapToBrand);
  }

  async searchBrands(query: string): Promise<Brand[]> {
    const { data, error } = await this.supabase
      .from('brands')
      .select('*')
      .ilike('name', `%${query}%`)
      .order('name', { ascending: true })
      .limit(20);

    if (error) {
      throw new Error(error.message);
    }

    return (data || []).map(this.mapToBrand);
  }

  async getBrandById(id: string): Promise<Brand | null> {
    const { data, error } = await this.supabase
      .from('brands')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(error.message);
    }

    return this.mapToBrand(data);
  }

  async getBrandByName(name: string): Promise<Brand | null> {
    const { data, error } = await this.supabase
      .from('brands')
      .select('*')
      .eq('name', name)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(error.message);
    }

    return this.mapToBrand(data);
  }

  async createBrand(request: CreateBrandRequest): Promise<Brand> {
    const existing = await this.getBrandByName(request.name.trim());
    if (existing) {
      throw new Error(`Brand "${request.name}" already exists`);
    }

    const { data, error } = await this.supabase
      .from('brands')
      .insert({
        name: request.name.trim(),
        logo_url: request.logoUrl || null
      })
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return this.mapToBrand(data);
  }

  async updateBrand(id: string, request: UpdateBrandRequest): Promise<Brand> {
    if (request.name) {
      const existing = await this.getBrandByName(request.name.trim());
      if (existing && existing.id !== id) {
        throw new Error(`Brand "${request.name}" already exists`);
      }
    }

    const updateData: Record<string, unknown> = {};
    if (request.name !== undefined) {
      updateData['name'] = request.name.trim();
    }
    if (request.logoUrl !== undefined) {
      updateData['logo_url'] = request.logoUrl;
    }

    const { data, error } = await this.supabase
      .from('brands')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return this.mapToBrand(data);
  }

  async deleteBrand(id: string): Promise<void> {
    const { count } = await this.supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('brand_id', id);

    if (count && count > 0) {
      throw new Error(`Cannot delete brand: ${count} product(s) are using this brand`);
    }

    const { error } = await this.supabase
      .from('brands')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(error.message);
    }
  }

  async uploadLogo(file: File): Promise<string> {
    const fileExt = file.name.split('.').pop()?.toLowerCase();
    const allowedExtensions = ['jpg', 'jpeg', 'png', 'webp'];

    if (!fileExt || !allowedExtensions.includes(fileExt)) {
      throw new Error('Invalid file type. Allowed: JPG, PNG, WebP');
    }

    if (file.size > 2 * 1024 * 1024) {
      throw new Error('File size must be less than 2MB');
    }

    const fileName = `brand-logos/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

    const { error: uploadError } = await this.supabase.storage
      .from('phone-images')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      throw new Error(uploadError.message);
    }

    const { data: urlData } = this.supabase.storage
      .from('phone-images')
      .getPublicUrl(fileName);

    return urlData.publicUrl;
  }

  async deleteLogo(logoUrl: string): Promise<void> {
    const path = this.extractStoragePath(logoUrl);
    if (path) {
      const { error } = await this.supabase.storage
        .from('phone-images')
        .remove([path]);

      if (error) {
        console.error('Failed to delete logo from storage:', error);
      }
    }
  }

  private extractStoragePath(url: string): string | null {
    const match = url.match(/\/phone-images\/(.+)$/);
    return match ? match[1] : null;
  }

  private mapToBrand(data: Record<string, unknown>): Brand {
    return {
      id: data['id'] as string,
      name: data['name'] as string,
      logoUrl: data['logo_url'] as string | null,
      createdAt: data['created_at'] as string,
      updatedAt: data['updated_at'] as string | null
    };
  }
}
