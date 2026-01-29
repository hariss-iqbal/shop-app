import { Component, inject, signal, input, output, computed, OnChanges, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { DatePickerModule } from 'primeng/datepicker';
import { TextareaModule } from 'primeng/textarea';
import { FloatLabelModule } from 'primeng/floatlabel';
import { DividerModule } from 'primeng/divider';
import { TagModule } from 'primeng/tag';
import { ImageModule } from 'primeng/image';

import { SaleService } from '../../../../core/services/sale.service';
import { InputSanitizationService } from '../../../../core/services/input-sanitization.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { FocusManagementService } from '../../../../shared/services/focus-management.service';
import { Phone } from '../../../../models/phone.model';

@Component({
  selector: 'app-mark-as-sold-dialog',
  imports: [
    FormsModule,
    CurrencyPipe,
    DecimalPipe,
    DialogModule,
    ButtonModule,
    InputTextModule,
    InputNumberModule,
    DatePickerModule,
    TextareaModule,
    FloatLabelModule,
    DividerModule,
    TagModule,
    ImageModule
  ],
  template: `
    <p-dialog
      header="Complete Sale"
      [visible]="visible()"
      (visibleChange)="onVisibleChange($event)"
      (onShow)="onDialogShow()"
      (onHide)="onDialogHide()"
      [modal]="true"
      [closable]="true"
      [focusOnShow]="true"
      [focusTrap]="true"
      [closeOnEscape]="true"
      [style]="{ width: '520px' }"
      [breakpoints]="{ '575px': '95vw' }"
      role="dialog"
      aria-label="Complete Sale Dialog"
      styleClass="mark-as-sold-dialog"
    >
      @if (phone(); as p) {
        <!-- Phone Summary Card -->
        <div class="surface-ground border-round p-3 mb-4">
          <div class="flex align-items-center gap-3">
            @if (p.primaryImageUrl) {
              <p-image
                [src]="p.primaryImageUrl"
                [alt]="p.model"
                width="60"
                imageClass="border-round shadow-1"
              />
            } @else {
              <div class="flex align-items-center justify-content-center bg-surface-200 border-round" style="width: 60px; height: 60px;">
                <i class="pi pi-mobile text-2xl text-color-secondary"></i>
              </div>
            }
            <div class="flex-1">
              <div class="flex align-items-center gap-2 mb-1">
                @if (p.brandLogoUrl) {
                  <img [src]="p.brandLogoUrl" [alt]="p.brandName" width="16" height="16" class="border-round" />
                }
                <span class="font-semibold text-lg">{{ p.brandName }} {{ p.model }}</span>
              </div>
              <div class="flex align-items-center gap-3 text-color-secondary text-sm">
                @if (p.storageGb) {
                  <span><i class="pi pi-database mr-1"></i>{{ p.storageGb }}GB</span>
                }
                @if (p.color) {
                  <span><i class="pi pi-palette mr-1"></i>{{ p.color }}</span>
                }
                @if (p.imei) {
                  <span class="text-xs">IMEI: {{ p.imei }}</span>
                }
              </div>
              <div class="flex align-items-center gap-2 mt-2">
                <span class="text-color-secondary text-sm">Cost:</span>
                <span class="font-medium">{{ p.costPrice | currency }}</span>
                <span class="text-color-secondary text-sm ml-2">List Price:</span>
                <span class="font-medium text-primary">{{ p.sellingPrice | currency }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Sale Details Section -->
        <div class="mb-3">
          <div class="flex align-items-center gap-2 mb-3">
            <i class="pi pi-dollar text-primary"></i>
            <span class="font-medium">Sale Details</span>
            <span class="text-color-secondary text-sm">(* required)</span>
          </div>

          <div class="grid">
            <div class="col-12 md:col-6">
              <p-floatlabel variant="on">
                <p-inputNumber
                  id="salePrice"
                  [(ngModel)]="salePrice"
                  mode="currency"
                  currency="USD"
                  [minFractionDigits]="2"
                  [maxFractionDigits]="2"
                  [min]="0"
                  styleClass="w-full"
                />
                <label for="salePrice">Sale Price *</label>
              </p-floatlabel>
            </div>
            <div class="col-12 md:col-6">
              <p-floatlabel variant="on">
                <p-datepicker
                  id="saleDate"
                  [(ngModel)]="saleDate"
                  [showIcon]="true"
                  [iconDisplay]="'input'"
                  dateFormat="yy-mm-dd"
                  styleClass="w-full"
                />
                <label for="saleDate">Sale Date *</label>
              </p-floatlabel>
            </div>
          </div>

          @if (salePrice !== null && salePrice >= 0) {
            <div class="flex align-items-center gap-2 mt-3 p-2 border-round" [class]="getProfitClass()">
              <i class="pi" [class]="getProfitIcon()"></i>
              <span class="font-medium">Estimated Profit:</span>
              <span class="font-bold">{{ getEstimatedProfit() | currency }}</span>
              <span class="text-sm">({{ getProfitMargin() | number:'1.1-1' }}% margin)</span>
            </div>
          }
        </div>

        <p-divider />

        <!-- Buyer Information Section -->
        <div class="mb-3">
          <div class="flex align-items-center gap-2 mb-3">
            <i class="pi pi-user text-primary"></i>
            <span class="font-medium">Buyer Information</span>
            <p-tag value="Optional" severity="secondary" styleClass="text-xs" />
          </div>

          <div class="flex flex-column gap-3">
            <p-floatlabel variant="on">
              <input
                pInputText
                id="buyerName"
                [(ngModel)]="buyerName"
                [maxlength]="200"
                class="w-full"
              />
              <label for="buyerName">Buyer Name</label>
            </p-floatlabel>

            <div class="grid">
              <div class="col-12 md:col-6">
                <p-floatlabel variant="on">
                  <input
                    pInputText
                    id="buyerPhone"
                    [(ngModel)]="buyerPhone"
                    [maxlength]="30"
                    class="w-full"
                  />
                  <label for="buyerPhone">Phone Number</label>
                </p-floatlabel>
              </div>
              <div class="col-12 md:col-6">
                <p-floatlabel variant="on">
                  <input
                    pInputText
                    id="buyerEmail"
                    [(ngModel)]="buyerEmail"
                    type="email"
                    [maxlength]="255"
                    class="w-full"
                  />
                  <label for="buyerEmail">Email Address</label>
                </p-floatlabel>
              </div>
            </div>
          </div>
        </div>

        <p-divider />

        <!-- Notes Section -->
        <div>
          <div class="flex align-items-center gap-2 mb-3">
            <i class="pi pi-file-edit text-primary"></i>
            <span class="font-medium">Notes</span>
            <p-tag value="Optional" severity="secondary" styleClass="text-xs" />
          </div>

          <p-floatlabel variant="on">
            <textarea
              pTextarea
              id="notes"
              [(ngModel)]="notes"
              [maxlength]="2000"
              rows="3"
              [autoResize]="true"
              class="w-full"
            ></textarea>
            <label for="notes">Sale notes or comments</label>
          </p-floatlabel>
        </div>
      }

      <ng-template pTemplate="footer">
        <div class="flex justify-content-end gap-2">
          <p-button
            label="Cancel"
            severity="secondary"
            [text]="true"
            (onClick)="onCancel()"
            ariaLabel="Cancel sale"
          />
          <p-button
            label="Confirm Sale"
            icon="pi pi-check"
            severity="success"
            [loading]="saving()"
            [disabled]="!isFormValid()"
            (onClick)="onConfirm()"
            ariaLabel="Confirm sale"
          />
        </div>
      </ng-template>
    </p-dialog>
  `
})
export class MarkAsSoldDialogComponent implements OnChanges {
  private saleService = inject(SaleService);
  private sanitizer = inject(InputSanitizationService);
  private toastService = inject(ToastService);
  private focusService = inject(FocusManagementService);

  phone = input<Phone | null>(null);
  visible = input<boolean>(false);
  visibleChange = output<boolean>();
  saleSaved = output<void>();

  saving = signal(false);

  salePrice: number | null = null;
  saleDate: Date | null = null;
  buyerName = '';
  buyerPhone = '';
  buyerEmail = '';
  notes = '';

  dialogHeader = computed(() => {
    const p = this.phone();
    return p ? `Mark as Sold - ${p.brandName} ${p.model}` : 'Mark as Sold';
  });

  getEstimatedProfit(): number {
    const p = this.phone();
    if (!p || this.salePrice === null) return 0;
    return this.salePrice - p.costPrice;
  }

  getProfitMargin(): number {
    if (this.salePrice === null || this.salePrice === 0) return 0;
    return (this.getEstimatedProfit() / this.salePrice) * 100;
  }

  getProfitClass(): string {
    const profit = this.getEstimatedProfit();
    if (profit > 0) return 'bg-green-50 text-green-700';
    if (profit < 0) return 'bg-red-50 text-red-700';
    return 'bg-surface-100 text-color-secondary';
  }

  getProfitIcon(): string {
    const profit = this.getEstimatedProfit();
    if (profit > 0) return 'pi-arrow-up text-green-500';
    if (profit < 0) return 'pi-arrow-down text-red-500';
    return 'pi-minus text-color-secondary';
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['phone'] || changes['visible']) {
      const p = this.phone();
      const v = this.visible();
      if (v && p) {
        this.resetForm(p);
      }
    }
  }

  isFormValid(): boolean {
    return this.salePrice !== null && this.salePrice >= 0 && this.saleDate !== null;
  }

  onDialogShow(): void {
    this.focusService.saveTriggerElement();
  }

  onDialogHide(): void {
    this.focusService.restoreFocus();
  }

  onVisibleChange(value: boolean): void {
    this.visibleChange.emit(value);
  }

  onCancel(): void {
    this.visibleChange.emit(false);
  }

  async onConfirm(): Promise<void> {
    const p = this.phone();
    if (!p || !this.isFormValid()) return;

    this.saving.set(true);

    try {
      const saleDateFormatted = this.formatDate(this.saleDate!);

      await this.saleService.markAsSold({
        phoneId: p.id,
        salePrice: this.salePrice!,
        saleDate: saleDateFormatted,
        buyerName: this.sanitizer.sanitizeOrNull(this.buyerName),
        buyerPhone: this.sanitizer.sanitizeOrNull(this.buyerPhone),
        buyerEmail: this.buyerEmail?.trim() || null,
        notes: this.sanitizer.sanitizeOrNull(this.notes)
      });

      this.toastService.success('Sale Confirmed', `${p.brandName} ${p.model} has been marked as sold`);
      this.visibleChange.emit(false);
      this.saleSaved.emit();
    } catch (error) {
      this.toastService.error('Error', 'Failed to mark phone as sold');
      console.error('Failed to mark as sold:', error);
    } finally {
      this.saving.set(false);
    }
  }

  private resetForm(phone: Phone): void {
    this.salePrice = phone.sellingPrice;
    this.saleDate = new Date();
    this.buyerName = '';
    this.buyerPhone = '';
    this.buyerEmail = '';
    this.notes = '';
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
