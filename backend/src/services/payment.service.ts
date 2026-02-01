import { SalePaymentRepository, ReceiptPaymentRepository } from '../repositories';
import { SalePaymentInsert, ReceiptPaymentInsert, PaymentSummaryJson } from '../entities';
import {
  PaymentDetailDto,
  PaymentResponseDto,
  PaymentSummaryDto,
  CashChangeResponseDto,
  SplitPaymentValidationDto,
  PAYMENT_CONSTRAINTS
} from '../dto/payment.dto';
import { PaymentMethod, isValidPaymentMethod } from '../enums';

/**
 * Payment Service
 * Business logic for payment method handling
 * Feature: F-018 Payment Method Integration
 */
export class PaymentService {
  constructor(
    private readonly salePaymentRepository: SalePaymentRepository,
    private readonly receiptPaymentRepository: ReceiptPaymentRepository
  ) {}

  /**
   * Record payments for a sale
   * Supports single payment or split payment (multiple methods)
   */
  async recordSalePayments(saleId: string, payments: PaymentDetailDto[]): Promise<PaymentResponseDto[]> {
    // Validate payments
    for (const payment of payments) {
      this.validatePaymentDetail(payment);
    }

    // Convert to insert format
    const paymentInserts: SalePaymentInsert[] = payments.map(p => ({
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

    const created = await this.salePaymentRepository.createMany(paymentInserts);

    return created.map(this.toPaymentResponseDto);
  }

  /**
   * Record payments for a receipt
   */
  async recordReceiptPayments(receiptId: string, payments: PaymentDetailDto[]): Promise<void> {
    const paymentInserts: ReceiptPaymentInsert[] = payments.map(p => ({
      receipt_id: receiptId,
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

    await this.receiptPaymentRepository.createMany(paymentInserts);
  }

  /**
   * Get payments for a sale
   */
  async getPaymentsForSale(saleId: string): Promise<PaymentResponseDto[]> {
    const payments = await this.salePaymentRepository.findBySaleId(saleId);
    return payments.map(this.toPaymentResponseDto);
  }

  /**
   * Calculate change for cash payment
   */
  calculateCashChange(amountDue: number, cashTendered: number): CashChangeResponseDto {
    const changeGiven = cashTendered >= amountDue ? cashTendered - amountDue : 0;

    return {
      amountDue,
      cashTendered,
      changeGiven,
      isExact: cashTendered === amountDue,
      isInsufficient: cashTendered < amountDue
    };
  }

  /**
   * Validate split payment totals
   */
  validateSplitPayment(payments: PaymentDetailDto[], totalDue: number): SplitPaymentValidationDto {
    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
    const difference = totalPaid - totalDue;
    const tolerance = 0.01; // Allow 1 cent tolerance for rounding

    const isValid = Math.abs(difference) <= tolerance;

    let message = '';
    if (isValid) {
      message = 'Payment amounts match total due';
    } else if (totalPaid < totalDue) {
      message = `Underpayment: ${Math.abs(difference).toFixed(2)} remaining`;
    } else {
      message = `Overpayment: ${difference.toFixed(2)} excess`;
    }

    return {
      isValid,
      totalPaid,
      amountDue: totalDue,
      difference,
      message
    };
  }

  /**
   * Convert payment details to payment summary for storage
   */
  toPaymentSummary(payments: PaymentDetailDto[]): PaymentSummaryDto[] {
    return payments.map(p => ({
      method: p.method,
      amount: p.amount,
      cardLastFour: p.cardLastFour ?? null,
      transactionReference: p.transactionReference ?? null,
      cashTendered: p.cashTendered ?? null,
      changeGiven: p.method === PaymentMethod.CASH && p.cashTendered && p.cashTendered > p.amount
        ? p.cashTendered - p.amount
        : null
    }));
  }

  /**
   * Convert payment summary JSON to DTO format
   */
  fromPaymentSummaryJson(json: PaymentSummaryJson[] | null | undefined): PaymentSummaryDto[] {
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

  /**
   * Determine primary payment method (method with largest amount)
   */
  getPrimaryPaymentMethod(payments: PaymentDetailDto[]): PaymentMethod | null {
    if (!payments || payments.length === 0) {
      return null;
    }
    const sorted = [...payments].sort((a, b) => b.amount - a.amount);
    return sorted[0].method;
  }

  /**
   * Check if payment uses split payment (multiple methods)
   */
  isSplitPayment(payments: PaymentDetailDto[]): boolean {
    return payments && payments.length > 1;
  }

  /**
   * Create default single payment (full amount with specified method)
   */
  createDefaultPayment(amount: number, method: PaymentMethod = PaymentMethod.CASH): PaymentDetailDto {
    return {
      method,
      amount
    };
  }

  /**
   * Validate a payment detail object
   */
  private validatePaymentDetail(payment: PaymentDetailDto): void {
    if (!isValidPaymentMethod(payment.method)) {
      throw new Error(`Invalid payment method: ${payment.method}`);
    }

    if (payment.amount < 0) {
      throw new Error('Payment amount cannot be negative');
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

  private toPaymentResponseDto(payment: {
    id: string;
    sale_id: string;
    payment_method: PaymentMethod;
    amount: number;
    cash_tendered: number | null;
    change_given: number | null;
    card_last_four: string | null;
    card_type: string | null;
    transaction_reference: string | null;
    payment_description: string | null;
    created_at: string;
  }): PaymentResponseDto {
    return {
      id: payment.id,
      saleId: payment.sale_id,
      method: payment.payment_method,
      amount: payment.amount,
      cashTendered: payment.cash_tendered,
      changeGiven: payment.change_given,
      cardLastFour: payment.card_last_four,
      cardType: payment.card_type,
      transactionReference: payment.transaction_reference,
      paymentDescription: payment.payment_description,
      createdAt: payment.created_at
    };
  }
}
