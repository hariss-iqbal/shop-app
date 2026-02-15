import { Component, EventEmitter, Input, Output, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { DividerModule } from 'primeng/divider';

import { Refund, RefundReceiptData } from '../../../../models/refund.model';
import { AppCurrencyPipe } from '../../../../shared/pipes/app-currency.pipe';
import { CurrencyService } from '../../../../core/services/currency.service';
import { ShopDetailsService } from '../../../../core/services/shop-details.service';

@Component({
  selector: 'app-print-refund-receipt-dialog',
  imports: [
    CommonModule,
    DialogModule,
    ButtonModule,
    DividerModule,
    DatePipe,
    AppCurrencyPipe
  ],
  templateUrl: './print-refund-receipt-dialog.component.html',
  styleUrls: ['./print-refund-receipt-dialog.component.scss']
})
export class PrintRefundReceiptDialogComponent implements OnChanges {
  @Input() visible = false;
  @Input() refund: Refund | null = null;

  @Output() visibleChange = new EventEmitter<boolean>();

  constructor(
    private currencyService: CurrencyService,
    private shopDetailsService: ShopDetailsService
  ) { }

  receiptData: RefundReceiptData | null = null;
  get storeConfig() {
    return {
      name: this.shopDetailsService.shopName(),
      address: this.shopDetailsService.address(),
      phone: this.shopDetailsService.phoneDisplay(),
      email: this.shopDetailsService.email()
    };
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['refund'] && this.refund) {
      this.buildReceiptData();
    }
  }

  private buildReceiptData(): void {
    if (!this.refund) return;

    this.receiptData = {
      refundNumber: this.refund.refundNumber,
      originalReceiptNumber: this.refund.originalReceiptNumber,
      refundDate: this.refund.refundDate,
      refundTime: this.refund.refundTime,
      items: this.refund.items,
      subtotal: this.refund.subtotal,
      taxRate: this.refund.taxRate,
      taxAmount: this.refund.taxAmount,
      refundAmount: this.refund.refundAmount,
      refundReason: this.refund.refundReason,
      customerName: this.refund.customerName,
      customerPhone: this.refund.customerPhone,
      customerEmail: this.refund.customerEmail,
      notes: this.refund.notes,
      isPartialRefund: this.refund.isPartialRefund,
      managerApproved: this.refund.managerApproved,
      hasCustomPrices: this.refund.hasCustomPrices
    };
  }

  onPrint(): void {
    const printContent = document.getElementById('refund-receipt');
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Refund Receipt - ${this.receiptData?.refundNumber}</title>
        <style>
          body {
            font-family: 'Courier New', monospace;
            font-size: 12px;
            width: 80mm;
            margin: 0 auto;
            padding: 10px;
          }
          .text-center { text-align: center; }
          .font-bold { font-weight: bold; }
          .text-red { color: #dc2626; }
          .flex { display: flex; }
          .justify-between { justify-content: space-between; }
          .mb-1 { margin-bottom: 4px; }
          .mb-2 { margin-bottom: 8px; }
          .mb-3 { margin-bottom: 12px; }
          .mt-2 { margin-top: 8px; }
          .pt-2 { padding-top: 8px; }
          .pl-2 { padding-left: 8px; }
          .border-top { border-top: 1px dashed #000; }
          .divider { border-top: 1px dashed #000; margin: 12px 0; }
          .text-sm { font-size: 10px; }
          .text-lg { font-size: 14px; }
          .text-xl { font-size: 16px; }
          .text-2xl { font-size: 18px; }
          .text-muted { color: #666; }
          @media print {
            body { width: 80mm; }
          }
        </style>
      </head>
      <body>
        ${this.generatePrintHtml()}
      </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  }

  onDownloadPdf(): void {
    const printContent = document.getElementById('refund-receipt');
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Refund Receipt - ${this.receiptData?.refundNumber}</title>
        <style>
          body {
            font-family: 'Courier New', monospace;
            font-size: 12px;
            max-width: 400px;
            margin: 0 auto;
            padding: 20px;
          }
          .text-center { text-align: center; }
          .font-bold { font-weight: bold; }
          .text-red { color: #dc2626; }
          .flex { display: flex; }
          .justify-between { justify-content: space-between; }
          .mb-1 { margin-bottom: 4px; }
          .mb-2 { margin-bottom: 8px; }
          .mb-3 { margin-bottom: 12px; }
          .mt-2 { margin-top: 8px; }
          .pt-2 { padding-top: 8px; }
          .pl-2 { padding-left: 8px; }
          .border-top { border-top: 1px dashed #000; }
          .divider { border-top: 1px dashed #000; margin: 12px 0; }
          .text-sm { font-size: 10px; }
          .text-lg { font-size: 14px; }
          .text-xl { font-size: 16px; }
          .text-2xl { font-size: 18px; }
          .text-muted { color: #666; }
        </style>
      </head>
      <body>
        ${this.generatePrintHtml()}
        <script>
          window.onload = function() {
            window.print();
          };
        </script>
      </body>
      </html>
    `);

    printWindow.document.close();
  }

  private generatePrintHtml(): string {
    if (!this.receiptData) return '';

    const formatCurrency = (amount: number) => this.currencyService.format(amount, { minDecimals: 2, maxDecimals: 2 });

    let html = `
      <div class="text-center mb-3">
        <div class="text-xl font-bold">${this.storeConfig.name}</div>
        <div class="text-sm">${this.storeConfig.address}</div>
        <div class="text-sm">Tel: ${this.storeConfig.phone}</div>
      </div>

      <div class="divider"></div>

      <div class="text-center mb-3">
        <div class="text-2xl font-bold text-red">*** REFUND ***</div>
        ${this.receiptData.isPartialRefund ? '<div class="text-sm" style="color: #ea580c;">PARTIAL REFUND</div>' : ''}
      </div>

      <div class="mb-3">
        <div class="flex justify-between mb-1">
          <span class="text-muted">Refund #:</span>
          <span class="font-bold">${this.receiptData.refundNumber}</span>
        </div>
    `;

    if (this.receiptData.originalReceiptNumber) {
      html += `
        <div class="flex justify-between mb-1">
          <span class="text-muted">Original Receipt:</span>
          <span>${this.receiptData.originalReceiptNumber}</span>
        </div>
      `;
    }

    html += `
        <div class="flex justify-between mb-1">
          <span class="text-muted">Date:</span>
          <span>${new Date(this.receiptData.refundDate).toLocaleDateString()}</span>
        </div>
        <div class="flex justify-between mb-1">
          <span class="text-muted">Time:</span>
          <span>${this.receiptData.refundTime}</span>
        </div>
      </div>
    `;

    if (this.receiptData.customerName) {
      html += `
        <div class="mb-3">
          <div class="flex justify-between">
            <span class="text-muted">Customer:</span>
            <span>${this.receiptData.customerName}</span>
          </div>
      `;

      if (this.receiptData.customerPhone) {
        html += `
          <div class="flex justify-between">
            <span class="text-muted">Phone:</span>
            <span>${this.receiptData.customerPhone}</span>
          </div>
        `;
      }

      html += `</div>`;
    }

    html += `<div class="divider"></div>`;

    html += `<div class="mb-3"><div class="font-bold mb-2">Refunded Items:</div>`;

    this.receiptData.items.forEach(item => {
      const customPriceMarker = item.isCustomPrice ? ' <span style="color: #ea580c; font-size: 10px;">*</span>' : '';
      const originalPriceNote = item.isCustomPrice && item.originalUnitPrice
        ? `<div class="text-sm text-muted pl-2">(Orig: ${formatCurrency(item.originalUnitPrice)})</div>`
        : '';
      html += `
        <div class="mb-2">
          <div class="flex justify-between">
            <span>${item.itemName}${customPriceMarker}</span>
          </div>
          <div class="flex justify-between text-sm">
            <span class="text-muted pl-2">${item.quantity} x ${formatCurrency(item.unitPrice)}</span>
            <span>-${formatCurrency(item.total)}</span>
          </div>
          ${originalPriceNote}
        </div>
      `;
    });

    html += `</div><div class="divider"></div>`;

    html += `
      <div class="mb-3">
        <div class="flex justify-between mb-1">
          <span>Subtotal:</span>
          <span>-${formatCurrency(this.receiptData.subtotal)}</span>
        </div>
    `;

    if (this.receiptData.taxAmount > 0) {
      html += `
        <div class="flex justify-between mb-1">
          <span>Tax (${this.receiptData.taxRate}%):</span>
          <span>-${formatCurrency(this.receiptData.taxAmount)}</span>
        </div>
      `;
    }

    html += `
        <div class="flex justify-between font-bold text-lg mt-2 pt-2 border-top">
          <span>REFUND TOTAL:</span>
          <span class="text-red">-${formatCurrency(this.receiptData.refundAmount)}</span>
        </div>
      </div>
    `;

    if (this.receiptData.refundReason) {
      html += `
        <div class="divider"></div>
        <div class="mb-3">
          <span class="text-muted">Reason: </span>
          <span>${this.receiptData.refundReason}</span>
        </div>
      `;
    }

    if (this.receiptData.hasCustomPrices) {
      html += `<div class="text-sm text-muted mb-1">* Custom return price applied</div>`;
    }

    if (this.receiptData.managerApproved) {
      html += `<div class="text-sm mb-1" style="color: #16a34a;">Manager Approved</div>`;
    }

    html += `
      <div class="divider"></div>
      <div class="text-center">
        <div class="text-sm mb-1">Thank you for your understanding.</div>
        <div class="text-sm text-muted">This is a refund receipt.</div>
      </div>
    `;

    return html;
  }

  onVisibleChange(visible: boolean): void {
    this.visibleChange.emit(visible);
  }
}
