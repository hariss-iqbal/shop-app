import { TestBed } from '@angular/core/testing';

import { PaymentService } from '../../../core/services/payment.service';
import { PaymentMethod } from '../../../enums/payment-method.enum';
import { PaymentDetail } from '../../../models/payment.model';

/**
 * Unit tests for Payment Method Selector functionality
 * Feature: F-018 Payment Method Integration
 *
 * These tests verify the payment logic through the PaymentService,
 * which handles all core payment calculation and validation logic.
 */
describe('PaymentMethodSelectorComponent Logic', () => {
  let service: PaymentService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [PaymentService]
    });
    service = TestBed.inject(PaymentService);
  });

  describe('payment validation', () => {
    it('should validate payment equals total due', () => {
      const payments: PaymentDetail[] = [{ method: PaymentMethod.CASH, amount: 100 }];
      const validation = service.validateSplitPayment(payments, 100);

      expect(validation.isValid).toBe(true);
      expect(validation.difference).toBe(0);
    });

    it('should allow tolerance for rounding', () => {
      const payments: PaymentDetail[] = [{ method: PaymentMethod.CASH, amount: 99.995 }];
      const validation = service.validateSplitPayment(payments, 100);

      expect(validation.isValid).toBe(true);
    });

    it('should detect underpayment', () => {
      const payments: PaymentDetail[] = [{ method: PaymentMethod.CASH, amount: 80 }];
      const validation = service.validateSplitPayment(payments, 100);

      expect(validation.isValid).toBe(false);
      expect(validation.message).toContain('Short by');
    });

    it('should detect overpayment', () => {
      const payments: PaymentDetail[] = [{ method: PaymentMethod.CASH, amount: 120 }];
      const validation = service.validateSplitPayment(payments, 100);

      expect(validation.isValid).toBe(false);
      expect(validation.message).toContain('Over by');
    });
  });

  describe('cash payment handling', () => {
    it('should calculate positive change correctly', () => {
      const result = service.calculateCashChange(100, 150);

      expect(result.changeGiven).toBe(50);
      expect(result.isExact).toBe(false);
      expect(result.isInsufficient).toBe(false);
    });

    it('should detect exact cash amount', () => {
      const result = service.calculateCashChange(100, 100);

      expect(result.changeGiven).toBe(0);
      expect(result.isExact).toBe(true);
    });

    it('should detect insufficient cash', () => {
      const result = service.calculateCashChange(100, 80);

      expect(result.changeGiven).toBe(0);
      expect(result.isInsufficient).toBe(true);
    });

    it('should generate quick cash amounts', () => {
      const amounts = service.getQuickCashAmounts(87.50);

      expect(amounts).toContain(87.50);
      expect(amounts).toContain(88); // Rounded
      expect(amounts.some(a => a >= 100)).toBe(true);
      expect(amounts.length).toBeLessThanOrEqual(6);
    });
  });

  describe('card payment validation', () => {
    it('should validate card with valid last four', () => {
      const payment: PaymentDetail = {
        method: PaymentMethod.CARD,
        amount: 100,
        cardLastFour: '1234'
      };
      expect(service.validatePayment(payment).isValid).toBe(true);
    });

    it('should reject card with invalid last four format', () => {
      const payment: PaymentDetail = {
        method: PaymentMethod.CARD,
        amount: 100,
        cardLastFour: '12AB'
      };
      const result = service.validatePayment(payment);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('digits');
    });

    it('should allow card without last four (optional)', () => {
      const payment: PaymentDetail = {
        method: PaymentMethod.CARD,
        amount: 100
      };
      expect(service.validatePayment(payment).isValid).toBe(true);
    });
  });

  describe('split payment', () => {
    it('should detect split payment', () => {
      const payments: PaymentDetail[] = [
        { method: PaymentMethod.CASH, amount: 50 },
        { method: PaymentMethod.CARD, amount: 50 }
      ];
      expect(service.isSplitPayment(payments)).toBe(true);
    });

    it('should not detect single payment as split', () => {
      const payments: PaymentDetail[] = [{ method: PaymentMethod.CASH, amount: 100 }];
      expect(service.isSplitPayment(payments)).toBe(false);
    });

    it('should validate split payment totals', () => {
      const payments: PaymentDetail[] = [
        { method: PaymentMethod.CASH, amount: 60 },
        { method: PaymentMethod.CARD, amount: 40 }
      ];
      const validation = service.validateSplitPayment(payments, 100);

      expect(validation.isValid).toBe(true);
      expect(validation.totalPaid).toBe(100);
    });

    it('should identify primary payment method', () => {
      const payments: PaymentDetail[] = [
        { method: PaymentMethod.CASH, amount: 30 },
        { method: PaymentMethod.CARD, amount: 70 }
      ];

      expect(service.getPrimaryPaymentMethod(payments)).toBe(PaymentMethod.CARD);
    });
  });

  describe('edge cases', () => {
    it('should handle zero amount', () => {
      const payment: PaymentDetail = { method: PaymentMethod.CASH, amount: 0 };
      expect(service.validatePayment(payment).isValid).toBe(true);
    });

    it('should reject negative amount', () => {
      const payment: PaymentDetail = { method: PaymentMethod.CASH, amount: -10 };
      expect(service.validatePayment(payment).isValid).toBe(false);
    });

    it('should handle empty payments', () => {
      const validation = service.validateSplitPayment([], 100);
      expect(validation.isValid).toBe(false);
      expect(validation.totalPaid).toBe(0);
    });

    it('should return null for empty array primary method', () => {
      expect(service.getPrimaryPaymentMethod([])).toBeNull();
    });
  });

  describe('payment summary', () => {
    it('should format single payment', () => {
      const payments = service.toPaymentSummary([
        { method: PaymentMethod.CASH, amount: 100 }
      ]);
      const formatted = service.formatPaymentSummary(payments);
      expect(formatted).toContain('Cash');
      expect(formatted).toContain('$100');
    });

    it('should format split payment', () => {
      const payments = service.toPaymentSummary([
        { method: PaymentMethod.CASH, amount: 50 },
        { method: PaymentMethod.CARD, amount: 50, cardLastFour: '4567' }
      ]);
      const formatted = service.formatPaymentSummary(payments);
      expect(formatted).toContain('+');
      expect(formatted).toContain('*4567');
    });

    it('should calculate cash change in summary', () => {
      const payments = service.toPaymentSummary([
        { method: PaymentMethod.CASH, amount: 80, cashTendered: 100 }
      ]);
      expect(payments[0].changeGiven).toBe(20);
    });
  });

  describe('default payment creation', () => {
    it('should create default cash payment', () => {
      const payment = service.createDefaultPayment(150);

      expect(payment.method).toBe(PaymentMethod.CASH);
      expect(payment.amount).toBe(150);
    });

    it('should create payment with specified method', () => {
      const payment = service.createDefaultPayment(200, PaymentMethod.CARD);

      expect(payment.method).toBe(PaymentMethod.CARD);
      expect(payment.amount).toBe(200);
    });

    it('should create valid default payment state', () => {
      const state = service.createDefaultPaymentState(500);

      expect(state.payments.length).toBe(1);
      expect(state.isValid).toBe(true);
      expect(state.totalPaid).toBe(500);
      expect(state.remainingAmount).toBe(0);
    });
  });
});
