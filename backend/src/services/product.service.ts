import { ProductRepository } from '../repositories/product.repository';
import { Product, ProductInsert, ProductUpdate, ProductWithRelations } from '../entities/product.entity';
import { ProductCondition, ProductStatus, ProductType } from '../enums';
import {
  CreateProductDto,
  UpdateProductDto,
  ProductResponseDto,
  ProductListResponseDto,
  ProductFilterDto,
  ProductSortDto,
  ProductPaginationDto
} from '../dto/product.dto';

/**
 * Product Service
 * Business logic for Product entity
 * Owner Module: M-04 Inventory
 */
export class ProductService {
  constructor(private readonly productRepository: ProductRepository) {}

  async findAll(
    filter?: ProductFilterDto,
    sort?: ProductSortDto,
    pagination?: ProductPaginationDto
  ): Promise<ProductListResponseDto> {
    const products = await this.productRepository.findAll({
      status: filter?.status,
      brandId: filter?.brandId,
      productType: filter?.productType,
      limit: pagination?.limit,
      offset: pagination ? (pagination.page - 1) * pagination.limit : undefined,
      orderBy: sort?.field,
      orderDirection: sort?.direction
    });

    const total = await this.productRepository.count(filter?.status);

    return {
      data: products.map(this.toResponseDto),
      total
    };
  }

  async findAvailable(
    filter?: ProductFilterDto,
    sort?: ProductSortDto,
    pagination?: ProductPaginationDto
  ): Promise<ProductListResponseDto> {
    return this.findAll(
      { ...filter, status: ProductStatus.AVAILABLE },
      sort,
      pagination
    );
  }

  async findById(id: string): Promise<ProductResponseDto | null> {
    const product = await this.productRepository.findById(id);
    return product ? this.toResponseDto(product) : null;
  }

  async create(dto: CreateProductDto): Promise<ProductResponseDto> {
    if (dto.imei) {
      const existing = await this.productRepository.findByImei(dto.imei);
      if (existing) {
        throw new Error(`Product with IMEI "${dto.imei}" already exists`);
      }
    }

    this.validateBatteryHealth(dto.condition, dto.batteryHealth);

    const productInsert: ProductInsert = {
      brand_id: dto.brandId,
      model: dto.model.trim(),
      description: dto.description?.trim() || null,
      storage_gb: dto.storageGb || null,
      ram_gb: dto.ramGb || null,
      color: dto.color?.trim() || null,
      condition: dto.condition,
      battery_health: dto.batteryHealth || null,
      imei: dto.imei?.trim() || null,
      cost_price: dto.costPrice,
      selling_price: dto.sellingPrice,
      status: dto.status || ProductStatus.AVAILABLE,
      purchase_date: dto.purchaseDate || null,
      supplier_id: dto.supplierId || null,
      notes: dto.notes?.trim() || null,
      tax_rate: dto.taxRate ?? 0,
      is_tax_inclusive: dto.isTaxInclusive ?? false,
      is_tax_exempt: dto.isTaxExempt ?? false,
      condition_rating: dto.conditionRating || null,
      pta_status: dto.ptaStatus || null,
      product_type: dto.productType || ProductType.PHONE,
      accessory_category: dto.accessoryCategory?.trim() || null,
      compatible_models: dto.compatibleModels || null,
      material: dto.material?.trim() || null,
      warranty_months: dto.warrantyMonths ?? null,
      weight_grams: dto.weightGrams ?? null,
      dimensions: dto.dimensions?.trim() || null,
    };

    const product = await this.productRepository.create(productInsert);
    const productWithRelations = await this.productRepository.findById(product.id);
    return this.toResponseDto(productWithRelations!);
  }

  async update(id: string, dto: UpdateProductDto): Promise<ProductResponseDto> {
    const existing = await this.productRepository.findById(id);
    if (!existing) {
      throw new Error(`Product with id "${id}" not found`);
    }

    if (dto.imei && dto.imei !== existing.imei) {
      const duplicate = await this.productRepository.findByImei(dto.imei);
      if (duplicate) {
        throw new Error(`Product with IMEI "${dto.imei}" already exists`);
      }
    }

    const condition = dto.condition || existing.condition;
    const batteryHealth = dto.batteryHealth !== undefined ? dto.batteryHealth : existing.battery_health;
    this.validateBatteryHealth(condition, batteryHealth);

    const productUpdate: ProductUpdate = {
      ...(dto.brandId && { brand_id: dto.brandId }),
      ...(dto.model && { model: dto.model.trim() }),
      ...(dto.description !== undefined && { description: dto.description?.trim() || null }),
      ...(dto.storageGb !== undefined && { storage_gb: dto.storageGb }),
      ...(dto.ramGb !== undefined && { ram_gb: dto.ramGb }),
      ...(dto.color !== undefined && { color: dto.color?.trim() || null }),
      ...(dto.condition && { condition: dto.condition }),
      ...(dto.batteryHealth !== undefined && { battery_health: dto.batteryHealth }),
      ...(dto.imei !== undefined && { imei: dto.imei?.trim() || null }),
      ...(dto.costPrice !== undefined && { cost_price: dto.costPrice }),
      ...(dto.sellingPrice !== undefined && { selling_price: dto.sellingPrice }),
      ...(dto.status && { status: dto.status }),
      ...(dto.purchaseDate !== undefined && { purchase_date: dto.purchaseDate }),
      ...(dto.supplierId !== undefined && { supplier_id: dto.supplierId }),
      ...(dto.notes !== undefined && { notes: dto.notes?.trim() || null }),
      ...(dto.taxRate !== undefined && { tax_rate: dto.taxRate }),
      ...(dto.isTaxInclusive !== undefined && { is_tax_inclusive: dto.isTaxInclusive }),
      ...(dto.isTaxExempt !== undefined && { is_tax_exempt: dto.isTaxExempt }),
      ...(dto.conditionRating !== undefined && { condition_rating: dto.conditionRating }),
      ...(dto.ptaStatus !== undefined && { pta_status: dto.ptaStatus }),
      ...(dto.productType !== undefined && { product_type: dto.productType }),
      ...(dto.accessoryCategory !== undefined && { accessory_category: dto.accessoryCategory?.trim() || null }),
      ...(dto.compatibleModels !== undefined && { compatible_models: dto.compatibleModels }),
      ...(dto.material !== undefined && { material: dto.material?.trim() || null }),
      ...(dto.warrantyMonths !== undefined && { warranty_months: dto.warrantyMonths }),
      ...(dto.weightGrams !== undefined && { weight_grams: dto.weightGrams }),
      ...(dto.dimensions !== undefined && { dimensions: dto.dimensions?.trim() || null }),
    };

    await this.productRepository.update(id, productUpdate);
    const productWithRelations = await this.productRepository.findById(id);
    return this.toResponseDto(productWithRelations!);
  }

