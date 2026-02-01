import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { CardModule } from 'primeng/card';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { InputNumberModule } from 'primeng/inputnumber';
import { DatePickerModule } from 'primeng/datepicker';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { TextareaModule } from 'primeng/textarea';

import { CouponService } from '../../../../core/services/coupon.service';
import {
  Coupon,
  CouponSummary,
  CreateCouponRequest,
  UpdateCouponRequest
} from '../../../../models/coupon.model';
import {
  DiscountType,
  CouponStatus,
  DiscountTypeLabels,
  CouponStatusLabels,
  getCouponStatusSeverity,
  formatDiscountValue
} from '../../../../enums';

/**
 * Coupon List Component
 * Manages discount coupons with CRUD operations
 * Feature: F-023 Discount and Coupon Management
 */
@Component({
  selector: 'app-coupon-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    SelectModule,
    TagModule,
    TooltipModule,
    ConfirmDialogModule,
    DialogModule,
    ToastModule,
    CardModule,
    ProgressSpinnerModule,
    InputNumberModule,
    DatePickerModule,
    ToggleSwitchModule,
    TextareaModule
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './coupon-list.component.html',
  styleUrls: ['./coupon-list.component.scss']
})
export class CouponListComponent implements OnInit {
  private couponService = inject(CouponService);
  private confirmationService = inject(ConfirmationService);
  private messageService = inject(MessageService);

  coupons = signal<Coupon[]>([]);
  summary = signal<CouponSummary | null>(null);
  loading = signal(false);
  saving = signal(false);

  searchCode = '';
  selectedStatus: CouponStatus | null = null;
  selectedDiscountType: DiscountType | null = null;

  dialogVisible = false;
  editingCoupon: Coupon | null = null;
  formData = this.getEmptyFormData();

  statusOptions = Object.values(CouponStatus).map(s => ({
    label: CouponStatusLabels[s],
    value: s
  }));

  discountTypeOptions = Object.values(DiscountType).map(t => ({
    label: DiscountTypeLabels[t],
    value: t
  }));

  ngOnInit(): void {
    this.loadCoupons();
    this.loadSummary();
  }

