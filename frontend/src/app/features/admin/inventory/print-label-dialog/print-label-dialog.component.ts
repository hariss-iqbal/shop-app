import { Component, inject, input, output, computed, OnChanges, SimpleChanges, ElementRef, viewChild } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { FormsModule } from '@angular/forms';
import { TagModule } from 'primeng/tag';
import { DividerModule } from 'primeng/divider';
import { SharedModule } from 'primeng/api';

import { Phone } from '../../../../models/phone.model';
import { PhoneCondition, PhoneConditionLabels } from '../../../../enums/phone-condition.enum';
import { FocusManagementService } from '../../../../shared/services/focus-management.service';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-print-label-dialog',
  imports: [
    CurrencyPipe,
    DialogModule,
    ButtonModule,
    CheckboxModule,
    FormsModule,
    TagModule,
    DividerModule,
    SharedModule
  ],
  template: `
    <p-dialog
      [header]="dialogHeader()"
      [visible]="visible()"
      (visibleChange)="onVisibleChange($event)"
      (onShow)="onDialogShow()"
      (onHide)="onDialogHide()"
      [modal]="true"
      [closable]="true"
      [focusOnShow]="true"
      [focusTrap]="true"
      [closeOnEscape]="true"
      [style]="{ width: '600px' }"
      [breakpoints]="{ '575px': '95vw' }"
      role="dialog"
      [attr.aria-label]="dialogHeader()"
    >
      <!-- Print Controls -->
      <div class="flex align-items-center justify-content-between mb-4 print-hide">
        <div class="flex align-items-center gap-3">
          <p-checkbox
            [(ngModel)]="showQrCode"
            [binary]="true"
            inputId="showQr"
            label="Include QR Code"
          />
        </div>
        <p-button
          label="Print"
          icon="pi pi-print"
          (onClick)="onPrint()"
        />
      </div>

      <p-divider styleClass="print-hide" />

      <!-- Label Preview / Print Content -->
      <div #labelContent class="label-container">
        @if (phone()) {
          <div class="label-content">
            <!-- Brand and Model -->
            <div class="label-header">
              <div class="label-brand">{{ phone()!.brandName }}</div>
              <div class="label-model">{{ phone()!.model }}</div>
            </div>

            <!-- Specifications Row -->
            <div class="label-specs">
              @if (phone()!.storageGb) {
                <span class="label-spec-item">{{ phone()!.storageGb }} GB</span>
              }
              <span class="label-spec-item label-condition">
                {{ getConditionLabel(phone()!.condition) }}
              </span>
            </div>

            <div class="label-divider"></div>

            <!-- Price -->
            <div class="label-price">
              {{ phone()!.sellingPrice | currency:'USD':'symbol':'1.0-0' }}
            </div>

            <!-- QR Code Section -->
            @if (showQrCode) {
              <div class="label-qr">
                <img
                  [src]="qrCodeUrl()"
                  [alt]="'QR code for ' + phone()!.brandName + ' ' + phone()!.model"
                  class="label-qr-image"
                  width="100"
                  height="100"
                />
                <div class="label-qr-hint">Scan for details</div>
              </div>
            }
          </div>
        }
      </div>

      <ng-template pTemplate="footer">
        <div class="flex justify-content-end gap-2 print-hide">
          <p-button
            label="Close"
            severity="secondary"
            [text]="true"
            (onClick)="onClose()"
            ariaLabel="Close print label dialog"
          />
          <p-button
            label="Print Label"
            icon="pi pi-print"
            (onClick)="onPrint()"
            ariaLabel="Print phone label"
          />
        </div>
      </ng-template>
    </p-dialog>
  `,
  styles: [`
    .label-container {
      border: 2px dashed var(--surface-300);
      border-radius: 8px;
      padding: 24px;
      background: var(--surface-0);
    }

    .label-content {
      text-align: center;
      max-width: 400px;
      margin: 0 auto;
    }

    .label-header {
      margin-bottom: 12px;
    }

    .label-brand {
      font-size: 1.125rem;
      font-weight: 600;
      color: var(--text-color-secondary);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .label-model {
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--text-color);
      line-height: 1.2;
    }

    .label-specs {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      margin-bottom: 12px;
      flex-wrap: wrap;
    }

    .label-spec-item {
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--text-color-secondary);
      background: var(--surface-100);
      padding: 4px 12px;
      border-radius: 16px;
    }

    .label-divider {
      height: 1px;
      background: var(--surface-300);
      margin: 16px auto;
      width: 60%;
    }

    .label-price {
      font-size: 2.5rem;
      font-weight: 800;
      color: var(--primary-color);
      margin-bottom: 16px;
    }

    .label-qr {
      margin-top: 8px;
    }

    .label-qr-image {
      display: block;
      margin: 0 auto;
    }

    .label-qr-hint {
      font-size: 0.75rem;
      color: var(--text-color-secondary);
      margin-top: 4px;
    }

    @media print {
      :host ::ng-deep .p-dialog-mask {
        position: static !important;
        background: none !important;
        padding: 0 !important;
      }

      :host ::ng-deep .p-dialog {
        position: static !important;
        box-shadow: none !important;
        border: none !important;
        max-height: none !important;
        width: 100% !important;
        max-width: none !important;
      }

      :host ::ng-deep .p-dialog-header {
        display: none !important;
      }

      :host ::ng-deep .p-dialog-footer {
        display: none !important;
      }

      .print-hide,
      :host ::ng-deep .print-hide {
        display: none !important;
      }

      .label-container {
        border: 2px solid #000;
        border-radius: 4px;
        padding: 20px;
        background: #fff;
        page-break-inside: avoid;
        width: 3in;
        min-height: 2in;
        margin: 0 auto;
        box-sizing: border-box;
      }

      .label-brand {
        font-size: 10pt;
        color: #666;
      }

      .label-model {
        font-size: 14pt;
        color: #000;
      }

      .label-spec-item {
        font-size: 8pt;
        color: #333;
        background: #eee;
        border: 1px solid #ccc;
      }

      .label-divider {
        background: #000;
      }

      .label-price {
        font-size: 24pt;
        color: #000;
      }

      .label-qr-image {
        width: 80px;
        height: 80px;
      }

      .label-qr-hint {
        font-size: 7pt;
        color: #666;
      }
    }
  `]
})
export class PrintLabelDialogComponent implements OnChanges {
  private focusService = inject(FocusManagementService);

