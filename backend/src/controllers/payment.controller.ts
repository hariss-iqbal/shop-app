import { PaymentService } from '../services/payment.service';
import { InputSanitizationService } from '../services/input-sanitization.service';
import {
  PaymentDetailDto,
  PaymentResponseDto,
  RecordSalePaymentsDto,
  CalculateCashChangeDto,
  CashChangeResponseDto,
  SplitPaymentValidationDto,
  PAYMENT_CONSTRAINTS
} from '../dto/payment.dto';
import { isValidPaymentMethod, PaymentMethod } from '../enums';

/**
 * Payment Controller
 * HTTP request handling for payment operations
 * Routes: /api/payments
 * Feature: F-018 Payment Method Integration
 */
export class PaymentController {
  private readonly sanitizer = new InputSanitizationService();

  constructor(private readonly paymentService: PaymentService) {}

  /**
   * Record payments for a sale
   * POST /api/payments/sale
   */
  async recordSalePayments(dto: RecordSalePaymentsDto): Promise<PaymentResponseDto[]> {
    this.validateRecordSalePaymentsDto(dto);
    const sanitizedPayments = dto.payments.map(p => this.sanitizePaymentDetail(p));
    return this.paymentService.recordSalePayments(dto.saleId, sanitizedPayments);
  }

  /**
   * Get payments for a sale
   * GET /api/payments/sale/:saleId
   */
  async getPaymentsForSale(saleId: string): Promise<PaymentResponseDto[]> {
    if (!saleId) {
      throw new Error('Sale ID is required');
    }
    return this.paymentService.getPaymentsForSale(saleId);
  }

  /**
   * Calculate cash change
   * POST /api/payments/calculate-change
   */
  calculateCashChange(dto: CalculateCashChangeDto): CashChangeResponseDto {
    this.validateCalculateCashChangeDto(dto);
    return this.paymentService.calculateCashChange(dto.amountDue, dto.cashTendered);
  }

  /**
   * Validate split payment totals
   * POST /api/payments/validate-split
   */
  validateSplitPayment(payments: PaymentDetailDto[], totalDue: number): SplitPaymentValidationDto {
    if (!payments || payments.length === 0) {
      throw new Error('At least one payment is required');
    }
    if (totalDue < 0) {
      throw new Error('Total due cannot be negative');
    }

    for (const payment of payments) {
      this.validatePaymentDetail(payment);
    }

    return this.paymentService.validateSplitPayment(payments, totalDue);
  }

  /**
   * Get available payment methods
   * GET /api/payments/methods
   */
  getPaymentMethods(): Array<{ value: PaymentMethod; label: string }> {
    return [
      { value: PaymentMethod.CASH, label: 'Cash' },
      { value: PaymentMethod.CARD, label: 'Card' },
      { value: PaymentMethod.BANK_TRANSFER, label: 'Bank Transfer' }
    ];
  }

  private sanitizePaymentDetail(payment: PaymentDetailDto): PaymentDetailDto {
    return {
      ...payment,
      cardType: payment.cardType ? this.sanitizer.sanitizeString(payment.cardType) : null,
      transactionReference: payment.transactionReference ? this.sanitizer.sanitizeString(payment.transactionReference) : null,
      paymentDescription: payment.paymentDescription ? this.sanitizer.sanitizeString(payment.paymentDescription) : null
    };
  }

  private validateRecordSalePaymentsDto(dto: RecordSalePaymentsDto): void {
    if (!dto.saleId) {
      throw new Error('Sale ID is required');
    }
    if (!dto.payments || dto.payments.length === 0) {
      throw new Error('At least one payment is required');
    }
    for (const payment of dto.payments) {
      this.validatePaymentDetail(payment);
    }
  }

  private validateCalculateCashChangeDto(dto: CalculateCashChangeDto): void {
    if (dto.amountDue === undefined || dto.amountDue < 0) {
      throw new Error('Valid amount due is required');
    }
    if (dto.cashTendered === undefined || dto.cashTendered < 0) {
      throw new Error('Valid cash tendered amount is required');
    }
  }

  private validatePaymentDetail(payment: PaymentDetailDto): void {
    if (!isValidPaymentMethod(payment.method)) {
      throw new Error(`Invalid payment method: ${payment.method}`);
    }

    if (payment.amount === undefined || payment.amount < 0) {
      throw new Error('Valid payment amount is required');
    }

    if (payment.method === PaymentMethod.CASH && payment.cashTendered !== undefined) {
      if (payment.cashTendered < 0) {
        throw new Error('Cash tendered cannot be negative');
      }
    }

    if (payment.method === PaymentMethod.CARD && payment.cardLastFour) {
      if (payment.cardLastFour.length !== PAYMENT_CONSTRAINTS.CARD_LAST_FOUR_LENGTH) {
        throw new Error(`Card last four must be exactly ${PAYMENT_CONSTRAINTS.CARD_LAST_FOUR_LENGTH} digits`);
      }
      if (!/^\d{4}$/.test(payment.cardLastFour)) {
        throw new Error('Card last four must contain only digits');
      }
    }

    if (payment.cardType && payment.cardType.length > PAYMENT_CONSTRAINTS.CARD_TYPE_MAX) {
      throw new Error(`Card type must not exceed ${PAYMENT_CONSTRAINTS.CARD_TYPE_MAX} characters`);
    }

    if (payment.transactionReference && payment.transactionReference.length > PAYMENT_CONSTRAINTS.TRANSACTION_REFERENCE_MAX) {
      throw new Error(`Transaction reference must not exceed ${PAYMENT_CONSTRAINTS.TRANSACTION_REFERENCE_MAX} characters`);
    }

    if (payment.paymentDescription && payment.paymentDescription.length > PAYMENT_CONSTRAINTS.PAYMENT_DESCRIPTION_MAX) {
      throw new Error(`Payment description must not exceed ${PAYMENT_CONSTRAINTS.PAYMENT_DESCRIPTION_MAX} characters`);
    }
  }
}
