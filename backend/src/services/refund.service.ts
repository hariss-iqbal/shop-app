import { RefundRepository } from '../repositories/refund.repository';
import { RefundWithItems, RefundStatus } from '../entities/refund.entity';
import {
  ProcessFullRefundDto,
  CheckReceiptRefundableDto,
  RefundResponseDto,
  RefundListResponseDto,
  RefundFilterDto,
  ProcessRefundResponseDto,
  CheckReceiptRefundableResponseDto,
  GetRefundByReceiptResponseDto,
  RefundSummaryDto,
  RefundItemResponseDto,
  ProcessPartialRefundDto,
  CheckPartialRefundableDto,
  ProcessPartialRefundResponseDto,
  CheckPartialRefundableResponseDto
} from '../dto/refund.dto';

/**
 * Refund Service
 * Business logic for Refund entity
 * Owner Module: M-07 Sales
 * Feature: F-009 Full Refund Processing
 */
export class RefundService {
  constructor(private readonly refundRepository: RefundRepository) {}

  async findAll(filter?: RefundFilterDto): Promise<RefundListResponseDto> {
    const refunds = await this.refundRepository.findAll({
      startDate: filter?.startDate,
      endDate: filter?.endDate,
      status: filter?.status,
      customerPhone: filter?.customerPhone,
      refundNumber: filter?.refundNumber,
      limit: filter?.limit,
      offset: filter?.page && filter?.limit ? (filter.page - 1) * filter.limit : undefined
    });

    const total = await this.refundRepository.count({
      startDate: filter?.startDate,
      endDate: filter?.endDate,
      status: filter?.status
    });

    return {
      data: refunds.map(this.toResponseDto),
      total
    };
  }

  async findById(id: string): Promise<RefundResponseDto | null> {
    const refund = await this.refundRepository.findById(id);
    return refund ? this.toResponseDto(refund) : null;
  }

  async findByRefundNumber(refundNumber: string): Promise<RefundResponseDto | null> {
    const refund = await this.refundRepository.findByRefundNumber(refundNumber);
    return refund ? this.toResponseDto(refund) : null;
  }

  /**
   * Process a full refund for an entire transaction
   * Creates refund record, refund items, and restores inventory
   * Feature: F-009 Full Refund Processing
   */
  async processFullRefund(dto: ProcessFullRefundDto): Promise<ProcessRefundResponseDto> {
    const result = await this.refundRepository.processFullRefund(
      dto.receiptId,
      dto.refundReason?.trim() || null,
      dto.notes?.trim() || null
    );

    if (!result.success) {
      return {
        success: false,
        error: result.error
      };
    }

    return {
      success: true,
      refundId: result.refundId,
      refundNumber: result.refundNumber,
      originalReceiptId: result.originalReceiptId,
      originalReceiptNumber: result.originalReceiptNumber,
      refundAmount: result.refundAmount,
      itemsRefunded: result.itemsRefunded,
      inventoryRestored: result.inventoryRestored,
      items: result.items
    };
  }

  /**
   * Check if a receipt can be refunded
   * Returns details about the receipt and any existing refunds
   * Feature: F-009 Full Refund Processing
   */
  async checkReceiptRefundable(dto: CheckReceiptRefundableDto): Promise<CheckReceiptRefundableResponseDto> {
    const result = await this.refundRepository.checkReceiptRefundable(dto.receiptId);

    return {
      canRefund: result.canRefund,
      reason: result.reason,
      receiptId: result.receiptId,
      receiptNumber: result.receiptNumber,
      transactionDate: result.transactionDate,
      transactionTime: result.transactionTime,
      subtotal: result.subtotal,
      taxRate: result.taxRate,
      taxAmount: result.taxAmount,
      grandTotal: result.grandTotal,
      customerName: result.customerName,
      customerPhone: result.customerPhone,
      customerEmail: result.customerEmail,
      existingRefundId: result.existingRefundId,
      existingRefundNumber: result.existingRefundNumber,
      items: result.items
    };
  }

