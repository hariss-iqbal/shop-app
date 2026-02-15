import { Component, EventEmitter, Input, Output, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { Select } from 'primeng/select';
import { DialogModule } from 'primeng/dialog';
import { TagModule } from 'primeng/tag';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TextareaModule } from 'primeng/textarea';
import { MessageModule } from 'primeng/message';
import { DividerModule } from 'primeng/divider';

import { CouponService } from '../../../core/services/coupon.service';
import { CurrencyService } from '../../../core/services/currency.service';
import {
  CouponValidationResponse,
  DiscountConfig
} from '../../../models/coupon.model';
import {
  DiscountType,
  DiscountTypeLabels,
  formatDiscountValue
} from '../../../enums';

/**
 * Discount Applied Event
 */
export interface DiscountAppliedEvent {
  discountType: DiscountType;
  discountValue: number;
  discountAmount: number;
  originalPrice: number;
  finalPrice: number;
  couponId: string | null;
  couponCode: string | null;
  requiresManagerApproval: boolean;
  managerApprovedBy?: string | null;
  managerApprovalReason?: string | null;
}

/**
 * Discount Panel Component
 * Allows applying discounts (coupon or manual) to a sale
 * Feature: F-023 Discount and Coupon Management
 */
@Component({
  selector: 'app-discount-panel',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    InputTextModule,
    InputNumberModule,
    Select,
    DialogModule,
    TagModule,
    ProgressSpinnerModule,
    TextareaModule,
    MessageModule,
    DividerModule
  ],
  templateUrl: './discount-panel.component.html',
  styleUrls: ['./discount-panel.component.scss']
})
export class DiscountPanelComponent implements OnInit {
  @Input() originalPrice: number = 0;
  @Output() discountApplied = new EventEmitter<DiscountAppliedEvent>();
  @Output() discountRemoved = new EventEmitter<void>();

  constructor(
    private couponService: CouponService,
    private currencyService: CurrencyService
  ) { }

  expanded = signal(false);
  mode = signal<'coupon' | 'manual'>('coupon');
  validating = signal(false);
  validationResult = signal<CouponValidationResponse | null>(null);
  appliedDiscount = signal<DiscountAppliedEvent | null>(null);
  config = signal<DiscountConfig | null>(null);

  couponCode = '';
  manualDiscountType: DiscountType = DiscountType.PERCENTAGE;
  manualDiscountValue = 0;

  approvalDialogVisible = false;
  approvalManagerId = '';
  approvalReason = '';

  discountTypeOptions = Object.values(DiscountType).map(t => ({
    label: DiscountTypeLabels[t],
    value: t
  }));

  ngOnInit(): void {
    this.loadConfig();
  }

  async loadConfig(): Promise<void> {
    try {
      const config = await this.couponService.getConfig();
      this.config.set(config);
    } catch (error) {
      console.error('Failed to load discount config:', error);
    }
  }

  expand(): void {
    this.expanded.set(true);
    this.reset();
  }

  collapse(): void {
    this.expanded.set(false);
    this.reset();
  }

  setMode(mode: 'coupon' | 'manual'): void {
    this.mode.set(mode);
    this.reset();
  }

  reset(): void {
    this.couponCode = '';
    this.validationResult.set(null);
    this.manualDiscountType = DiscountType.PERCENTAGE;
    this.manualDiscountValue = 0;
  }

  async validateCoupon(): Promise<void> {
    if (!this.couponCode) return;

    this.validating.set(true);
    try {
      const result = await this.couponService.validateCoupon({
        code: this.couponCode,
        purchaseAmount: this.originalPrice
      });
      this.validationResult.set(result);
    } catch (error) {
      this.validationResult.set({
        isValid: false,
        error: 'Failed to validate coupon',
        requiresManagerApproval: false
      });
    } finally {
      this.validating.set(false);
    }
  }

  calculateManualDiscount(): void {
    // Trigger reactivity by calling computed signals
  }

  calculatedDiscountAmount = () => {
    if (this.manualDiscountType === DiscountType.PERCENTAGE) {
      return this.originalPrice * (this.manualDiscountValue / 100);
    }
    return Math.min(this.manualDiscountValue, this.originalPrice);
  };

  calculatedFinalPrice = () => {
    return this.originalPrice - this.calculatedDiscountAmount();
  };

  calculatedDiscountPercentage = () => {
    return (this.calculatedDiscountAmount() / this.originalPrice) * 100;
  };

  applyCouponDiscount(): void {
    const result = this.validationResult();
    if (!result?.isValid || !result.coupon) return;

    const event: DiscountAppliedEvent = {
      discountType: result.coupon.discountType,
      discountValue: result.coupon.discountValue,
      discountAmount: result.discountAmount || 0,
      originalPrice: this.originalPrice,
      finalPrice: result.finalPrice || this.originalPrice,
      couponId: result.coupon.id,
      couponCode: result.coupon.code,
      requiresManagerApproval: false
    };

    this.appliedDiscount.set(event);
    this.discountApplied.emit(event);
    this.collapse();
  }

  applyManualDiscount(): void {
    const discountAmount = this.calculatedDiscountAmount();
    const finalPrice = this.calculatedFinalPrice();

    const event: DiscountAppliedEvent = {
      discountType: this.manualDiscountType,
      discountValue: this.manualDiscountValue,
      discountAmount,
      originalPrice: this.originalPrice,
      finalPrice,
      couponId: null,
      couponCode: null,
      requiresManagerApproval: false
    };

    this.appliedDiscount.set(event);
    this.discountApplied.emit(event);
    this.collapse();
  }

  openApprovalDialog(): void {
    this.approvalManagerId = '';
    this.approvalReason = '';
    this.approvalDialogVisible = true;
  }

  approveAndApply(): void {
    if (!this.approvalManagerId || !this.approvalReason) return;

    let event: DiscountAppliedEvent;

    if (this.mode() === 'coupon' && this.validationResult()?.isValid) {
      const result = this.validationResult()!;
      event = {
        discountType: result.coupon!.discountType,
        discountValue: result.coupon!.discountValue,
        discountAmount: result.discountAmount || 0,
        originalPrice: this.originalPrice,
        finalPrice: result.finalPrice || this.originalPrice,
        couponId: result.coupon!.id,
        couponCode: result.coupon!.code,
        requiresManagerApproval: true,
        managerApprovedBy: this.approvalManagerId,
        managerApprovalReason: this.approvalReason
      };
    } else {
      event = {
        discountType: this.manualDiscountType,
        discountValue: this.manualDiscountValue,
        discountAmount: this.calculatedDiscountAmount(),
        originalPrice: this.originalPrice,
        finalPrice: this.calculatedFinalPrice(),
        couponId: null,
        couponCode: null,
        requiresManagerApproval: true,
        managerApprovedBy: this.approvalManagerId,
        managerApprovalReason: this.approvalReason
      };
    }

    this.appliedDiscount.set(event);
    this.discountApplied.emit(event);
    this.approvalDialogVisible = false;
    this.collapse();
  }

  removeDiscount(): void {
    this.appliedDiscount.set(null);
    this.discountRemoved.emit();
  }

  formatDiscountValue(type: DiscountType, value: number): string {
    return formatDiscountValue(type, value, this.currencyService.symbol);
  }
}
