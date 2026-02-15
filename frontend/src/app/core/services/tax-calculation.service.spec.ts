import { TestBed } from '@angular/core/testing';
import { TaxCalculationService } from './tax-calculation.service';
import { Product } from '../../models/product.model';
import { CartItem } from '../../models/sale.model';
import { ProductCondition, ProductStatus } from '../../enums';

describe('TaxCalculationService', () => {
  let service: TaxCalculationService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [TaxCalculationService]
    });
    service = TestBed.inject(TaxCalculationService);
  });

  describe('calculateTaxFromInclusivePrice', () => {
    it('should extract base price and tax from inclusive price with 10% tax', () => {
      // $100 with 10% tax -> base = 100/1.10 = $90.91, tax = $9.09
      const result = service.calculateTaxFromInclusivePrice(100, 10);

      expect(result.basePrice).toBeCloseTo(90.91, 2);
      expect(result.taxAmount).toBeCloseTo(9.09, 2);
    });

    it('should handle 0% tax rate', () => {
      const result = service.calculateTaxFromInclusivePrice(100, 0);

      expect(result.basePrice).toBe(100);
      expect(result.taxAmount).toBe(0);
    });

    it('should handle negative tax rate as 0', () => {
      const result = service.calculateTaxFromInclusivePrice(100, -5);

      expect(result.basePrice).toBe(100);
      expect(result.taxAmount).toBe(0);
    });

    it('should handle high tax rate (25%)', () => {
      // $100 with 25% tax -> base = 100/1.25 = $80, tax = $20
      const result = service.calculateTaxFromInclusivePrice(100, 25);

      expect(result.basePrice).toBe(80);
      expect(result.taxAmount).toBe(20);
    });

    it('should round to 2 decimal places', () => {
      // $99.99 with 7.5% tax
      const result = service.calculateTaxFromInclusivePrice(99.99, 7.5);

      expect(result.basePrice.toString()).toMatch(/^\d+\.\d{0,2}$/);
      expect(result.taxAmount.toString()).toMatch(/^\d+\.\d{0,2}$/);
    });
  });

  describe('calculateTaxFromExclusivePrice', () => {
    it('should calculate tax for exclusive price with 10% tax', () => {
      // $100 with 10% tax -> tax = $10, total = $110
      const result = service.calculateTaxFromExclusivePrice(100, 10);

      expect(result.taxAmount).toBe(10);
      expect(result.totalWithTax).toBe(110);
    });

    it('should handle 0% tax rate', () => {
      const result = service.calculateTaxFromExclusivePrice(100, 0);

      expect(result.taxAmount).toBe(0);
      expect(result.totalWithTax).toBe(100);
    });

    it('should handle negative tax rate as 0', () => {
      const result = service.calculateTaxFromExclusivePrice(100, -5);

      expect(result.taxAmount).toBe(0);
      expect(result.totalWithTax).toBe(100);
    });

    it('should calculate correctly with fractional tax rate', () => {
      // $100 with 7.5% tax -> tax = $7.50, total = $107.50
      const result = service.calculateTaxFromExclusivePrice(100, 7.5);

      expect(result.taxAmount).toBe(7.5);
      expect(result.totalWithTax).toBe(107.5);
    });
  });

  describe('calculateItemTax', () => {
    it('should calculate tax-inclusive item correctly', () => {
      // $100 tax-inclusive with 10% tax
      const result = service.calculateItemTax(100, 10, true, false, 1);

      expect(result.unitBasePrice).toBeCloseTo(90.91, 2);
      expect(result.unitTaxAmount).toBeCloseTo(9.09, 2);
      expect(result.basePrice).toBeCloseTo(90.91, 2);
      expect(result.taxAmount).toBeCloseTo(9.09, 2);
      expect(result.totalPrice).toBeCloseTo(100, 2);
      expect(result.taxRate).toBe(10);
      expect(result.isTaxExempt).toBe(false);
    });

    it('should calculate tax-exclusive item correctly', () => {
      // $100 tax-exclusive with 10% tax
      const result = service.calculateItemTax(100, 10, false, false, 1);

      expect(result.unitBasePrice).toBe(100);
      expect(result.unitTaxAmount).toBe(10);
      expect(result.basePrice).toBe(100);
      expect(result.taxAmount).toBe(10);
      expect(result.totalPrice).toBe(110);
      expect(result.taxRate).toBe(10);
      expect(result.isTaxExempt).toBe(false);
    });

    it('should handle tax-exempt items', () => {
      const result = service.calculateItemTax(100, 10, false, true, 1);

      expect(result.unitBasePrice).toBe(100);
      expect(result.unitTaxAmount).toBe(0);
      expect(result.basePrice).toBe(100);
      expect(result.taxAmount).toBe(0);
      expect(result.totalPrice).toBe(100);
      expect(result.taxRate).toBe(0);
      expect(result.isTaxExempt).toBe(true);
    });

    it('should calculate quantity correctly', () => {
      // $100 tax-exclusive with 10% tax, quantity 3
      const result = service.calculateItemTax(100, 10, false, false, 3);

      expect(result.unitBasePrice).toBe(100);
      expect(result.unitTaxAmount).toBe(10);
      expect(result.basePrice).toBe(300); // 100 * 3
      expect(result.taxAmount).toBe(30);  // 10 * 3
      expect(result.totalPrice).toBe(330); // 300 + 30
      expect(result.quantity).toBe(3);
    });

    it('should default quantity to 1', () => {
      const result = service.calculateItemTax(100, 10, false, false);

      expect(result.quantity).toBe(1);
    });
  });

  describe('calculateProductTax', () => {
    const mockProduct: Product = {
      id: 'test-product-1',
      brandId: 'brand-1',
      brandName: 'Apple',
      brandLogoUrl: null,
      model: 'iPhone 15 Pro',
      description: null,
      storageGb: 256,
      ramGb: 8,
      color: 'Black',
      condition: ProductCondition.NEW,
      batteryHealth: null,
      imei: '123456789012345',
      costPrice: 900,
      sellingPrice: 1200,
      profitMargin: 25,
      status: ProductStatus.AVAILABLE,
      purchaseDate: null,
      supplierId: null,
      supplierName: null,
      notes: null,
      primaryImageUrl: null,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: null,
      taxRate: 10,
      isTaxInclusive: false,
      isTaxExempt: false
    };

    it('should calculate tax from product properties', () => {
      const result = service.calculateProductTax(mockProduct);

      expect(result.unitBasePrice).toBe(1200);
      expect(result.unitTaxAmount).toBe(120);
      expect(result.totalPrice).toBe(1320);
    });

    it('should use override price when provided', () => {
      const result = service.calculateProductTax(mockProduct, 1, 1000);

      expect(result.unitBasePrice).toBe(1000);
      expect(result.unitTaxAmount).toBe(100);
      expect(result.totalPrice).toBe(1100);
    });

    it('should handle tax-inclusive product', () => {
      const taxInclusiveProduct = { ...mockProduct, isTaxInclusive: true };
      const result = service.calculateProductTax(taxInclusiveProduct);

      expect(result.unitBasePrice).toBeCloseTo(1090.91, 2);
      expect(result.unitTaxAmount).toBeCloseTo(109.09, 2);
      expect(result.totalPrice).toBe(1200);
    });

    it('should handle tax-exempt product', () => {
      const taxExemptProduct = { ...mockProduct, isTaxExempt: true };
      const result = service.calculateProductTax(taxExemptProduct);

      expect(result.unitBasePrice).toBe(1200);
      expect(result.unitTaxAmount).toBe(0);
      expect(result.totalPrice).toBe(1200);
      expect(result.isTaxExempt).toBe(true);
    });
  });

  describe('productToCartItem', () => {
    const mockProduct: Product = {
      id: 'test-product-1',
      brandId: 'brand-1',
      brandName: 'Samsung',
      brandLogoUrl: null,
      model: 'Galaxy S24',
      description: null,
      storageGb: 128,
      ramGb: 8,
      color: 'White',
      condition: ProductCondition.NEW,
      batteryHealth: null,
      imei: '987654321012345',
      costPrice: 700,
      sellingPrice: 900,
      profitMargin: 22.22,
      status: ProductStatus.AVAILABLE,
      purchaseDate: null,
      supplierId: null,
      supplierName: null,
      notes: null,
      primaryImageUrl: 'https://example.com/image.jpg',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: null,
      taxRate: 8,
      isTaxInclusive: false,
      isTaxExempt: false
    };

    it('should convert product to cart item with calculated tax', () => {
      const cartItem = service.productToCartItem(mockProduct);

      expect(cartItem.productId).toBe('test-product-1');
      expect(cartItem.brandName).toBe('Samsung');
      expect(cartItem.model).toBe('Galaxy S24');
      expect(cartItem.salePrice).toBe(900);
      expect(cartItem.taxRate).toBe(8);
      expect(cartItem.basePrice).toBe(900);
      expect(cartItem.taxAmount).toBe(72); // 900 * 0.08
      expect(cartItem.isTaxInclusive).toBe(false);
      expect(cartItem.isTaxExempt).toBe(false);
    });

    it('should use sale price override', () => {
      const cartItem = service.productToCartItem(mockProduct, 800);

      expect(cartItem.salePrice).toBe(800);
      expect(cartItem.basePrice).toBe(800);
      expect(cartItem.taxAmount).toBe(64); // 800 * 0.08
    });
  });

  describe('calculateCartTax', () => {
    it('should calculate summary for cart with mixed tax rates', () => {
      const cartItems: CartItem[] = [
        {
          productId: '1',
          brandName: 'Apple',
          model: 'iPhone 15',
          storageGb: 128,
          color: 'Black',
          condition: 'new',
          imei: null,
          costPrice: 900,
          sellingPrice: 1200,
          salePrice: 1200,
          taxRate: 10,
          primaryImageUrl: null,
          isTaxInclusive: false,
          isTaxExempt: false,
          basePrice: 1200,
          taxAmount: 120
        },
        {
          productId: '2',
          brandName: 'Samsung',
          model: 'Galaxy S24',
          storageGb: 128,
          color: 'White',
          condition: 'new',
          imei: null,
          costPrice: 700,
          sellingPrice: 900,
          salePrice: 900,
          taxRate: 8,
          primaryImageUrl: null,
          isTaxInclusive: false,
          isTaxExempt: false,
          basePrice: 900,
          taxAmount: 72
        }
      ];

      const result = service.calculateCartTax(cartItems);

      expect(result.subtotal).toBe(2100); // 1200 + 900
      expect(result.totalTax).toBe(192);  // 120 + 72
      expect(result.grandTotal).toBe(2292); // 2100 + 192
      expect(result.taxBreakdown.length).toBe(2);
    });

    it('should group tax breakdown by rate', () => {
      const cartItems: CartItem[] = [
        {
          productId: '1',
          brandName: 'Apple',
          model: 'iPhone 15',
          storageGb: 128,
          color: 'Black',
          condition: 'new',
          imei: null,
          costPrice: 900,
          sellingPrice: 1200,
          salePrice: 1200,
          taxRate: 10,
          primaryImageUrl: null,
          isTaxInclusive: false,
          isTaxExempt: false,
          basePrice: 1200,
          taxAmount: 120
        },
        {
          productId: '2',
          brandName: 'Apple',
          model: 'iPhone 14',
          storageGb: 128,
          color: 'White',
          condition: 'new',
          imei: null,
          costPrice: 700,
          sellingPrice: 1000,
          salePrice: 1000,
          taxRate: 10,
          primaryImageUrl: null,
          isTaxInclusive: false,
          isTaxExempt: false,
          basePrice: 1000,
          taxAmount: 100
        }
      ];

      const result = service.calculateCartTax(cartItems);

      expect(result.taxBreakdown.length).toBe(1);
      expect(result.taxBreakdown[0].taxRate).toBe(10);
      expect(result.taxBreakdown[0].taxableAmount).toBe(2200); // 1200 + 1000
      expect(result.taxBreakdown[0].taxAmount).toBe(220); // 120 + 100
      expect(result.taxBreakdown[0].itemCount).toBe(2);
    });

    it('should handle tax-exempt items in breakdown', () => {
      const cartItems: CartItem[] = [
        {
          productId: '1',
          brandName: 'Apple',
          model: 'iPhone 15',
          storageGb: 128,
          color: 'Black',
          condition: 'new',
          imei: null,
          costPrice: 900,
          sellingPrice: 1200,
          salePrice: 1200,
          taxRate: 0,
          primaryImageUrl: null,
          isTaxInclusive: false,
          isTaxExempt: true,
          basePrice: 1200,
          taxAmount: 0
        }
      ];

      const result = service.calculateCartTax(cartItems);

      expect(result.taxBreakdown.length).toBe(1);
      expect(result.taxBreakdown[0].taxRate).toBe(0);
      expect(result.taxBreakdown[0].taxAmount).toBe(0);
    });

    it('should sort tax breakdown by rate ascending', () => {
      const cartItems: CartItem[] = [
        {
          productId: '1',
          brandName: 'Apple',
          model: 'iPhone 15',
          storageGb: 128,
          color: 'Black',
          condition: 'new',
          imei: null,
          costPrice: 900,
          sellingPrice: 1200,
          salePrice: 1200,
          taxRate: 15,
          primaryImageUrl: null,
          isTaxInclusive: false,
          isTaxExempt: false,
          basePrice: 1200,
          taxAmount: 180
        },
        {
          productId: '2',
          brandName: 'Samsung',
          model: 'Galaxy',
          storageGb: 128,
          color: 'White',
          condition: 'new',
          imei: null,
          costPrice: 700,
          sellingPrice: 900,
          salePrice: 900,
          taxRate: 5,
          primaryImageUrl: null,
          isTaxInclusive: false,
          isTaxExempt: false,
          basePrice: 900,
          taxAmount: 45
        }
      ];

      const result = service.calculateCartTax(cartItems);

      expect(result.taxBreakdown[0].taxRate).toBe(5);
      expect(result.taxBreakdown[1].taxRate).toBe(15);
    });
  });

  describe('formatTaxRate', () => {
    it('should format regular tax rate', () => {
      expect(service.formatTaxRate(10, false)).toBe('10%');
      expect(service.formatTaxRate(7.5, false)).toBe('7.5%');
    });

    it('should format 0% tax rate', () => {
      expect(service.formatTaxRate(0, false)).toBe('0%');
    });

    it('should format tax-exempt items', () => {
      expect(service.formatTaxRate(10, true)).toBe('Tax Exempt');
      expect(service.formatTaxRate(0, true)).toBe('Tax Exempt');
    });
  });

  describe('formatCurrency', () => {
    it('should format currency with default symbol', () => {
      expect(service.formatCurrency(100)).toBe('$100.00');
      expect(service.formatCurrency(99.99)).toBe('$99.99');
    });

    it('should format currency with custom symbol', () => {
      expect(service.formatCurrency(100, '€')).toBe('€100.00');
      expect(service.formatCurrency(100, '£')).toBe('£100.00');
    });
  });

  describe('generateTaxBreakdownText', () => {
    it('should generate text for tax breakdown', () => {
      const taxBreakdown = [
        { taxRate: 0, taxableAmount: 100, taxAmount: 0, itemCount: 1 },
        { taxRate: 10, taxableAmount: 200, taxAmount: 20, itemCount: 2 }
      ];

      const result = service.generateTaxBreakdownText(taxBreakdown);

      expect(result.length).toBe(2);
      expect(result[0]).toContain('Tax Exempt');
      expect(result[0]).toContain('1 item');
      expect(result[1]).toContain('10%');
      expect(result[1]).toContain('$20.00');
    });

    it('should pluralize items correctly', () => {
      const taxBreakdown = [
        { taxRate: 0, taxableAmount: 300, taxAmount: 0, itemCount: 3 }
      ];

      const result = service.generateTaxBreakdownText(taxBreakdown);

      expect(result[0]).toContain('3 items');
    });
  });

  describe('hasTaxConfigured', () => {
    const baseProduct: Product = {
      id: 'test-product',
      brandId: 'brand-1',
      brandName: 'Apple',
      brandLogoUrl: null,
      model: 'iPhone',
      description: null,
      storageGb: 128,
      ramGb: 8,
      color: 'Black',
      condition: ProductCondition.NEW,
      batteryHealth: null,
      imei: null,
      costPrice: 900,
      sellingPrice: 1200,
      profitMargin: 25,
      status: ProductStatus.AVAILABLE,
      purchaseDate: null,
      supplierId: null,
      supplierName: null,
      notes: null,
      primaryImageUrl: null,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: null,
      taxRate: 0,
      isTaxInclusive: false,
      isTaxExempt: false
    };

    it('should return true when tax rate is greater than 0', () => {
      const product = { ...baseProduct, taxRate: 10 };
      expect(service.hasTaxConfigured(product)).toBe(true);
    });

    it('should return true when item is tax exempt', () => {
      const product = { ...baseProduct, isTaxExempt: true };
      expect(service.hasTaxConfigured(product)).toBe(true);
    });

    it('should return false when no tax configured', () => {
      expect(service.hasTaxConfigured(baseProduct)).toBe(false);
    });
  });

  describe('getTaxStatusLabel', () => {
    const baseProduct: Product = {
      id: 'test-product',
      brandId: 'brand-1',
      brandName: 'Apple',
      brandLogoUrl: null,
      model: 'iPhone',
      description: null,
      storageGb: 128,
      ramGb: 8,
      color: 'Black',
      condition: ProductCondition.NEW,
      batteryHealth: null,
      imei: null,
      costPrice: 900,
      sellingPrice: 1200,
      profitMargin: 25,
      status: ProductStatus.AVAILABLE,
      purchaseDate: null,
      supplierId: null,
      supplierName: null,
      notes: null,
      primaryImageUrl: null,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: null,
      taxRate: 0,
      isTaxInclusive: false,
      isTaxExempt: false
    };

    it('should return "Tax Exempt" for exempt items', () => {
      const product = { ...baseProduct, isTaxExempt: true };
      expect(service.getTaxStatusLabel(product)).toBe('Tax Exempt');
    });

    it('should return "No Tax" for 0% tax rate', () => {
      expect(service.getTaxStatusLabel(baseProduct)).toBe('No Tax');
    });

    it('should return tax rate with percentage', () => {
      const product = { ...baseProduct, taxRate: 10 };
      expect(service.getTaxStatusLabel(product)).toBe('10% Tax');
    });

    it('should indicate inclusive pricing', () => {
      const product = { ...baseProduct, taxRate: 10, isTaxInclusive: true };
      expect(service.getTaxStatusLabel(product)).toBe('10% Tax (incl.)');
    });
  });

  describe('calculateCartSummary', () => {
    it('should calculate cart summary including profit', () => {
      const cartItems: CartItem[] = [
        {
          productId: '1',
          brandName: 'Apple',
          model: 'iPhone 15',
          storageGb: 128,
          color: 'Black',
          condition: 'new',
          imei: null,
          costPrice: 900,
          sellingPrice: 1200,
          salePrice: 1200,
          taxRate: 10,
          primaryImageUrl: null,
          isTaxInclusive: false,
          isTaxExempt: false,
          basePrice: 1200,
          taxAmount: 120
        }
      ];

      const result = service.calculateCartSummary(cartItems);

      expect(result.subtotal).toBe(1200);
      expect(result.taxAmount).toBe(120);
      expect(result.grandTotal).toBe(1320);
      expect(result.totalCost).toBe(900);
      expect(result.totalProfit).toBe(300); // 1200 - 900
      expect(result.itemCount).toBe(1);
      expect(result.discountAmount).toBe(0);
      expect(result.finalTotal).toBe(1320);
    });
  });
});