  async updateStatus(id: string, status: ProductStatus): Promise<ProductResponseDto> {
    return this.update(id, { status });
  }

  async updateQuickStatus(id: string, status: ProductStatus): Promise<ProductResponseDto> {
    if (status === ProductStatus.SOLD) {
      throw new Error('Use the Mark as Sold workflow to sell a product');
    }

    const existing = await this.productRepository.findById(id);
    if (!existing) {
      throw new Error(`Product with id "${id}" not found`);
    }

    if (existing.status === ProductStatus.SOLD) {
      throw new Error('Cannot change status of a sold product');
    }

    await this.productRepository.update(id, { status });
    const productWithRelations = await this.productRepository.findById(id);
    return this.toResponseDto(productWithRelations!);
  }

  async bulkUpdateStatus(ids: string[], status: ProductStatus): Promise<void> {
    if (status === ProductStatus.SOLD) {
      throw new Error('Use the Mark as Sold workflow to sell products');
    }

    for (const id of ids) {
      await this.productRepository.update(id, { status });
    }
  }

  async delete(id: string): Promise<void> {
    const existing = await this.productRepository.findById(id);
    if (!existing) {
      throw new Error(`Product with id "${id}" not found`);
    }

    await this.productRepository.delete(id);
  }

  async getStockCount(): Promise<number> {
    return this.productRepository.count(ProductStatus.AVAILABLE);
  }

  async getStockValue(): Promise<number> {
    return this.productRepository.getStockValue(ProductStatus.AVAILABLE);
  }

  async getRecentProducts(limit: number = 5): Promise<ProductResponseDto[]> {
    const products = await this.productRepository.getRecentProducts(limit);
    return products.map(this.toResponseDto);
  }

  async findAllForExport(filter?: ProductFilterDto): Promise<ProductResponseDto[]> {
    const products = await this.productRepository.findAllForExport({
      status: filter?.status,
      brandId: filter?.brandId,
      search: filter?.search
    });

    return products.map(this.toResponseDto);
  }

  private validateBatteryHealth(condition: ProductCondition, batteryHealth: number | null | undefined): void {
    if ((condition === ProductCondition.USED || condition === ProductCondition.OPEN_BOX) && batteryHealth !== null && batteryHealth !== undefined) {
      if (batteryHealth < 0 || batteryHealth > 100) {
        throw new Error('Battery health must be between 0 and 100');
      }
    }
  }

  private toResponseDto(product: ProductWithRelations): ProductResponseDto {
    const primaryImage = product.images?.find(img => img.is_primary) || product.images?.[0];
    const profitMargin = product.selling_price > 0
      ? ((product.selling_price - product.cost_price) / product.selling_price) * 100
      : 0;

    return {
      id: product.id,
      brandId: product.brand_id,
      brandName: product.brand?.name || '',
      brandLogoUrl: product.brand?.logo_url || null,
      model: product.model,
      description: product.description,
      storageGb: product.storage_gb,
      ramGb: product.ram_gb,
      color: product.color,
      condition: product.condition,
      batteryHealth: product.battery_health,
      imei: product.imei,
      costPrice: product.cost_price,
      sellingPrice: product.selling_price,
      profitMargin: Math.round(profitMargin * 100) / 100,
      status: product.status,
      purchaseDate: product.purchase_date,
      supplierId: product.supplier_id,
      supplierName: product.supplier?.name || null,
      notes: product.notes,
      primaryImageUrl: primaryImage?.image_url || null,
      createdAt: product.created_at,
      updatedAt: product.updated_at,
      taxRate: product.tax_rate ?? 0,
      isTaxInclusive: product.is_tax_inclusive ?? false,
      isTaxExempt: product.is_tax_exempt ?? false,
      conditionRating: product.condition_rating ?? null,
      ptaStatus: product.pta_status ?? null,
      productType: product.product_type,
      accessoryCategory: product.accessory_category,
      compatibleModels: product.compatible_models,
      material: product.material,
      warrantyMonths: product.warranty_months,
      weightGrams: product.weight_grams,
      dimensions: product.dimensions,
    };
  }
}
