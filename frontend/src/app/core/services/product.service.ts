import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Product, ProductDetail, ProductDetailImage, ProductListResponse, ProductFilter, CreateProductRequest, UpdateProductRequest } from '../../models/product.model';
import { ProductStatus } from '../../enums';
import { ProductType } from '../../enums/product-type.enum';
import { ProductSpecsScraperService, FetchProductSpecsResponse } from './product-specs-scraper.service';

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
export class ProductService {
  constructor(
    private supabase: SupabaseService,
    private specsScraper: ProductSpecsScraperService
  ) { }

  /**
   * Fetch product specifications from GSMArena
   * @param brand Product brand (e.g., "Apple", "Samsung")
   * @param model Product model (e.g., "iPhone 15 Pro", "Galaxy S24")
   * @returns Product specifications including RAM, storage, and color options
   */
  async fetchProductSpecs(brand: string, model: string): Promise<FetchProductSpecsResponse> {
    return this.specsScraper.fetchSpecs(brand, model);
  }

  async getProducts(params: LazyLoadParams, filter?: ProductFilter): Promise<ProductListResponse> {
    const { first, rows, sortField, sortOrder, globalFilter } = params;
    const searchTerm = (globalFilter || filter?.search || '').toLowerCase().trim();

    let brandIdsMatchingSearch: string[] | null = null;

    if (searchTerm) {
      const { data: matchingBrands } = await this.supabase
        .from('brands')
        .select('id')
        .ilike('name', `%${searchTerm}%`);

      brandIdsMatchingSearch = matchingBrands?.map(b => b.id as string) || [];
    }

    let query = this.supabase
      .from('products')
      .select(`
        *,
        brand:brands!brand_id(id, name, logo_url),
        supplier:suppliers!supplier_id(id, name),
        images:product_images(id, image_url, is_primary, display_order)
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

    if (filter?.ptaStatus) {
      query = query.eq('pta_status', filter.ptaStatus);
    }

    if (filter?.productType) {
      query = query.eq('product_type', filter.productType);
    }

    if (filter?.model) {
      query = query.eq('model', filter.model);
    }

    if (searchTerm) {
      if (brandIdsMatchingSearch && brandIdsMatchingSearch.length > 0) {
        query = query.or(`model.ilike.%${searchTerm}%,brand_id.in.(${brandIdsMatchingSearch.join(',')})`);
      } else {
        query = query.ilike('model', `%${searchTerm}%`);
      }
    }

    const isComputedSort = sortField === 'profitMargin';

    if (sortField && !isComputedSort) {
      const sortColumn = this.mapSortField(sortField);
      query = query.order(sortColumn, { ascending: sortOrder === 1 });
    } else if (!isComputedSort) {
      query = query.order('created_at', { ascending: false });
    }

    if (isComputedSort) {
      const { data, error, count } = await query;

      if (error) {
        throw new Error(error.message);
      }

      let products = (data || []).map(this.mapToProduct);

      const ascending = sortOrder === 1;
      products.sort((a, b) => ascending ? a.profitMargin - b.profitMargin : b.profitMargin - a.profitMargin);

      const total = count ?? products.length;
      const paginatedProducts = products.slice(first, first + rows);

      return {
        data: paginatedProducts,
        total
      };
    }

    const end = first + rows - 1;
    query = query.range(first, end);

    const { data, error, count } = await query;

    if (error) {
      throw new Error(error.message);
    }

    const products = (data || []).map(this.mapToProduct);

    return {
      data: products,
      total: count ?? 0
    };
  }

  async getCatalogProducts(
    params: CatalogPaginationParams,
    filter?: ProductFilter
  ): Promise<ProductListResponse> {
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
      .from('products')
      .select(`
        *,
        brand:brands!brand_id(id, name, logo_url),
        supplier:suppliers!supplier_id(id, name),
        images:product_images(id, image_url, is_primary, display_order)
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

    if (filter?.ptaStatus) {
      query = query.eq('pta_status', filter.ptaStatus);
    }

    if (filter?.productType) {
      query = query.eq('product_type', filter.productType);
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

    const products = (data || []).map(this.mapToProduct);

    return {
      data: products,
      total: count ?? 0
    };
  }

  async getProductById(id: string): Promise<Product | null> {
    const { data, error } = await this.supabase
      .from('products')
      .select(`
        *,
        brand:brands!brand_id(id, name, logo_url),
        supplier:suppliers!supplier_id(id, name),
        images:product_images(id, image_url, is_primary, display_order)
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(error.message);
    }

    return this.mapToProduct(data);
  }

  async getAvailableProductDetail(id: string): Promise<ProductDetail | null> {
    const { data, error } = await this.supabase
      .from('products')
      .select(`
        *,
        brand:brands!brand_id(id, name, logo_url),
        supplier:suppliers!supplier_id(id, name),
        images:product_images(id, image_url, is_primary, display_order)
      `)
      .eq('id', id)
      .eq('status', ProductStatus.AVAILABLE)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(error.message);
    }

    return this.mapToProductDetail(data);
  }

  private mapToProductDetail(data: Record<string, unknown>): ProductDetail {
    const product = this.mapToProduct(data);
    const rawImages = (data['images'] as Array<Record<string, unknown>>) || [];

    const images: ProductDetailImage[] = rawImages
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
      ...product,
      images
    };
  }

  async createProduct(request: CreateProductRequest): Promise<Product> {
    const insertData: Record<string, unknown> = {
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
      status: request.status || ProductStatus.AVAILABLE,
      purchase_date: request.purchaseDate,
      supplier_id: request.supplierId,
      notes: request.notes,
      tax_rate: request.taxRate ?? 0,
      is_tax_inclusive: request.isTaxInclusive ?? false,
      is_tax_exempt: request.isTaxExempt ?? false,
      condition_rating: request.conditionRating,
      pta_status: request.ptaStatus,
      product_type: request.productType ?? ProductType.PHONE
    };

    if (request.accessoryCategory !== undefined) insertData['accessory_category'] = request.accessoryCategory;
    if (request.compatibleModels !== undefined) insertData['compatible_models'] = request.compatibleModels;
    if (request.material !== undefined) insertData['material'] = request.material;
    if (request.warrantyMonths !== undefined) insertData['warranty_months'] = request.warrantyMonths;
    if (request.weightGrams !== undefined) insertData['weight_grams'] = request.weightGrams;
    if (request.dimensions !== undefined) insertData['dimensions'] = request.dimensions;
    if (request.isFeatured !== undefined) insertData['is_featured'] = request.isFeatured;

    const { data, error } = await this.supabase
      .from('products')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    const product = await this.getProductById(data.id);
    return product!;
  }

  async updateProduct(id: string, request: UpdateProductRequest): Promise<Product> {
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
    if (request.taxRate !== undefined) updateData['tax_rate'] = request.taxRate;
    if (request.isTaxInclusive !== undefined) updateData['is_tax_inclusive'] = request.isTaxInclusive;
    if (request.isTaxExempt !== undefined) updateData['is_tax_exempt'] = request.isTaxExempt;
    if (request.conditionRating !== undefined) updateData['condition_rating'] = request.conditionRating;
    if (request.ptaStatus !== undefined) updateData['pta_status'] = request.ptaStatus;
    if (request.productType !== undefined) updateData['product_type'] = request.productType;
    if (request.accessoryCategory !== undefined) updateData['accessory_category'] = request.accessoryCategory;
    if (request.compatibleModels !== undefined) updateData['compatible_models'] = request.compatibleModels;
    if (request.material !== undefined) updateData['material'] = request.material;
    if (request.warrantyMonths !== undefined) updateData['warranty_months'] = request.warrantyMonths;
    if (request.weightGrams !== undefined) updateData['weight_grams'] = request.weightGrams;
    if (request.dimensions !== undefined) updateData['dimensions'] = request.dimensions;
    if (request.isFeatured !== undefined) updateData['is_featured'] = request.isFeatured;

    const { error } = await this.supabase
      .from('products')
      .update(updateData)
      .eq('id', id);

    if (error) {
      throw new Error(error.message);
    }

    const product = await this.getProductById(id);
    return product!;
  }

  async updateProductStatus(id: string, status: ProductStatus): Promise<Product> {
    return this.updateProduct(id, { status });
  }

  async updateProductsStatus(ids: string[], status: ProductStatus): Promise<void> {
    const { error } = await this.supabase
      .from('products')
      .update({ status })
      .in('id', ids);

    if (error) {
      throw new Error(error.message);
    }
  }

  async deleteProduct(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(error.message);
    }
  }

  async deleteProducts(ids: string[]): Promise<void> {
    const { error } = await this.supabase
      .from('products')
      .delete()
      .in('id', ids);

    if (error) {
      throw new Error(error.message);
    }
  }

  async getExportProducts(globalFilter?: string): Promise<Product[]> {
    let query = this.supabase
      .from('products')
      .select(`
        *,
        brand:brands!brand_id(id, name, logo_url),
        supplier:suppliers!supplier_id(id, name),
        images:product_images(id, image_url, is_primary, display_order)
      `);

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) {
      throw new Error(error.message);
    }

    let products = (data || []).map(this.mapToProduct);

    if (globalFilter) {
      const searchTerm = globalFilter.toLowerCase();
      products = products.filter(product =>
        product.model.toLowerCase().includes(searchTerm) ||
        product.brandName.toLowerCase().includes(searchTerm)
      );
    }

    return products;
  }

  async getDistinctStorageOptions(): Promise<number[]> {
    const { data, error } = await this.supabase
      .from('products')
      .select('storage_gb')
      .eq('status', ProductStatus.AVAILABLE);

    if (error) {
      throw new Error(error.message);
    }

    const storageValues = [...new Set((data || []).map(p => p.storage_gb as number).filter(gb => gb != null))];
    return storageValues.sort((a, b) => a - b);
  }

  async getDistinctModelsByBrand(brandId: string): Promise<string[]> {
    const { data, error } = await this.supabase
      .from('products')
      .select('model')
      .eq('brand_id', brandId)
      .order('model', { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    return [...new Set((data || []).map(p => p.model as string))];
  }

  async getPriceRange(): Promise<{ min: number; max: number }> {
    const { data, error } = await this.supabase
      .from('products')
      .select('selling_price')
      .eq('status', ProductStatus.AVAILABLE);

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

  private mapToProduct(data: Record<string, unknown>): Product {
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
      condition: data['condition'] as Product['condition'],
      batteryHealth: data['battery_health'] as number | null,
      imei: data['imei'] as string | null,
      costPrice,
      sellingPrice,
      profitMargin,
      status: data['status'] as Product['status'],
      purchaseDate: data['purchase_date'] as string | null,
      supplierId: data['supplier_id'] as string | null,
      supplierName: supplier?.['name'] as string | null,
      notes: data['notes'] as string | null,
      primaryImageUrl: primaryImage?.['image_url'] as string | null,
      createdAt: data['created_at'] as string,
      updatedAt: data['updated_at'] as string | null,
      taxRate: (data['tax_rate'] as number) ?? 0,
      isTaxInclusive: (data['is_tax_inclusive'] as boolean) ?? false,
      isTaxExempt: (data['is_tax_exempt'] as boolean) ?? false,
      conditionRating: (data['condition_rating'] as number) ?? null,
      ptaStatus: (data['pta_status'] as Product['ptaStatus']) ?? null,
      productType: (data['product_type'] as ProductType) ?? ProductType.PHONE,
      accessoryCategory: (data['accessory_category'] as string) ?? null,
      compatibleModels: (data['compatible_models'] as string[]) ?? null,
      material: (data['material'] as string) ?? null,
      warrantyMonths: (data['warranty_months'] as number) ?? null,
      weightGrams: (data['weight_grams'] as number) ?? null,
      dimensions: (data['dimensions'] as string) ?? null,
      isFeatured: (data['is_featured'] as boolean) ?? false
    };
  }
}
