import { SaleRepository } from '../repositories/sale.repository';
import { PhoneRepository } from '../repositories/phone.repository';
import { SalePaymentRepository } from '../repositories/sale-payment.repository';
import { SaleWithRelations } from '../entities/sale.entity';
import { PaymentSummaryJson } from '../entities/sale-payment.entity';
import {
  CreateSaleDto,
  UpdateSaleDto,
  SaleResponseDto,
  SaleListResponseDto,
  SaleFilterDto,
  SaleSummaryDto,
  MarkAsSoldDto,
  CompleteBatchSaleDto,
  SaleWithInventoryDeductionResponseDto,
  BatchSaleWithInventoryDeductionResponseDto,
  InventoryAvailabilityResponseDto,
  CheckInventoryAvailabilityDto
} from '../dto/sale.dto';
import { PaymentDetailDto, PaymentSummaryDto } from '../dto/payment.dto';
import { PaymentMethod } from '../enums';

/**
 * Sale Service
 * Business logic for Sale entity
 * Owner Module: M-07 Sales
 * Feature: F-008 Automatic Inventory Deduction
 * Feature: F-018 Payment Method Integration
 */
export class SaleService {
  constructor(
    private readonly saleRepository: SaleRepository,
    private readonly phoneRepository: PhoneRepository,
    private readonly salePaymentRepository?: SalePaymentRepository
  ) {}

  async findAll(filter?: SaleFilterDto): Promise<SaleListResponseDto> {
    const sales = await this.saleRepository.findAll({
      startDate: filter?.startDate,
      endDate: filter?.endDate,
      locationId: filter?.locationId
    });

    const total = await this.saleRepository.count({
      startDate: filter?.startDate,
      endDate: filter?.endDate
    });

    return {
      data: sales.map(this.toResponseDto),
      total
    };
  }

  async findById(id: string): Promise<SaleResponseDto | null> {
    const sale = await this.saleRepository.findById(id);
    return sale ? this.toResponseDto(sale) : null;
  }

  /**
   * Create a sale with automatic inventory deduction
   * Uses atomic RPC to ensure consistency
   * Feature: F-008 Automatic Inventory Deduction
   * Feature: F-024 Multi-Location Inventory Support
   */
  async create(dto: CreateSaleDto): Promise<SaleWithInventoryDeductionResponseDto> {
    const result = await this.saleRepository.completeSaleWithInventoryDeduction(
      dto.phoneId,
      dto.saleDate,
      dto.salePrice,
      dto.buyerName?.trim() || null,
      dto.buyerPhone?.trim() || null,
      dto.buyerEmail?.trim() || null,
      dto.notes?.trim() || null,
      dto.locationId || null
    );

    if (!result.success) {
      return {
        success: false,
        phoneId: dto.phoneId,
        inventoryDeducted: false,
        error: result.error
      };
    }

    const saleWithRelations = await this.saleRepository.findById(result.saleId!);

    return {
      success: true,
      sale: saleWithRelations ? this.toResponseDto(saleWithRelations) : undefined,
      phoneId: result.phoneId,
      previousStatus: result.previousStatus,
      newStatus: result.newStatus,
      warning: result.warning,
      inventoryDeducted: result.inventoryDeducted
    };
  }

  /**
   * Mark a phone as sold with automatic inventory deduction
   * Uses atomic RPC to ensure consistency
   * Feature: F-008 Automatic Inventory Deduction
   * Feature: F-024 Multi-Location Inventory Support
   */
  async markAsSold(dto: MarkAsSoldDto): Promise<SaleWithInventoryDeductionResponseDto> {
    const result = await this.saleRepository.completeSaleWithInventoryDeduction(
      dto.phoneId,
      dto.saleDate,
      dto.salePrice,
      dto.buyerName?.trim() || null,
      dto.buyerPhone?.trim() || null,
      dto.buyerEmail?.trim() || null,
      dto.notes?.trim() || null,
      dto.locationId || null
    );

    if (!result.success) {
      return {
        success: false,
        phoneId: dto.phoneId,
        inventoryDeducted: false,
        error: result.error
      };
    }

    const saleWithRelations = await this.saleRepository.findById(result.saleId!);

    return {
      success: true,
      sale: saleWithRelations ? this.toResponseDto(saleWithRelations) : undefined,
      phoneId: result.phoneId,
      previousStatus: result.previousStatus,
      newStatus: result.newStatus,
      warning: result.warning,
      inventoryDeducted: result.inventoryDeducted
    };
  }

