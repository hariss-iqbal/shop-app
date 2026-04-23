import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Product, ProductDetail, ProductDetailImage, ProductListResponse, ProductFilter, CreateProductRequest, UpdateProductRequest } from '../../models/product.model';
import { Variant, VariantImage, AddStockRequest } from '../../models/variant.model';
import { ProductCondition, ProductStatus } from '../../enums';
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

export interface ModelCatalogItem {
  variantId: string;
  modelId: string;
  modelName: string;
  brandId: string;
  brandName: string;
  storageGb: number | null;
  ptaStatus: string | null;
  condition: string;
  color: string;
  sellingPrice: number;
  avgCostPrice: number;
  stockCount: number;
  primaryImageUrl: string | null;
  slug: string;
}

export interface ModelCatalogResponse {
  data: ModelCatalogItem[];
  total: number;
}

export interface ModelVariant {
  id: string;
  storageGb: number | null;
  ptaStatus: string | null;
  condition: string;
  sellingPrice: number;
  avgCostPrice: number;
  stockCount: number;
  availableColors: string[];
  primaryImageUrl: string | null;
  slug: string;
}

function buildDisplayName(modelName: string | null, model: string, storageGb: number | null): string {
  const name = modelName || model || '';
  const parts = [name];
  if (storageGb) parts.push(`${storageGb}GB`);
  return parts.join(' ');
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
        phone_model:models!model_id(id, name),
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

    if (filter?.ramGb) {
      query = query.eq('ram_gb', filter.ramGb);
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

    if (filter?.modelId) {
      query = query.eq('model_id', filter.modelId);
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
        phone_model:models!model_id(id, name),
        supplier:suppliers!supplier_id(id, name),
        images:product_images(id, image_url, is_primary, display_order)
      `, { count: 'exact' });

    if (filter?.status) {
      query = query.eq('status', filter.status);
    }

    if (filter?.brandIds && filter.brandIds.length > 0) {
      query = query.in('brand_id', filter.brandIds);
    } else if (filter?.brandId) {
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

    if (filter?.ramGb) {
      query = query.eq('ram_gb', filter.ramGb);
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

    if (filter?.modelId) {
      query = query.eq('model_id', filter.modelId);
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

  async getModelCatalog(
    params: CatalogPaginationParams,
    filter?: ProductFilter
  ): Promise<ModelCatalogResponse> {
    const { first, rows, sortField, sortOrder } = params;
    const searchTerm = filter?.search?.toLowerCase().trim() || undefined;

    let brandIds: string[] | undefined;
    if (filter?.brandIds && filter.brandIds.length > 0) {
      brandIds = filter.brandIds;
    } else if (filter?.brandId) {
      brandIds = [filter.brandId];
    }

    const rpcParams: Record<string, unknown> = {
      p_brand_ids: brandIds || null,
      p_conditions: filter?.conditions?.length ? filter.conditions : null,
      p_storage_options: filter?.storageGbOptions?.length ? filter.storageGbOptions : null,
      p_min_price: filter?.minPrice ?? null,
      p_max_price: filter?.maxPrice ?? null,
      p_search: searchTerm || null,
      p_pta_status: filter?.ptaStatus || null,
      p_sort_field: sortField === 'selling_price' ? 'selling_price' : sortField === 'model' ? 'model_name' : 'created_at',
      p_sort_order: sortOrder === 1 ? 1 : -1,
      p_limit: rows,
      p_offset: first
    };

    const [dataResult, countResult] = await Promise.all([
      this.supabase.rpc('get_model_catalog', rpcParams),
      this.supabase.rpc('get_model_catalog_count', {
        p_brand_ids: rpcParams['p_brand_ids'],
        p_conditions: rpcParams['p_conditions'],
        p_storage_options: rpcParams['p_storage_options'],
        p_min_price: rpcParams['p_min_price'],
        p_max_price: rpcParams['p_max_price'],
        p_search: rpcParams['p_search'],
        p_pta_status: rpcParams['p_pta_status']
      })
    ]);

    if (dataResult.error) throw new Error(dataResult.error.message);
    if (countResult.error) throw new Error(countResult.error.message);

    const items: ModelCatalogItem[] = (dataResult.data || []).map((row: Record<string, unknown>) => ({
      variantId: row['variant_id'] as string,
      modelId: row['model_id'] as string,
      modelName: row['model_name'] as string,
      brandId: row['brand_id'] as string,
      brandName: row['brand_name'] as string,
      storageGb: row['storage_gb'] as number | null,
      ptaStatus: row['pta_status'] as string | null,
      condition: row['condition'] as string,
      color: row['color'] as string,
      sellingPrice: Number(row['selling_price']),
      avgCostPrice: Number(row['avg_cost_price']),
      stockCount: Number(row['stock_count']),
      primaryImageUrl: row['primary_image_url'] as string | null,
      slug: row['slug'] as string,
    }));

    return {
      data: items,
      total: Number(countResult.data) || 0
    };
  }

  async getModelVariants(modelId: string): Promise<ModelVariant[]> {
    const { data, error } = await this.supabase.rpc('get_model_variants', {
      p_model_id: modelId
    });

    if (error) throw new Error(error.message);

    return (data || []).map((row: Record<string, unknown>) => ({
      id: row['id'] as string,
      storageGb: row['storage_gb'] as number | null,
      ptaStatus: row['pta_status'] as string | null,
      condition: row['condition'] as string,
      sellingPrice: Number(row['selling_price']),
      avgCostPrice: Number(row['avg_cost_price']),
      stockCount: Number(row['stock_count']),
      availableColors: (row['available_colors'] as string[]) || [],
      primaryImageUrl: row['primary_image_url'] as string | null,
      slug: row['slug'] as string
    }));
  }

  async getProductByModel(modelId: string): Promise<ProductDetail | null> {
    const { data, error } = await this.supabase
      .from('products')
      .select(`
        *,
        brand:brands!brand_id(id, name, logo_url),
        phone_model:models!model_id(id, name),
        supplier:suppliers!supplier_id(id, name),
        images:product_images(id, image_url, is_primary, display_order)
      `)
      .eq('model_id', modelId)
      .eq('status', ProductStatus.AVAILABLE)
      .order('selling_price', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!data) return null;
    return this.mapToProductDetail(data);
  }

  async getProductById(id: string): Promise<Product | null> {
    const { data, error } = await this.supabase
      .from('products')
      .select(`
        *,
        brand:brands!brand_id(id, name, logo_url),
        phone_model:models!model_id(id, name),
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
        phone_model:models!model_id(id, name),
        supplier:suppliers!supplier_id(id, name),
        images:product_images(id, image_url, is_primary, display_order)
      `)
      .eq('id', id)
      .eq('status', ProductStatus.AVAILABLE)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return data ? this.mapToProductDetail(data) : null;
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

  async getAvailableProductByVariant(variantId: string, preferredColor?: string | null): Promise<Product | null> {
    const { data, error } = await this.supabase
      .from('products')
      .select(`
        *,
        brand:brands!brand_id(id, name, logo_url),
        phone_model:models!model_id(id, name),
        supplier:suppliers!supplier_id(id, name),
        images:product_images(id, image_url, is_primary, display_order)
      `)
      .eq('variant_id', variantId)
      .eq('status', ProductStatus.AVAILABLE)
      .order('selling_price', { ascending: true });

    if (error) throw new Error(error.message);
    if (!data?.length) return null;

    if (preferredColor) {
      const match = data.find(p =>
        (p['color'] as string)?.toLowerCase() === preferredColor.toLowerCase()
      );
      if (match) return this.mapToProduct(match);
    }

    return this.mapToProduct(data[0]);
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
      product_type: request.productType ?? ProductType.PHONE,
      model_id: request.modelId || null
    };

    if (request.accessoryCategory !== undefined) insertData['accessory_category'] = request.accessoryCategory;
    if (request.compatibleModels !== undefined) insertData['compatible_models'] = request.compatibleModels;
    if (request.material !== undefined) insertData['material'] = request.material;
    if (request.warrantyMonths !== undefined) insertData['warranty_months'] = request.warrantyMonths;
    if (request.weightGrams !== undefined) insertData['weight_grams'] = request.weightGrams;
    if (request.dimensions !== undefined) insertData['dimensions'] = request.dimensions;
    if (request.isFeatured !== undefined) insertData['is_featured'] = request.isFeatured;

    // For phones with a model_id, auto-resolve or create variant
    const isPhone = (request.productType ?? ProductType.PHONE) === ProductType.PHONE;
    if (isPhone && request.modelId) {
      const variantId = await this.resolveVariant(
        request.modelId,
        request.storageGb ?? null,
        request.ptaStatus ?? null,
        request.condition,
        request.sellingPrice
      );
      if (variantId) {
        insertData['variant_id'] = variantId;
        // Use variant's selling_price if variant already exists
        const { data: variantData } = await this.supabase
          .from('variants')
          .select('selling_price')
          .eq('id', variantId)
          .single();
        if (variantData) {
          insertData['selling_price'] = variantData.selling_price;
        }
      }
    }

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

  private async resolveVariant(
    modelId: string,
    storageGb: number | null,
    ptaStatus: string | null,
    condition: ProductCondition,
    sellingPrice: number
  ): Promise<string | null> {
    // Try to find existing variant
    let query = this.supabase
      .from('variants')
      .select('id, selling_price')
      .eq('model_id', modelId)
      .eq('condition', condition);

    if (storageGb !== null) {
      query = query.eq('storage_gb', storageGb);
    } else {
      query = query.is('storage_gb', null);
    }
    if (ptaStatus !== null) {
      query = query.eq('pta_status', ptaStatus);
    } else {
      query = query.is('pta_status', null);
    }

    const { data: existing } = await query.maybeSingle();

    if (existing) {
      return existing.id as string;
    }

    // Create new variant
    const { data: newVariant, error } = await this.supabase
      .from('variants')
      .insert({
        model_id: modelId,
        storage_gb: storageGb,
        pta_status: ptaStatus,
        condition,
        selling_price: sellingPrice,
        is_active: false
      })
      .select('id')
      .single();

    if (error) {
      console.error('Failed to create variant:', error.message);
      return null;
    }

    return newVariant?.id as string;
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
    if (request.modelId !== undefined) updateData['model_id'] = request.modelId;

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
        phone_model:models!model_id(id, name),
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
      .from('variants')
      .select('storage_gb')
      .not('storage_gb', 'is', null)
      .eq('is_active', true);

    if (error) {
      throw new Error(error.message);
    }

    const storageValues = [...new Set((data || []).map(p => p.storage_gb as number).filter(gb => gb != null))];
    return storageValues.sort((a, b) => a - b);
  }

  async getDistinctRamOptions(): Promise<number[]> {
    const { data, error } = await this.supabase
      .from('products')
      .select('ram_gb')
      .not('ram_gb', 'is', null);

    if (error) {
      throw new Error(error.message);
    }

    const ramValues = [...new Set((data || []).map(p => p.ram_gb as number).filter(gb => gb != null))];
    return ramValues.sort((a, b) => a - b);
  }

  async getDistinctModelsByBrand(brandId: string): Promise<{ id: string; name: string }[]> {
    const { data, error } = await this.supabase
      .from('models')
      .select('id, name')
      .eq('brand_id', brandId)
      .order('name', { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    return (data || []).map(p => ({ id: p.id as string, name: p.name as string }));
  }

  async getPriceRange(): Promise<{ min: number; max: number }> {
    const { data, error } = await this.supabase
      .from('variants')
      .select('selling_price')
      .eq('is_active', true);

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
    const phoneModel = data['phone_model'] as Record<string, unknown> | null;
    const supplier = data['supplier'] as Record<string, unknown> | null;
    const images = (data['images'] as Array<Record<string, unknown>>) || [];
    const primaryImage = images.find(img => img['is_primary']) || images[0];
    const costPrice = data['cost_price'] as number;
    const sellingPrice = data['selling_price'] as number;
    const profitMargin = sellingPrice > 0
      ? Math.round(((sellingPrice - costPrice) / sellingPrice) * 10000) / 100
      : 0;

    const modelName = phoneModel?.['name'] as string | null;
    const storageGb = data['storage_gb'] as number | null;

    return {
      id: data['id'] as string,
      brandId: data['brand_id'] as string,
      brandName: brand?.['name'] as string || '',
      brandLogoUrl: brand?.['logo_url'] as string | null,
      model: data['model'] as string,
      modelId: data['model_id'] as string || null,
      modelName,
      displayName: buildDisplayName(modelName, data['model'] as string, storageGb),
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
      isFeatured: (data['is_featured'] as boolean) ?? false,
      variantId: (data['variant_id'] as string) ?? null,
      variantSlug: (data['variant_slug'] as string) ?? null
    };
  }

  // ============================================================
  // Variant-specific methods
  // ============================================================

  async getVariantById(id: string): Promise<Variant | null> {
    const { data, error } = await this.supabase.rpc('get_variant_detail', {
      p_variant_id: id
    });

    if (error) throw new Error(error.message);
    if (!data?.found) return null;

    return this.mapVariantResponse(data.variant);
  }

  async getVariantBySlug(slug: string): Promise<{ variant: Variant; images: VariantImage[] } | null> {
    const { data, error } = await this.supabase.rpc('get_variant_by_slug', {
      p_slug: slug
    });

    if (error) throw new Error(error.message);
    if (!data?.found) return null;

    const variant = this.mapVariantResponse(data.variant);
    const images: VariantImage[] = (data.images || []).map((img: Record<string, unknown>) => ({
      id: img['id'] as string,
      variantId: variant.id,
      imageUrl: img['imageUrl'] as string,
      isPrimary: img['isPrimary'] as boolean,
      displayOrder: img['displayOrder'] as number
    }));

    return { variant, images };
  }

  private mapVariantResponse(v: Record<string, unknown>): Variant {
    return {
      id: v['id'] as string,
      modelId: v['modelId'] as string,
      modelName: v['modelName'] as string,
      brandId: v['brandId'] as string,
      brandName: v['brandName'] as string,
      storageGb: v['storageGb'] as number | null,
      ptaStatus: v['ptaStatus'] as string | null,
      condition: v['condition'] as ProductCondition,
      sellingPrice: Number(v['sellingPrice']),
      avgCostPrice: Number(v['avgCostPrice']),
      stockCount: Number(v['stockCount']),
      availableColors: (v['availableColors'] as string[]) || [],
      isActive: v['isActive'] as boolean,
      primaryImageUrl: v['primaryImageUrl'] as string | null,
      slug: v['slug'] as string,
      createdAt: v['createdAt'] as string,
      updatedAt: (v['updatedAt'] as string) ?? null
    };
  }

  async getVariantImages(variantId: string, color?: string | null): Promise<VariantImage[]> {
    let query = this.supabase
      .from('variant_images')
      .select('*')
      .eq('variant_id', variantId);

    if (color) {
      query = query.eq('color', color);
    }

    const { data, error } = await query
      .order('is_primary', { ascending: false })
      .order('display_order', { ascending: true });

    if (error) throw new Error(error.message);

    return (data || []).map((img: Record<string, unknown>) => ({
      id: img['id'] as string,
      variantId: img['variant_id'] as string,
      imageUrl: img['image_url'] as string,
      isPrimary: img['is_primary'] as boolean,
      displayOrder: img['display_order'] as number,
      color: (img['color'] as string) || null
    }));
  }

  async updateVariantSellingPrice(id: string, price: number): Promise<void> {
    const { error } = await this.supabase
      .from('variants')
      .update({ selling_price: price })
      .eq('id', id);

    if (error) throw new Error(error.message);

    // Also update selling_price on all products in this variant
    await this.supabase
      .from('products')
      .update({ selling_price: price })
      .eq('variant_id', id)
      .eq('product_type', 'phone');
  }

  async addStock(request: AddStockRequest): Promise<{ success: boolean; productsCreated: number; productIds: string[] }> {
    const { data, error } = await this.supabase.rpc('add_stock', {
      p_variant_id: request.variantId,
      p_color: request.color,
      p_cost_price: request.costPrice,
      p_quantity: request.quantity,
      p_supplier_id: request.supplierId || null,
      p_notes: request.notes || null,
      p_purchase_date: request.purchaseDate || null
    });

    if (error) throw new Error(error.message);

    return {
      success: data.success,
      productsCreated: data.productsCreated,
      productIds: data.productIds || []
    };
  }

  async getVariantsForModel(modelId: string): Promise<Variant[]> {
    const { data, error } = await this.supabase.rpc('get_model_variants_for_admin', {
      p_model_id: modelId
    });

    if (error) throw new Error(error.message);

    return (data?.variants || []).map((v: Record<string, unknown>) => ({
      id: v['id'] as string,
      modelId,
      modelName: '',
      brandId: '',
      brandName: '',
      storageGb: v['storageGb'] as number | null,
      ptaStatus: v['ptaStatus'] as string | null,
      condition: v['condition'] as ProductCondition,
      sellingPrice: Number(v['sellingPrice']),
      avgCostPrice: Number(v['avgCostPrice']),
      stockCount: Number(v['stockCount']),
      availableColors: (v['availableColors'] as string[]) || [],
      isActive: v['isActive'] as boolean,
      primaryImageUrl: v['primaryImageUrl'] as string | null,
      slug: v['slug'] as string || '',
      createdAt: '',
      updatedAt: null
    }));
  }
}