  phone = input<Phone | null>(null);
  visible = input<boolean>(false);
  visibleChange = output<boolean>();

  labelContent = viewChild<ElementRef>('labelContent');

  showQrCode = true;

  dialogHeader = computed(() => {
    const p = this.phone();
    return p ? `Print Label - ${p.brandName} ${p.model}` : 'Print Label';
  });

  qrCodeUrl = computed(() => {
    const p = this.phone();
    if (!p) return '';
    const detailUrl = `${environment.siteUrl}/phone/${p.id}`;
    const encoded = encodeURIComponent(detailUrl);
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encoded}`;
  });

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible']) {
      const v = this.visible();
      if (v) {
        this.showQrCode = true;
      }
    }
  }

  onDialogShow(): void {
    this.focusService.saveTriggerElement();
  }

  onDialogHide(): void {
    this.focusService.restoreFocus();
  }

  getConditionLabel(condition: PhoneCondition): string {
    return PhoneConditionLabels[condition];
  }

  onVisibleChange(value: boolean): void {
    this.visibleChange.emit(value);
  }

  onClose(): void {
    this.visibleChange.emit(false);
  }

  onPrint(): void {
    const p = this.phone();
    if (!p) return;

    const labelEl = this.labelContent()?.nativeElement;
    if (!labelEl) return;

    const printWindow = window.open('', '_blank', 'width=400,height=600');
    if (!printWindow) return;

    const conditionLabel = this.getConditionLabel(p.condition);
    const formattedPrice = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(p.sellingPrice);

    const detailUrl = `${environment.siteUrl}/phone/${p.id}`;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(detailUrl)}`;

    const storageHtml = p.storageGb
      ? `<span class="spec-item">${p.storageGb} GB</span>`
      : '';

    const qrHtml = this.showQrCode
      ? `<div class="qr-section">
           <img src="${qrUrl}" alt="QR Code" width="80" height="80" />
           <div class="qr-hint">Scan for details</div>
         </div>`
      : '';

    printWindow.document.write(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Label - ${this.escapeHtml(p.brandName)} ${this.escapeHtml(p.model)}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      background: #fff;
    }
    .label {
      border: 2px solid #000;
      border-radius: 4px;
      padding: 16px;
      width: 3in;
      min-height: 2in;
      text-align: center;
      page-break-inside: avoid;
    }
    .brand {
      font-size: 10pt;
      font-weight: 600;
      color: #666;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .model {
      font-size: 14pt;
      font-weight: 700;
      color: #000;
      margin-bottom: 8px;
      line-height: 1.2;
    }
    .specs {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      margin-bottom: 10px;
      flex-wrap: wrap;
    }
    .spec-item {
      font-size: 8pt;
      font-weight: 500;
      color: #333;
      background: #eee;
      padding: 2px 8px;
      border-radius: 12px;
      border: 1px solid #ccc;
    }
    .divider {
      height: 1px;
      background: #000;
      margin: 10px auto;
      width: 60%;
    }
    .price {
      font-size: 24pt;
      font-weight: 800;
      color: #000;
      margin-bottom: 10px;
    }
    .qr-section {
      margin-top: 6px;
    }
    .qr-section img {
      display: block;
      margin: 0 auto;
    }
    .qr-hint {
      font-size: 7pt;
      color: #666;
      margin-top: 2px;
    }
    @media print {
      body { min-height: auto; }
      .label { border: 2px solid #000; }
    }
    @page {
      size: auto;
      margin: 0.25in;
    }
  </style>
</head>
<body>
  <div class="label">
    <div class="brand">${this.escapeHtml(p.brandName)}</div>
    <div class="model">${this.escapeHtml(p.model)}</div>
    <div class="specs">
      ${storageHtml}
      <span class="spec-item">${this.escapeHtml(conditionLabel)}</span>
    </div>
    <div class="divider"></div>
    <div class="price">${formattedPrice}</div>
    ${qrHtml}
  </div>
  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
        // Close window after print dialog - fallback for browsers without onafterprint
        if (window.onafterprint !== undefined) {
          window.onafterprint = function() { window.close(); };
        } else {
          // For browsers without onafterprint, close after a delay
          setTimeout(function() { window.close(); }, 1000);
        }
      }, 500);
    };
  </script>
</body>
</html>`);
    printWindow.document.close();
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}