  async loadCoupons(): Promise<void> {
    this.loading.set(true);
    try {
      const response = await this.couponService.getCoupons({
        status: this.selectedStatus || undefined,
        discountType: this.selectedDiscountType || undefined,
        code: this.searchCode || undefined,
        includeExpired: true
      });
      this.coupons.set(response.data);
    } catch (error) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to load coupons'
      });
    } finally {
      this.loading.set(false);
    }
  }

  async loadSummary(): Promise<void> {
    try {
      const summary = await this.couponService.getSummary();
      this.summary.set(summary);
    } catch (error) {
      console.error('Failed to load summary:', error);
    }
  }

  onSearch(): void {
    this.loadCoupons();
  }

  resetFilters(): void {
    this.searchCode = '';
    this.selectedStatus = null;
    this.selectedDiscountType = null;
    this.loadCoupons();
  }

  openCreateDialog(): void {
    this.editingCoupon = null;
    this.formData = this.getEmptyFormData();
    this.dialogVisible = true;
  }

  openEditDialog(coupon: Coupon): void {
    this.editingCoupon = coupon;
    this.formData = {
      code: coupon.code,
      description: coupon.description || '',
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      minPurchaseAmount: coupon.minPurchaseAmount,
      maxDiscountAmount: coupon.maxDiscountAmount,
      maxRedemptions: coupon.maxRedemptions,
      validFromDate: new Date(coupon.validFrom),
      validUntilDate: coupon.validUntil ? new Date(coupon.validUntil) : null,
      requiresManagerApproval: coupon.requiresManagerApproval
    };
    this.dialogVisible = true;
  }

  async saveCoupon(): Promise<void> {
    if (!this.formData.code || !this.formData.discountType || this.formData.discountValue === null || !this.formData.validFromDate) {
      this.messageService.add({
        severity: 'error',
        summary: 'Validation Error',
        detail: 'Please fill in all required fields'
      });
      return;
    }

    this.saving.set(true);
    try {
      const validFrom = this.formatDateForApi(this.formData.validFromDate);
      const validUntil = this.formData.validUntilDate ? this.formatDateForApi(this.formData.validUntilDate) : null;

      if (this.editingCoupon) {
        const request: UpdateCouponRequest = {
          description: this.formData.description || null,
          discountType: this.formData.discountType,
          discountValue: this.formData.discountValue,
          minPurchaseAmount: this.formData.minPurchaseAmount,
          maxDiscountAmount: this.formData.maxDiscountAmount,
          maxRedemptions: this.formData.maxRedemptions,
          validFrom,
          validUntil,
          requiresManagerApproval: this.formData.requiresManagerApproval
        };
        await this.couponService.updateCoupon(this.editingCoupon.id, request);
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Coupon updated successfully'
        });
      } else {
        const request: CreateCouponRequest = {
          code: this.formData.code,
          description: this.formData.description || null,
          discountType: this.formData.discountType,
          discountValue: this.formData.discountValue,
          minPurchaseAmount: this.formData.minPurchaseAmount,
          maxDiscountAmount: this.formData.maxDiscountAmount,
          maxRedemptions: this.formData.maxRedemptions,
          validFrom,
          validUntil,
          requiresManagerApproval: this.formData.requiresManagerApproval
        };
        await this.couponService.createCoupon(request);
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Coupon created successfully'
        });
      }

      this.dialogVisible = false;
      this.loadCoupons();
      this.loadSummary();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save coupon';
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: errorMessage
      });
    } finally {
      this.saving.set(false);
    }
  }

  confirmDisable(coupon: Coupon): void {
    this.confirmationService.confirm({
      message: `Are you sure you want to disable coupon "${coupon.code}"?`,
      header: 'Disable Coupon',
      icon: 'pi pi-ban',
      accept: () => this.disableCoupon(coupon)
    });
  }

  async disableCoupon(coupon: Coupon): Promise<void> {
    try {
      await this.couponService.disableCoupon(coupon.id);
      this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Coupon disabled'
      });
      this.loadCoupons();
      this.loadSummary();
    } catch (error) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to disable coupon'
      });
    }
  }

  async enableCoupon(coupon: Coupon): Promise<void> {
    try {
      await this.couponService.enableCoupon(coupon.id);
      this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Coupon enabled'
      });
      this.loadCoupons();
      this.loadSummary();
    } catch (error) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to enable coupon'
      });
    }
  }

  confirmDelete(coupon: Coupon): void {
    this.confirmationService.confirm({
      message: `Are you sure you want to delete coupon "${coupon.code}"? This action cannot be undone.`,
      header: 'Delete Coupon',
      icon: 'pi pi-trash',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => this.deleteCoupon(coupon)
    });
  }

  async deleteCoupon(coupon: Coupon): Promise<void> {
    try {
      await this.couponService.deleteCoupon(coupon.id);
      this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Coupon deleted'
      });
      this.loadCoupons();
      this.loadSummary();
    } catch (error) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to delete coupon'
      });
    }
  }

  formatDiscount(coupon: Coupon): string {
    return formatDiscountValue(coupon.discountType, coupon.discountValue);
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString();
  }

  getStatusLabel(status: CouponStatus): string {
    return CouponStatusLabels[status];
  }

  getStatusSeverity(status: CouponStatus): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' | undefined {
    return getCouponStatusSeverity(status);
  }

  private getEmptyFormData() {
    return {
      code: '',
      description: '',
      discountType: DiscountType.PERCENTAGE,
      discountValue: 10,
      minPurchaseAmount: null as number | null,
      maxDiscountAmount: null as number | null,
      maxRedemptions: null as number | null,
      validFromDate: new Date(),
      validUntilDate: null as Date | null,
      requiresManagerApproval: false
    };
  }

  private formatDateForApi(date: Date): string {
    return date.toISOString().split('T')[0];
  }
}
