import { StockAlertConfigRepository } from '../repositories/stock-alert-config.repository';
import { ProductRepository } from '../repositories/product.repository';
import { BrandRepository } from '../repositories/brand.repository';
import { StockAlertConfig, StockAlertConfigUpdate } from '../entities/stock-alert-config.entity';
import { ProductStatus } from '../enums';
import {
  UpdateStockAlertConfigDto,
  StockAlertConfigResponseDto,
  StockAlertDto,
  StockAlertsResponseDto
} from '../dto/stock-alert-config.dto';

/**
 * StockAlertConfig Service
 * Business logic for StockAlertConfig entity
 * Owner Module: M-09 Dashboard
 */
export class StockAlertConfigService {
  constructor(
    private readonly stockAlertConfigRepository: StockAlertConfigRepository,
    private readonly productRepository: ProductRepository,
    private readonly brandRepository: BrandRepository
  ) {}

  async get(): Promise<StockAlertConfigResponseDto> {
    const config = await this.stockAlertConfigRepository.getOrCreate();
    return this.toResponseDto(config);
  }

  async update(dto: UpdateStockAlertConfigDto): Promise<StockAlertConfigResponseDto> {
    const existing = await this.stockAlertConfigRepository.getOrCreate();

    const configUpdate: StockAlertConfigUpdate = {
      ...(dto.lowStockThreshold !== undefined && { low_stock_threshold: dto.lowStockThreshold }),
      ...(dto.enableBrandZeroAlert !== undefined && { enable_brand_zero_alert: dto.enableBrandZeroAlert }),
      ...(dto.allowOversell !== undefined && { allow_oversell: dto.allowOversell })
    };

    const config = await this.stockAlertConfigRepository.update(existing.id, configUpdate);
    return this.toResponseDto(config);
  }

  async getAlerts(): Promise<StockAlertsResponseDto> {
    const config = await this.stockAlertConfigRepository.getOrCreate();
    const alerts: StockAlertDto[] = [];

    const totalStock = await this.productRepository.count(ProductStatus.AVAILABLE);

    if (totalStock < config.low_stock_threshold) {
      alerts.push({
        type: 'low_stock',
        currentStock: totalStock,
        threshold: config.low_stock_threshold,
        message: `Total stock (${totalStock}) is below threshold (${config.low_stock_threshold})`
      });
    }

    if (config.enable_brand_zero_alert) {
      const brands = await this.brandRepository.findAll();

      for (const brand of brands) {
        const brandStock = await this.productRepository.countByBrand(brand.id, ProductStatus.AVAILABLE);

        if (brandStock === 0) {
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

    return {
      alerts,
      config: this.toResponseDto(config)
    };
  }

  private toResponseDto(config: StockAlertConfig): StockAlertConfigResponseDto {
    return {
      id: config.id,
      lowStockThreshold: config.low_stock_threshold,
      enableBrandZeroAlert: config.enable_brand_zero_alert,
      allowOversell: config.allow_oversell,
      createdAt: config.created_at,
      updatedAt: config.updated_at
    };
  }
}
