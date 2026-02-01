import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { DiscountPanelComponent } from './discount-panel.component';
import { CouponService } from '../../../core/services/coupon.service';
import { DiscountType, CouponStatus } from '../../../enums';
import { CouponValidationResponse, DiscountConfig } from '../../../models/coupon.model';

describe('DiscountPanelComponent', () => {
  let component: DiscountPanelComponent;
  let fixture: ComponentFixture<DiscountPanelComponent>;
  let couponServiceSpy: jasmine.SpyObj<CouponService>;

  const mockConfig: DiscountConfig = {
    id: 'config-1',
    managerApprovalThreshold: 10,
    maxDiscountPercentage: 50,
    maxDiscountAmount: 10000,
    discountsEnabled: true,
    couponsEnabled: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: null
  };

  const mockValidCouponResponse: CouponValidationResponse = {
    isValid: true,
    coupon: {
      id: 'coupon-1',
      code: 'SAVE20',
      description: '20% off your purchase',
      discountType: DiscountType.PERCENTAGE,
      discountValue: 20,
      minPurchaseAmount: null,
      maxDiscountAmount: null,
      maxRedemptions: 100,
      currentRedemptions: 50,
      remainingRedemptions: 50,
      validFrom: '2024-01-01',
      validUntil: '2024-12-31',
      status: CouponStatus.ACTIVE,
      requiresManagerApproval: false,
      isValid: true,
      daysUntilExpiry: 365,
      createdBy: null,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: null
    },
    discountAmount: 20,
    finalPrice: 80,
    requiresManagerApproval: false
  };

  beforeEach(async () => {
    couponServiceSpy = jasmine.createSpyObj('CouponService', ['getConfig', 'validateCoupon']);
    couponServiceSpy.getConfig.and.returnValue(Promise.resolve(mockConfig));

    await TestBed.configureTestingModule({
      imports: [
        NoopAnimationsModule,
        DiscountPanelComponent
      ],
      providers: [
        { provide: CouponService, useValue: couponServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(DiscountPanelComponent);
    component = fixture.componentInstance;
    component.originalPrice = 100;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load discount config on init', fakeAsync(() => {
    tick();
    expect(couponServiceSpy.getConfig).toHaveBeenCalled();
    expect(component.config()).toEqual(mockConfig);
  }));

  describe('Panel expansion', () => {
    it('should be collapsed by default', () => {
      expect(component.expanded()).toBeFalse();
    });

    it('should expand when expand() is called', () => {
      component.expand();
      expect(component.expanded()).toBeTrue();
    });

    it('should collapse when collapse() is called', () => {
      component.expand();
      component.collapse();
      expect(component.expanded()).toBeFalse();
    });

    it('should reset state when expanding', () => {
      component.couponCode = 'TEST';
      component.manualDiscountValue = 50;
      component.expand();
      expect(component.couponCode).toBe('');
      expect(component.manualDiscountValue).toBe(0);
    });
  });

  describe('Mode switching', () => {
    it('should default to coupon mode', () => {
      expect(component.mode()).toBe('coupon');
    });

    it('should switch to manual mode', () => {
      component.setMode('manual');
      expect(component.mode()).toBe('manual');
    });

    it('should reset state when switching modes', () => {
      component.couponCode = 'TEST';
      component.setMode('manual');
      expect(component.couponCode).toBe('');
    });
  });

  describe('Coupon validation', () => {
    it('should not validate empty coupon code', async () => {
      component.couponCode = '';
      await component.validateCoupon();
      expect(couponServiceSpy.validateCoupon).not.toHaveBeenCalled();
    });

    it('should validate coupon code and show result', fakeAsync(() => {
      couponServiceSpy.validateCoupon.and.returnValue(Promise.resolve(mockValidCouponResponse));

      component.couponCode = 'SAVE20';
      component.validateCoupon();
      tick();

      expect(couponServiceSpy.validateCoupon).toHaveBeenCalledWith({
        code: 'SAVE20',
        purchaseAmount: 100
      });
      expect(component.validationResult()).toEqual(mockValidCouponResponse);
      expect(component.validating()).toBeFalse();
    }));

    it('should handle invalid coupon', fakeAsync(() => {
      const invalidResponse: CouponValidationResponse = {
        isValid: false,
        error: 'Invalid coupon code',
        requiresManagerApproval: false
      };
      couponServiceSpy.validateCoupon.and.returnValue(Promise.resolve(invalidResponse));

      component.couponCode = 'INVALID';
      component.validateCoupon();
      tick();

      expect(component.validationResult()?.isValid).toBeFalse();
      expect(component.validationResult()?.error).toBe('Invalid coupon code');
    }));

    it('should handle validation error', fakeAsync(() => {
      couponServiceSpy.validateCoupon.and.returnValue(Promise.reject(new Error('Network error')));

      component.couponCode = 'TEST';
      component.validateCoupon();
      tick();

      expect(component.validationResult()?.isValid).toBeFalse();
      expect(component.validationResult()?.error).toBe('Failed to validate coupon');
    }));
  });

  describe('Manual discount calculations', () => {
    it('should calculate percentage discount correctly', () => {
      component.manualDiscountType = DiscountType.PERCENTAGE;
      component.manualDiscountValue = 20;

      expect(component.calculatedDiscountAmount()).toBe(20);
      expect(component.calculatedFinalPrice()).toBe(80);
      expect(component.calculatedDiscountPercentage()).toBe(20);
    });

    it('should calculate fixed amount discount correctly', () => {
      component.manualDiscountType = DiscountType.FIXED_AMOUNT;
      component.manualDiscountValue = 25;

      expect(component.calculatedDiscountAmount()).toBe(25);
      expect(component.calculatedFinalPrice()).toBe(75);
      expect(component.calculatedDiscountPercentage()).toBe(25);
    });

    it('should not exceed original price for fixed amount', () => {
      component.manualDiscountType = DiscountType.FIXED_AMOUNT;
      component.manualDiscountValue = 150;

      expect(component.calculatedDiscountAmount()).toBe(100);
      expect(component.calculatedFinalPrice()).toBe(0);
    });
  });

  describe('Manager approval threshold', () => {
    it('should detect when discount exceeds threshold', () => {
      component.manualDiscountType = DiscountType.PERCENTAGE;
      component.manualDiscountValue = 15; // Exceeds 10% threshold

      expect(component.calculatedDiscountPercentage()).toBe(15);
      expect(component.calculatedDiscountPercentage()).toBeGreaterThan(
        component.config()?.managerApprovalThreshold || 10
      );
    });

    it('should not require approval for discounts below threshold', () => {
      component.manualDiscountType = DiscountType.PERCENTAGE;
      component.manualDiscountValue = 5; // Below 10% threshold

      expect(component.calculatedDiscountPercentage()).toBeLessThanOrEqual(
        component.config()?.managerApprovalThreshold || 10
      );
    });
  });

  describe('Applying discounts', () => {
    it('should emit discount applied event for coupon', () => {
      spyOn(component.discountApplied, 'emit');
      component.validationResult.set(mockValidCouponResponse);

      component.applyCouponDiscount();

      expect(component.discountApplied.emit).toHaveBeenCalledWith(jasmine.objectContaining({
        discountType: DiscountType.PERCENTAGE,
        discountValue: 20,
        discountAmount: 20,
        originalPrice: 100,
        finalPrice: 80,
        couponId: 'coupon-1',
        couponCode: 'SAVE20',
        requiresManagerApproval: false
      }));
      expect(component.appliedDiscount()).toBeTruthy();
    });

    it('should emit discount applied event for manual discount', () => {
      spyOn(component.discountApplied, 'emit');
      component.manualDiscountType = DiscountType.PERCENTAGE;
      component.manualDiscountValue = 10;

      component.applyManualDiscount();

      expect(component.discountApplied.emit).toHaveBeenCalledWith(jasmine.objectContaining({
        discountType: DiscountType.PERCENTAGE,
        discountValue: 10,
        discountAmount: 10,
        originalPrice: 100,
        finalPrice: 90,
        couponId: null,
        couponCode: null,
        requiresManagerApproval: false
      }));
    });

    it('should emit discount removed event', () => {
      spyOn(component.discountRemoved, 'emit');
      component.appliedDiscount.set({
        discountType: DiscountType.PERCENTAGE,
        discountValue: 10,
        discountAmount: 10,
        originalPrice: 100,
        finalPrice: 90,
        couponId: null,
        couponCode: null,
        requiresManagerApproval: false
      });

      component.removeDiscount();

      expect(component.discountRemoved.emit).toHaveBeenCalled();
      expect(component.appliedDiscount()).toBeNull();
    });
  });

  describe('Manager approval flow', () => {
    it('should open approval dialog', () => {
      component.openApprovalDialog();
      expect(component.approvalDialogVisible).toBeTrue();
      expect(component.approvalManagerId).toBe('');
      expect(component.approvalReason).toBe('');
    });

    it('should apply discount with manager approval for manual discount', () => {
      spyOn(component.discountApplied, 'emit');

      component.setMode('manual');
      component.manualDiscountType = DiscountType.PERCENTAGE;
      component.manualDiscountValue = 15;
      component.approvalManagerId = 'manager-1';
      component.approvalReason = 'Customer loyalty';
      component.approvalDialogVisible = true;

      component.approveAndApply();

      expect(component.discountApplied.emit).toHaveBeenCalledWith(jasmine.objectContaining({
        requiresManagerApproval: true,
        managerApprovedBy: 'manager-1',
        managerApprovalReason: 'Customer loyalty'
      }));
    });

    it('should not apply without manager ID', () => {
      spyOn(component.discountApplied, 'emit');

      component.approvalManagerId = '';
      component.approvalReason = 'Test';

      component.approveAndApply();

      expect(component.discountApplied.emit).not.toHaveBeenCalled();
    });

    it('should not apply without reason', () => {
      spyOn(component.discountApplied, 'emit');

      component.approvalManagerId = 'manager-1';
      component.approvalReason = '';

      component.approveAndApply();

      expect(component.discountApplied.emit).not.toHaveBeenCalled();
    });
  });

  describe('formatDiscountValue', () => {
    it('should format percentage discount', () => {
      const result = component.formatDiscountValue(DiscountType.PERCENTAGE, 20);
      expect(result).toContain('20');
      expect(result).toContain('%');
    });

    it('should format fixed amount discount', () => {
      const result = component.formatDiscountValue(DiscountType.FIXED_AMOUNT, 50);
      expect(result).toContain('50');
      expect(result).toContain('$');
    });
  });
});