  /**
   * Get refund by receipt ID
   * Feature: F-009 Full Refund Processing
   */
  async getRefundByReceipt(receiptId: string): Promise<GetRefundByReceiptResponseDto> {
    const result = await this.refundRepository.getRefundByReceipt(receiptId);

    if (!result.found || !result.refund) {
      return {
        found: false,
        receiptId
      };
    }

    const refundData = result.refund;
    const items = refundData.items.map(item => ({
      id: item.id,
      originalSaleId: item.originalSaleId,
      productId: item.productId,
      itemName: item.itemName,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      total: item.total,
      inventoryRestored: item.inventoryRestored,
      originalUnitPrice: item.originalUnitPrice,
      isCustomPrice: item.isCustomPrice,
      priceDifference: item.priceDifference,
      productModel: item.productModel,
      brandName: item.brandName
    }));

    const hasCustomPrices = items.some(i => i.isCustomPrice);

    return {
      found: true,
      receiptId,
      refund: {
        id: refundData.id,
        refundNumber: refundData.refundNumber,
        originalReceiptId: refundData.originalReceiptId,
        originalReceiptNumber: null,
        refundDate: refundData.refundDate,
        refundTime: refundData.refundTime,
        subtotal: refundData.subtotal,
        taxRate: refundData.taxRate,
        taxAmount: refundData.taxAmount,
        refundAmount: refundData.refundAmount,
        refundReason: refundData.refundReason,
        customerName: refundData.customerName,
        customerPhone: refundData.customerPhone,
        customerEmail: refundData.customerEmail,
        status: refundData.status,
        notes: refundData.notes,
        isPartialRefund: refundData.isPartialRefund ?? false,
        managerApproved: refundData.managerApproved ?? false,
        managerApprovedAt: refundData.managerApprovedAt ?? null,
        managerApprovalReason: refundData.managerApprovalReason ?? null,
        items,
        itemCount: items.length,
        inventoryRestoredCount: items.filter(i => i.inventoryRestored).length,
        hasCustomPrices,
        createdAt: refundData.createdAt,
        updatedAt: null
      }
    };
  }

  /**
   * Get refund summary statistics
   */
  async getSummary(filter?: RefundFilterDto): Promise<RefundSummaryDto> {
    const totalRefunds = await this.refundRepository.count({
      startDate: filter?.startDate,
      endDate: filter?.endDate,
      status: 'completed'
    });

    const totalRefundAmount = await this.refundRepository.getTotalRefundAmount({
      startDate: filter?.startDate,
      endDate: filter?.endDate,
      status: 'completed'
    });

    const refunds = await this.refundRepository.findAll({
      startDate: filter?.startDate,
      endDate: filter?.endDate,
      status: 'completed'
    });

    let totalItemsRefunded = 0;
    let totalInventoryRestored = 0;

    refunds.forEach(refund => {
      if (refund.items) {
        totalItemsRefunded += refund.items.length;
        totalInventoryRestored += refund.items.filter(i => i.inventory_restored).length;
      }
    });

    return {
      totalRefunds,
      totalRefundAmount,
      totalItemsRefunded,
      totalInventoryRestored
    };
  }

  /**
   * Get refunds by month for a given year
   */
  async getRefundsByMonth(year: number): Promise<{ month: number; count: number; amount: number }[]> {
    return this.refundRepository.getRefundsByMonth(year);
  }

  /**
   * Find all refunds for a customer by phone number
   */
  async findByCustomerPhone(customerPhone: string): Promise<RefundListResponseDto> {
    if (!customerPhone || !customerPhone.trim()) {
      throw new Error('Phone number is required');
    }

    const refunds = await this.refundRepository.findByCustomerPhone(customerPhone);

    return {
      data: refunds.map(this.toResponseDto),
      total: refunds.length
    };
  }

  /**
   * Check if a receipt can be partially refunded
   * Returns detailed item info for selection
   * Feature: F-010 Partial Refund Processing
   */
  async checkReceiptPartialRefundable(dto: CheckPartialRefundableDto): Promise<CheckPartialRefundableResponseDto> {
    const result = await this.refundRepository.checkReceiptPartialRefundable(dto.receiptId);

    return {
      canPartialRefund: result.canPartialRefund,
      reason: result.reason,
      receiptId: result.receiptId,
      receiptNumber: result.receiptNumber,
      transactionDate: result.transactionDate,
      transactionTime: result.transactionTime,
      originalSubtotal: result.originalSubtotal,
      taxRate: result.taxRate,
      originalTaxAmount: result.originalTaxAmount,
      originalGrandTotal: result.originalGrandTotal,
      customerName: result.customerName,
      customerPhone: result.customerPhone,
      customerEmail: result.customerEmail,
      existingRefundId: result.existingRefundId,
      existingRefundNumber: result.existingRefundNumber,
      existingPartialRefunds: result.existingPartialRefunds,
      alreadyRefundedItemCount: result.alreadyRefundedItemCount,
      items: result.items
    };
  }

