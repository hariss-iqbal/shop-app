import { Component, input, output, computed, OnChanges, SimpleChanges, ElementRef, viewChild } from '@angular/core';
import { AppCurrencyPipe } from '../../../../shared/pipes/app-currency.pipe';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { FormsModule } from '@angular/forms';
import { TagModule } from 'primeng/tag';
import { DividerModule } from 'primeng/divider';
import { SharedModule } from 'primeng/api';

import { Product } from '../../../../models/product.model';
import { ProductCondition, ProductConditionLabels } from '../../../../enums/product-condition.enum';
import { FocusManagementService } from '../../../../shared/services/focus-management.service';
import { CurrencyService } from '../../../../core/services/currency.service';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-print-label-dialog',
  imports: [
    AppCurrencyPipe,
    DialogModule,
    ButtonModule,
    CheckboxModule,
    FormsModule,
    TagModule,
    DividerModule,
    SharedModule
  ],
  templateUrl: './print-label-dialog.component.html',
  styleUrls: ['./print-label-dialog.component.scss']
})
export class PrintLabelDialogComponent implements OnChanges {
  constructor(
    private focusService: FocusManagementService,
    private currencyService: CurrencyService
  ) { }

  product = input<Product | null>(null);
  visible = input<boolean>(false);
  visibleChange = output<boolean>();

  labelContent = viewChild<ElementRef>('labelContent');

  showQrCode = true;

  dialogHeader = computed(() => {
    const p = this.product();
    return p ? `Print Label - ${p.brandName} ${p.model}` : 'Print Label';
  });

  qrCodeUrl = computed(() => {
    const p = this.product();
    if (!p) return '';
    const detailUrl = `${environment.siteUrl}/product/${p.id}`;
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

  getConditionLabel(condition: ProductCondition): string {
    return ProductConditionLabels[condition];
  }

  onVisibleChange(value: boolean): void {
    this.visibleChange.emit(value);
  }

  onClose(): void {
    this.visibleChange.emit(false);
  }

  onPrint(): void {
    const p = this.product();
    if (!p) return;

    const labelEl = this.labelContent()?.nativeElement;
    if (!labelEl) return;

    const printWindow = window.open('', '_blank', 'width=400,height=600');
    if (!printWindow) return;

    const conditionLabel = this.getConditionLabel(p.condition);
    const formattedPrice = this.currencyService.format(p.sellingPrice, { minDecimals: 0, maxDecimals: 0 });

    const detailUrl = `${environment.siteUrl}/product/${p.id}`;
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