  /**
   * Complete a batch sale with automatic inventory deduction
   * All items are processed atomically - all succeed or all fail
   * Feature: F-008 Automatic Inventory Deduction
   * Feature: F-024 Multi-Location Inventory Support
   */
  async completeBatchSale(dto: CompleteBatchSaleDto): Promise<BatchSaleWithInventoryDeductionResponseDto> {
    const result = await this.saleRepository.completeBatchSaleWithInventoryDeduction(
      dto.items,
      dto.saleDate,
      dto.buyerName?.trim() || null,
      dto.buyerPhone?.trim() || null,
      dto.buyerEmail?.trim() || null,
      dto.notes?.trim() || null,
      dto.locationId || null
    );

    if (!result.success) {
      return {
        success: false,
        totalItems: result.totalItems,
        processedItems: result.processedItems,
        inventoryDeducted: false,
        error: result.error
      };
    }

    // Fetch full sale data with relations
    const sales: SaleResponseDto[] = [];
    if (result.sales) {
      for (const saleResult of result.sales) {
        const saleWithRelations = await this.saleRepository.findById(saleResult.saleId);
        if (saleWithRelations) {
          sales.push(this.toResponseDto(saleWithRelations));
        }
      }
    }

    return {
      success: true,
      totalItems: result.totalItems,
      processedItems: result.processedItems,
      sales,
      warnings: result.warnings,
      inventoryDeducted: result.inventoryDeducted
    };
  }

  /**
   * Check inventory availability before completing a sale
   * Feature: F-008 Automatic Inventory Deduction
   */
  async checkInventoryAvailability(dto: CheckInventoryAvailabilityDto): Promise<InventoryAvailabilityResponseDto> {
    return this.saleRepository.checkInventoryAvailability(dto.phoneIds);
  }

  async update(id: string, dto: UpdateSaleDto): Promise<SaleResponseDto> {
    const existing = await this.saleRepository.findById(id);
    if (!existing) {
      throw new Error(`Sale with id "${id}" not found`);
    }

    const saleUpdate = {
      ...(dto.saleDate && { sale_date: dto.saleDate }),
      ...(dto.salePrice !== undefined && { sale_price: dto.salePrice }),
      ...(dto.buyerName !== undefined && { buyer_name: dto.buyerName?.trim() || null }),
      ...(dto.buyerPhone !== undefined && { buyer_phone: dto.buyerPhone?.trim() || null }),
      ...(dto.buyerEmail !== undefined && { buyer_email: dto.buyerEmail?.trim() || null }),
      ...(dto.notes !== undefined && { notes: dto.notes?.trim() || null })
    };

    await this.saleRepository.update(id, saleUpdate);
    const saleWithRelations = await this.saleRepository.findById(id);
    return this.toResponseDto(saleWithRelations!);
  }

  /**
   * Delete a sale and restore inventory (phone status to available)
   * Uses atomic RPC to ensure consistency
   * Feature: F-008 Automatic Inventory Deduction
   */
  async delete(id: string): Promise<{ success: boolean; inventoryRestored: boolean; error?: string }> {
    const result = await this.saleRepository.revertSaleRestoreInventory(id);

    if (!result.success) {
      return {
        success: false,
        inventoryRestored: false,
        error: result.error
      };
    }

    return {
      success: true,
      inventoryRestored: result.inventoryRestored
    };
  }

