import { StockAlertConfigService } from '../services/stock-alert-config.service';
import {
  UpdateStockAlertConfigDto,
  StockAlertConfigResponseDto,
  StockAlertsResponseDto
} from '../dto/stock-alert-config.dto';

/**
 * StockAlertConfig Controller
 * HTTP request handling for StockAlertConfig entity
 * Routes: /api/stock-alert-config
 */
export class StockAlertConfigController {
  constructor(private readonly stockAlertConfigService: StockAlertConfigService) {}

  async get(): Promise<StockAlertConfigResponseDto> {
    return this.stockAlertConfigService.get();
  }

  async update(dto: UpdateStockAlertConfigDto): Promise<StockAlertConfigResponseDto> {
    this.validateUpdateDto(dto);
    return this.stockAlertConfigService.update(dto);
  }

  async getAlerts(): Promise<StockAlertsResponseDto> {
    return this.stockAlertConfigService.getAlerts();
  }

  private validateUpdateDto(dto: UpdateStockAlertConfigDto): void {
    if (dto.lowStockThreshold !== undefined) {
      if (dto.lowStockThreshold < 0) {
        throw new Error('Low stock threshold cannot be negative');
      }
      if (!Number.isInteger(dto.lowStockThreshold)) {
        throw new Error('Low stock threshold must be an integer');
      }
    }
  }
}
