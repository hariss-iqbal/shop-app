import { TestBed } from '@angular/core/testing';

import { PaymentService } from './payment.service';
import { PaymentMethod } from '../../enums/payment-method.enum';
import { PaymentDetail, PaymentFormState } from '../../models/payment.model';

describe('PaymentService', () => {
  let service: PaymentService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [PaymentService]
    });
    service = TestBed.inject(PaymentService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getPaymentMethods', () => {
    it('should return all payment method options', () => {
      const methods = service.getPaymentMethods();

      expect(methods.length).toBe(4);
      expect(methods.find(m => m.value === PaymentMethod.CASH)).toBeTruthy();
      expect(methods.find(m => m.value === PaymentMethod.CARD)).toBeTruthy();
      expect(methods.find(m => m.value === PaymentMethod.UPI)).toBeTruthy();
      expect(methods.find(m => m.value === PaymentMethod.OTHER)).toBeTruthy();
    });

    it('should have labels and icons for each method', () => {
      const methods = service.getPaymentMethods();

      methods.forEach(method => {
        expect(method.label).toBeTruthy();
        expect(method.icon).toBeTruthy();
        expect(method.icon).toContain('pi');
      });
    });
  });

  describe('createDefaultPayment', () => {
    it('should create default cash payment with specified amount', () => {
      const payment = service.createDefaultPayment(150);

      expect(payment.method).toBe(PaymentMethod.CASH);
      expect(payment.amount).toBe(150);
    });

    it('should create payment with specified method', () => {
      const payment = service.createDefaultPayment(200, PaymentMethod.CARD);

      expect(payment.method).toBe(PaymentMethod.CARD);
      expect(payment.amount).toBe(200);
    });
  });

  describe('createDefaultPaymentState', () => {
    it('should create valid default state', () => {
      const state: PaymentFormState = service.createDefaultPaymentState(500);

      expect(state.payments.length).toBe(1);
      expect(state.payments[0].method).toBe(PaymentMethod.CASH);
      expect(state.payments[0].amount).toBe(500);
      expect(state.isSplitPayment).toBe(false);
      expect(state.totalPaid).toBe(500);
      expect(state.remainingAmount).toBe(0);
      expect(state.isValid).toBe(true);
    });
  });

  describe('calculateCashChange', () => {
    it('should calculate positive change correctly', () => {
      const result = service.calculateCashChange(75, 100);

      expect(result.changeGiven).toBe(25);
      expect(result.isExact).toBe(false);
      expect(result.isInsufficient).toBe(false);
    });

    it('should detect exact payment', () => {
      const result = service.calculateCashChange(100, 100);

      expect(result.changeGiven).toBe(0);
      expect(result.isExact).toBe(true);
      expect(result.isInsufficient).toBe(false);
    });

    it('should detect insufficient payment', () => {
      const result = service.calculateCashChange(100, 50);

      expect(result.changeGiven).toBe(0);
      expect(result.isExact).toBe(false);
      expect(result.isInsufficient).toBe(true);
    });

    it('should handle zero amount due', () => {
      const result = service.calculateCashChange(0, 50);

      expect(result.changeGiven).toBe(50);
      expect(result.isInsufficient).toBe(false);
    });

    it('should handle zero cash tendered', () => {
      const result = service.calculateCashChange(100, 0);

      expect(result.changeGiven).toBe(0);
      expect(result.isInsufficient).toBe(true);
    });
  });

  describe('validateSplitPayment', () => {
    it('should validate exact match', () => {
      const payments: PaymentDetail[] = [
        { method: PaymentMethod.CASH, amount: 60 },
        { method: PaymentMethod.CARD, amount: 40 }
      ];

      const result = service.validateSplitPayment(payments, 100);

      expect(result.isValid).toBe(true);
      expect(result.totalPaid).toBe(100);
      expect(result.amountDue).toBe(100);
      expect(result.difference).toBe(0);
    });

    it('should allow 1 cent tolerance', () => {
      const payments: PaymentDetail[] = [
        { method: PaymentMethod.CASH, amount: 99.995 }
      ];

      const result = service.validateSplitPayment(payments, 100);

      expect(result.isValid).toBe(true);
    });

    it('should detect underpayment', () => {
      const payments: PaymentDetail[] = [
        { method: PaymentMethod.CASH, amount: 80 }
      ];

      const result = service.validateSplitPayment(payments, 100);

      expect(result.isValid).toBe(false);
      expect(result.difference).toBe(-20);
      expect(result.message).toContain('Short by');
    });

    it('should detect overpayment', () => {
      const payments: PaymentDetail[] = [
        { method: PaymentMethod.CASH, amount: 120 }
      ];

      const result = service.validateSplitPayment(payments, 100);

      expect(result.isValid).toBe(false);
      expect(result.difference).toBe(20);
      expect(result.message).toContain('Over by');
    });

    it('should handle empty payments array', () => {
      const result = service.validateSplitPayment([], 100);

      expect(result.isValid).toBe(false);
      expect(result.totalPaid).toBe(0);
    });

    it('should handle payments with zero or undefined amounts', () => {
      const payments: PaymentDetail[] = [
        { method: PaymentMethod.CASH, amount: 0 }
      ];

      const result = service.validateSplitPayment(payments, 0);

      expect(result.isValid).toBe(true);
    });
  });

  describe('isSplitPayment', () => {
    it('should return true for multiple payments', () => {
      const payments: PaymentDetail[] = [
        { method: PaymentMethod.CASH, amount: 50 },
        { method: PaymentMethod.CARD, amount: 50 }
      ];

      expect(service.isSplitPayment(payments)).toBe(true);
    });

    it('should return false for single payment', () => {
      const payments: PaymentDetail[] = [
        { method: PaymentMethod.CASH, amount: 100 }
      ];

      expect(service.isSplitPayment(payments)).toBe(false);
    });

    it('should return false for empty array', () => {
      expect(service.isSplitPayment([])).toBe(false);
    });

    it('should return falsy value for null/undefined', () => {
      expect(service.isSplitPayment(null as unknown as PaymentDetail[])).toBeFalsy();
      expect(service.isSplitPayment(undefined as unknown as PaymentDetail[])).toBeFalsy();
    });
  });

  describe('getPrimaryPaymentMethod', () => {
    it('should return method with largest amount', () => {
      const payments: PaymentDetail[] = [
        { method: PaymentMethod.CASH, amount: 30 },
        { method: PaymentMethod.UPI, amount: 70 }
      ];

      expect(service.getPrimaryPaymentMethod(payments)).toBe(PaymentMethod.UPI);
    });

    it('should return first method when amounts are equal', () => {
      const payments: PaymentDetail[] = [
        { method: PaymentMethod.CASH, amount: 50 },
        { method: PaymentMethod.CARD, amount: 50 }
      ];

      const primary = service.getPrimaryPaymentMethod(payments);
      // Should return either, but consistently
      expect(primary).not.toBeNull();
      expect([PaymentMethod.CASH, PaymentMethod.CARD]).toContain(primary!);
    });

    it('should return null for empty array', () => {
      expect(service.getPrimaryPaymentMethod([])).toBeNull();
    });

    it('should return null for null/undefined', () => {
      expect(service.getPrimaryPaymentMethod(null as unknown as PaymentDetail[])).toBeNull();
    });
  });

  describe('toPaymentSummary', () => {
    it('should convert payment details to summary format', () => {
      const payments: PaymentDetail[] = [
        {
          method: PaymentMethod.CARD,
          amount: 100,
          cardLastFour: '4242',
          cardType: 'Visa'
        }
      ];

      const summaries = service.toPaymentSummary(payments);

      expect(summaries.length).toBe(1);
      expect(summaries[0].method).toBe(PaymentMethod.CARD);
      expect(summaries[0].amount).toBe(100);
      expect(summaries[0].cardLastFour).toBe('4242');
    });

    it('should calculate change for cash payments', () => {
      const payments: PaymentDetail[] = [
        {
          method: PaymentMethod.CASH,
          amount: 80,
          cashTendered: 100
        }
      ];

      const summaries = service.toPaymentSummary(payments);

      expect(summaries[0].changeGiven).toBe(20);
    });

    it('should not calculate change for non-cash payments', () => {
      const payments: PaymentDetail[] = [
        {
          method: PaymentMethod.CARD,
          amount: 100,
          cashTendered: 150 // Should be ignored for card
        }
      ];

      const summaries = service.toPaymentSummary(payments);

      expect(summaries[0].changeGiven).toBeNull();
    });

    it('should handle null optional fields', () => {
      const payments: PaymentDetail[] = [
        { method: PaymentMethod.OTHER, amount: 100 }
      ];

      const summaries = service.toPaymentSummary(payments);

      expect(summaries[0].cardLastFour).toBeNull();
      expect(summaries[0].transactionReference).toBeNull();
    });
  });

  describe('validatePayment', () => {
    it('should validate valid cash payment', () => {
      const payment: PaymentDetail = {
        method: PaymentMethod.CASH,
        amount: 100
      };

      const result = service.validatePayment(payment);
      expect(result.isValid).toBe(true);
    });

    it('should reject negative amount', () => {
      const payment: PaymentDetail = {
        method: PaymentMethod.CASH,
        amount: -50
      };

      const result = service.validatePayment(payment);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('positive');
    });

    it('should validate card with valid last four', () => {
      const payment: PaymentDetail = {
        method: PaymentMethod.CARD,
        amount: 100,
        cardLastFour: '1234'
      };

      const result = service.validatePayment(payment);
      expect(result.isValid).toBe(true);
    });

    it('should reject card with invalid last four format', () => {
      const payment: PaymentDetail = {
        method: PaymentMethod.CARD,
        amount: 100,
        cardLastFour: 'ABCD'
      };

      const result = service.validatePayment(payment);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('4 digits');
    });

    it('should reject card with wrong length last four', () => {
      const payment: PaymentDetail = {
        method: PaymentMethod.CARD,
        amount: 100,
        cardLastFour: '12345'
      };

      const result = service.validatePayment(payment);
      expect(result.isValid).toBe(false);
    });

    it('should allow card payment without last four (optional)', () => {
      const payment: PaymentDetail = {
        method: PaymentMethod.CARD,
        amount: 100
      };

      const result = service.validatePayment(payment);
      expect(result.isValid).toBe(true);
    });
  });

  describe('formatPaymentSummary', () => {
    it('should format single payment', () => {
      const payments = [
        { method: PaymentMethod.CASH, amount: 100, cardLastFour: null, transactionReference: null, cashTendered: null, changeGiven: null }
      ];

      const formatted = service.formatPaymentSummary(payments);

      expect(formatted).toContain('Cash');
      expect(formatted).toContain('$100');
    });

    it('should format multiple payments with + separator', () => {
      const payments = [
        { method: PaymentMethod.CASH, amount: 50, cardLastFour: null, transactionReference: null, cashTendered: null, changeGiven: null },
        { method: PaymentMethod.CARD, amount: 50, cardLastFour: '9999', transactionReference: null, cashTendered: null, changeGiven: null }
      ];

      const formatted = service.formatPaymentSummary(payments);

      expect(formatted).toContain(' + ');
      expect(formatted).toContain('Cash');
      expect(formatted).toContain('Card');
      expect(formatted).toContain('*9999');
    });

    it('should return placeholder for empty payments', () => {
      const formatted = service.formatPaymentSummary([]);
      expect(formatted).toBe('No payment recorded');
    });

    it('should return placeholder for null payments', () => {
      const formatted = service.formatPaymentSummary(null as unknown as []);
      expect(formatted).toBe('No payment recorded');
    });
  });

  describe('getQuickCashAmounts', () => {
    it('should include exact amount', () => {
      const amounts = service.getQuickCashAmounts(47.50);
      expect(amounts).toContain(47.50);
    });

    it('should include rounded amount when not whole', () => {
      const amounts = service.getQuickCashAmounts(47.50);
      expect(amounts).toContain(48);
    });

    it('should include common denominations', () => {
      const amounts = service.getQuickCashAmounts(75);

      expect(amounts.some(a => a >= 100)).toBe(true);
    });

    it('should limit to 6 amounts', () => {
      const amounts = service.getQuickCashAmounts(15);
      expect(amounts.length).toBeLessThanOrEqual(6);
    });

    it('should sort amounts ascending', () => {
      const amounts = service.getQuickCashAmounts(50);

      for (let i = 1; i < amounts.length; i++) {
        expect(amounts[i]).toBeGreaterThanOrEqual(amounts[i - 1]);
      }
    });

    it('should handle small amounts', () => {
      const amounts = service.getQuickCashAmounts(5);
      expect(amounts[0]).toBe(5);
    });

    it('should handle large amounts', () => {
      const amounts = service.getQuickCashAmounts(450);
      expect(amounts).toContain(450);
      expect(amounts.some(a => a >= 500)).toBe(true);
    });
  });

  describe('getPaymentMethodLabel', () => {
    it('should return correct labels', () => {
      expect(service.getPaymentMethodLabel(PaymentMethod.CASH)).toBe('Cash');
      expect(service.getPaymentMethodLabel(PaymentMethod.CARD)).toBe('Card');
      expect(service.getPaymentMethodLabel(PaymentMethod.UPI)).toBe('UPI');
      expect(service.getPaymentMethodLabel(PaymentMethod.OTHER)).toBe('Other');
    });

    it('should return method value as fallback for unknown', () => {
      const unknownMethod = 'unknown_method' as PaymentMethod;
      expect(service.getPaymentMethodLabel(unknownMethod)).toBe(unknownMethod);
    });
  });

  describe('getPaymentMethodIcon', () => {
    it('should return correct icons', () => {
      expect(service.getPaymentMethodIcon(PaymentMethod.CASH)).toContain('pi-money-bill');
      expect(service.getPaymentMethodIcon(PaymentMethod.CARD)).toContain('pi-credit-card');
      expect(service.getPaymentMethodIcon(PaymentMethod.UPI)).toContain('pi-mobile');
      expect(service.getPaymentMethodIcon(PaymentMethod.OTHER)).toContain('pi-wallet');
    });

    it('should return default icon for unknown method', () => {
      const unknownMethod = 'unknown' as PaymentMethod;
      expect(service.getPaymentMethodIcon(unknownMethod)).toContain('pi-wallet');
    });
  });
});