  async getSummary(filter?: SaleFilterDto): Promise<SaleSummaryDto> {
    const totalSales = await this.saleRepository.count({
      startDate: filter?.startDate,
      endDate: filter?.endDate
    });

    const totalRevenue = await this.saleRepository.getTotalRevenue({
      startDate: filter?.startDate,
      endDate: filter?.endDate
    });

    const totalProfit = await this.saleRepository.getTotalProfit({
      startDate: filter?.startDate,
      endDate: filter?.endDate
    });

    const totalCost = totalRevenue - totalProfit;
    const averageMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

    return {
      totalSales,
      totalRevenue,
      totalCost,
      totalProfit,
      averageMargin
    };
  }

  async getSalesByMonth(year: number): Promise<{ month: number; count: number; revenue: number }[]> {
    return this.saleRepository.getSalesByMonth(year);
  }

  /**
   * Find all sales for a customer by their phone number
   * Returns purchase history sorted by date with most recent first
   */
  async findByBuyerPhone(buyerPhone: string): Promise<SaleListResponseDto> {
    if (!buyerPhone || !buyerPhone.trim()) {
      throw new Error('Phone number is required');
    }

    const sales = await this.saleRepository.findByBuyerPhone(buyerPhone);

    return {
      data: sales.map(this.toResponseDto),
      total: sales.length
    };
  }

  /**
   * Record payments for a sale after it's created
   * Feature: F-018 Payment Method Integration
   */
  async recordPayments(saleId: string, payments: PaymentDetailDto[]): Promise<void> {
    if (!this.salePaymentRepository || !payments || payments.length === 0) {
      return;
    }

    const paymentInserts = payments.map(p => ({
      sale_id: saleId,
      payment_method: p.method,
      amount: p.amount,
      cash_tendered: p.cashTendered ?? null,
      change_given: p.method === PaymentMethod.CASH && p.cashTendered && p.cashTendered > p.amount
        ? p.cashTendered - p.amount
        : null,
      card_last_four: p.cardLastFour ?? null,
      card_type: p.cardType ?? null,
      transaction_reference: p.transactionReference ?? null,
      payment_description: p.paymentDescription ?? null
    }));

    await this.salePaymentRepository.createMany(paymentInserts);
  }

  private toResponseDto(sale: SaleWithRelations): SaleResponseDto {
    // Parse payment summary from JSONB
    const paymentSummary = this.parsePaymentSummary(sale.payment_summary);

    return {
      id: sale.id,
      phoneId: sale.phone_id,
      brandName: sale.phone?.brand?.name || '',
      phoneName: sale.phone?.model || '',
      saleDate: sale.sale_date,
      salePrice: sale.sale_price,
      costPrice: sale.cost_price,
      profit: sale.sale_price - sale.cost_price,
      buyerName: sale.buyer_name,
      buyerPhone: sale.buyer_phone,
      buyerEmail: sale.buyer_email,
      notes: sale.notes,
      createdAt: sale.created_at,
      updatedAt: sale.updated_at,
      taxRate: sale.tax_rate || 0,
      taxAmount: sale.tax_amount || 0,
      basePrice: sale.base_price,
      isTaxExempt: sale.is_tax_exempt || false,
      paymentSummary,
      isSplitPayment: sale.is_split_payment || false,
      primaryPaymentMethod: sale.primary_payment_method || null,
      locationId: sale.location_id || null,
      locationName: sale.location?.name || null
    };
  }

  /**
   * Parse payment summary from JSONB column
   */
  private parsePaymentSummary(json: PaymentSummaryJson[] | null | undefined): PaymentSummaryDto[] {
    if (!json || !Array.isArray(json)) {
      return [];
    }
    return json.map(p => ({
      method: p.method,
      amount: p.amount,
      cardLastFour: p.cardLastFour ?? null,
      transactionReference: p.transactionReference ?? null,
      cashTendered: p.cashTendered ?? null,
      changeGiven: p.changeGiven ?? null
    }));
  }
}