  /**
   * Process a partial refund with custom return prices
   * Creates refund record, refund items for selected items, and restores inventory
   * Feature: F-010 Partial Refund Processing
   */
  async processPartialRefund(dto: ProcessPartialRefundDto): Promise<ProcessPartialRefundResponseDto> {
    // Validate items array
    if (!dto.items || dto.items.length === 0) {
      return {
        success: false,
        error: 'No items selected for refund'
      };
    }

    // Convert items to repository format
    const items = dto.items.map(item => ({
      receiptItemId: item.receiptItemId,
      returnPrice: item.returnPrice
    }));

    const result = await this.refundRepository.processPartialRefund(
      dto.receiptId,
      items,
      dto.refundReason?.trim() || null,
      dto.notes?.trim() || null,
      dto.managerApproved || false,
      dto.managerApprovalReason?.trim() || null
    );

    if (!result.success) {
      return {
        success: false,
        error: result.error
      };
    }

    return {
      success: true,
      refundId: result.refundId,
      refundNumber: result.refundNumber,
      originalReceiptId: result.originalReceiptId,
      originalReceiptNumber: result.originalReceiptNumber,
      isPartialRefund: result.isPartialRefund,
      subtotal: result.subtotal,
      taxRate: result.taxRate,
      taxAmount: result.taxAmount,
      refundAmount: result.refundAmount,
      itemsRefunded: result.itemsRefunded,
      inventoryRestored: result.inventoryRestored,
      hasCustomPrices: result.hasCustomPrices,
      managerApproved: result.managerApproved,
      items: result.items
    };
  }

  /**
   * Find all partial refunds for a receipt
   * Feature: F-010 Partial Refund Processing
   */
  async findPartialRefundsByReceiptId(receiptId: string): Promise<RefundListResponseDto> {
    const refunds = await this.refundRepository.findPartialRefundsByReceiptId(receiptId);

    return {
      data: refunds.map(this.toResponseDto),
      total: refunds.length
    };
  }

  private toResponseDto(refund: RefundWithItems): RefundResponseDto {
    const items: RefundItemResponseDto[] = (refund.items || []).map(item => ({
      id: item.id,
      originalSaleId: item.original_sale_id,
      productId: item.product_id,
      itemName: item.item_name,
      quantity: item.quantity,
      unitPrice: item.unit_price,
      total: item.total,
      inventoryRestored: item.inventory_restored,
      originalUnitPrice: item.original_unit_price,
      isCustomPrice: item.is_custom_price,
      priceDifference: item.price_difference
    }));

    const inventoryRestoredCount = items.filter(i => i.inventoryRestored).length;
    const hasCustomPrices = items.some(i => i.isCustomPrice);

    return {
      id: refund.id,
      refundNumber: refund.refund_number,
      originalReceiptId: refund.original_receipt_id,
      originalReceiptNumber: refund.original_receipt?.receipt_number || null,
      refundDate: refund.refund_date,
      refundTime: refund.refund_time,
      subtotal: refund.subtotal,
      taxRate: refund.tax_rate,
      taxAmount: refund.tax_amount,
      refundAmount: refund.refund_amount,
      refundReason: refund.refund_reason,
      customerName: refund.customer_name,
      customerPhone: refund.customer_phone,
      customerEmail: refund.customer_email,
      status: refund.status,
      notes: refund.notes,
      isPartialRefund: refund.is_partial_refund,
      managerApproved: refund.manager_approved,
      managerApprovedAt: refund.manager_approved_at,
      managerApprovalReason: refund.manager_approval_reason,
      items,
      itemCount: items.length,
      inventoryRestoredCount,
      hasCustomPrices,
      createdAt: refund.created_at,
      updatedAt: refund.updated_at
    };
  }
}
