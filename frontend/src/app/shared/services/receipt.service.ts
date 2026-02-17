import { Injectable } from '@angular/core';
import { jsPDF } from 'jspdf';
import { environment } from '../../../environments/environment';
import { CartItem, CartSummary, CustomerInfo, ReceiptData, ReceiptItem, Sale, StoreConfig, WhatsAppReceiptMessage } from '../../models/sale.model';
import { ReceiptSequenceService } from '../../core/services/receipt-sequence.service';
import { CurrencyService } from '../../core/services/currency.service';
import { ShopDetailsService } from '../../core/services/shop-details.service';
import { GenerateReceiptNumberResponse } from '../../models/receipt-sequence.model';
import { PaymentSummary } from '../../models/payment.model';
import { PaymentMethod, PaymentMethodLabels } from '../../enums/payment-method.enum';

@Injectable({
  providedIn: 'root'
})
export class ReceiptService {
  constructor(
    private readonly receiptSequenceService: ReceiptSequenceService,
    private readonly currencyService: CurrencyService,
    private readonly shopDetailsService: ShopDetailsService
  ) { }

  private get storeConfig(): StoreConfig {
    return {
      name: this.shopDetailsService.shopName(),
      address: this.shopDetailsService.address(),
      phone: this.shopDetailsService.phoneDisplay(),
      email: this.shopDetailsService.email()
    };
  }

  /**
   * Generate a receipt number using the backend sequence service.
   * This method uses atomic sequencing to prevent duplicates.
   * @param registerId The register/location ID (defaults to 'DEFAULT')
   * @returns Promise containing the generated receipt number response
   */
  async generateReceiptNumberAsync(registerId: string = 'DEFAULT'): Promise<GenerateReceiptNumberResponse> {
    return this.receiptSequenceService.generateNextReceiptNumber(registerId);
  }

  /**
   * @deprecated Use generateReceiptNumberAsync() instead for sequential numbering.
   * This method is kept as a fallback when the async method fails.
   */
  generateReceiptNumber(): string {
    const now = new Date();
    const dd = String(now.getDate()).padStart(2, '0');
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const yyyy = now.getFullYear();
    const random = Math.random().toString(36).substring(2, 4).toUpperCase();
    return `${dd}${mm}${yyyy}-${random}`;
  }

  /**
   * Preview the next receipt number without incrementing the sequence.
   * @param registerId The register/location ID (defaults to 'DEFAULT')
   */
  async previewNextReceiptNumber(registerId: string = 'DEFAULT'): Promise<string | null> {
    const result = await this.receiptSequenceService.previewNextReceiptNumber(registerId);
    return result.success ? result.previewNumber : null;
  }

  /**
   * Build receipt data from cart with sequential receipt number.
   * Uses async receipt number generation from the backend.
   */
  async buildReceiptDataFromCartAsync(
    items: CartItem[],
    summary: CartSummary,
    customerInfo: CustomerInfo,
    saleDate: Date,
    notes: string | null,
    registerId: string = 'DEFAULT',
    payments?: PaymentSummary[]
  ): Promise<{ receiptData: ReceiptData; logId: string | null }> {
    const receiptItems: ReceiptItem[] = items.map(item => ({
      name: `${item.brandName} ${item.model}${item.storageGb ? ` ${item.storageGb}GB` : ''}${item.color ? ` ${item.color}` : ''}`,
      quantity: 1,
      unitPrice: item.salePrice,
      total: item.salePrice,
      taxRate: item.taxRate,
      taxAmount: item.taxAmount,
      basePrice: item.basePrice,
      isTaxExempt: item.isTaxExempt,
      imei: item.imei
    }));

    const result = await this.generateReceiptNumberAsync(registerId);
    const receiptNumber = result.success && result.receiptNumber
      ? result.receiptNumber
      : this.generateReceiptNumber();

    return {
      receiptData: {
        receiptNumber,
        transactionDate: this.formatDate(saleDate),
        transactionTime: this.formatTime(saleDate),
        items: receiptItems,
        subtotal: summary.subtotal,
        taxRate: summary.taxAmount > 0 ? (summary.taxAmount / summary.subtotal) * 100 : 0,
        taxAmount: summary.taxAmount,
        grandTotal: summary.grandTotal,
        customerName: customerInfo.name?.trim() || null,
        customerPhone: customerInfo.phone?.trim() || null,
        customerEmail: customerInfo.email?.trim() || null,
        notes: notes?.trim() || null,
        payments: payments
      },
      logId: result.logId
    };
  }

  /**
   * @deprecated Use buildReceiptDataFromCartAsync() for sequential numbering.
   */
  buildReceiptDataFromCart(
    items: CartItem[],
    summary: CartSummary,
    customerInfo: CustomerInfo,
    saleDate: Date,
    notes: string | null,
    payments?: PaymentSummary[],
    discount?: {
      discountType: 'percentage' | 'fixed_amount';
      discountValue: number;
      discountAmount: number;
      couponCode?: string | null;
    } | null,
    loyalty?: {
      pointsEarned: number;
      pointsRedeemed: number;
      redemptionDiscount: number;
      balanceAfter: number;
      tier: string;
      tierMultiplier: number;
    } | null
  ): ReceiptData {
    const receiptItems: ReceiptItem[] = items.map(item => ({
      name: `${item.brandName} ${item.model}${item.storageGb ? ` ${item.storageGb}GB` : ''}${item.color ? ` ${item.color}` : ''}`,
      quantity: 1,
      unitPrice: item.salePrice,
      total: item.salePrice,
      taxRate: item.taxRate,
      taxAmount: item.taxAmount,
      basePrice: item.basePrice,
      isTaxExempt: item.isTaxExempt,
      imei: item.imei
    }));

    return {
      receiptNumber: this.generateReceiptNumber(),
      transactionDate: this.formatDate(saleDate),
      transactionTime: this.formatTime(saleDate),
      items: receiptItems,
      subtotal: summary.subtotal,
      taxRate: summary.taxAmount > 0 ? (summary.taxAmount / summary.subtotal) * 100 : 0,
      taxAmount: summary.taxAmount,
      grandTotal: summary.grandTotal,
      customerName: customerInfo.name?.trim() || null,
      customerPhone: customerInfo.phone?.trim() || null,
      customerEmail: customerInfo.email?.trim() || null,
      notes: notes?.trim() || null,
      payments: payments,
      discount: discount || null,
      originalTotal: discount ? summary.grandTotal : undefined,
      finalTotal: discount ? summary.finalTotal : summary.grandTotal,
      loyalty: loyalty || null
    };
  }

  /**
   * Build receipt data from a single sale with sequential receipt number.
   */
  async buildReceiptDataFromSaleAsync(
    sale: Sale,
    registerId: string = 'DEFAULT'
  ): Promise<{ receiptData: ReceiptData; logId: string | null }> {
    const receiptItems: ReceiptItem[] = [{
      name: `${sale.brandName} ${sale.productName}`,
      quantity: 1,
      unitPrice: sale.salePrice,
      total: sale.salePrice,
      taxRate: sale.taxRate,
      taxAmount: sale.taxAmount,
      basePrice: sale.basePrice ?? sale.salePrice,
      isTaxExempt: sale.isTaxExempt
    }];

    const saleDate = new Date(sale.saleDate);
    const result = await this.generateReceiptNumberAsync(registerId);
    const receiptNumber = result.success && result.receiptNumber
      ? result.receiptNumber
      : `RCP-${sale.id.substring(0, 8).toUpperCase()}`;

    return {
      receiptData: {
        receiptNumber,
        transactionDate: this.formatDate(saleDate),
        transactionTime: this.formatTime(new Date(sale.createdAt)),
        items: receiptItems,
        subtotal: sale.salePrice,
        taxRate: 0,
        taxAmount: 0,
        grandTotal: sale.salePrice,
        customerName: sale.buyerName,
        customerPhone: sale.buyerPhone,
        customerEmail: sale.buyerEmail,
        notes: sale.notes
      },
      logId: result.logId
    };
  }

  /**
   * @deprecated Use buildReceiptDataFromSaleAsync() for sequential numbering.
   */
  buildReceiptDataFromSale(sale: Sale): ReceiptData {
    const receiptItems: ReceiptItem[] = [{
      name: `${sale.brandName} ${sale.productName}`,
      quantity: 1,
      unitPrice: sale.salePrice,
      total: sale.salePrice,
      taxRate: sale.taxRate,
      taxAmount: sale.taxAmount,
      basePrice: sale.basePrice ?? sale.salePrice,
      isTaxExempt: sale.isTaxExempt
    }];

    const saleDate = new Date(sale.saleDate);

    return {
      receiptNumber: `RCP-${sale.id.substring(0, 8).toUpperCase()}`,
      transactionDate: this.formatDate(saleDate),
      transactionTime: this.formatTime(new Date(sale.createdAt)),
      items: receiptItems,
      subtotal: sale.salePrice,
      taxRate: 0,
      taxAmount: 0,
      grandTotal: sale.salePrice,
      customerName: sale.buyerName,
      customerPhone: sale.buyerPhone,
      customerEmail: sale.buyerEmail,
      notes: sale.notes
    };
  }

  /**
   * Build receipt data from multiple sales with sequential receipt number.
   */
  async buildReceiptDataFromMultipleSalesAsync(
    sales: Sale[],
    registerId: string = 'DEFAULT'
  ): Promise<{ receiptData: ReceiptData; logId: string | null }> {
    const receiptItems: ReceiptItem[] = sales.map(sale => ({
      name: `${sale.brandName} ${sale.productName}`,
      quantity: 1,
      unitPrice: sale.salePrice,
      total: sale.salePrice,
      taxRate: sale.taxRate,
      taxAmount: sale.taxAmount,
      basePrice: sale.basePrice ?? sale.salePrice,
      isTaxExempt: sale.isTaxExempt
    }));

    const subtotal = sales.reduce((sum, sale) => sum + sale.salePrice, 0);
    const firstSale = sales[0];
    const saleDate = new Date(firstSale.saleDate);

    const result = await this.generateReceiptNumberAsync(registerId);
    const receiptNumber = result.success && result.receiptNumber
      ? result.receiptNumber
      : `RCP-${firstSale.id.substring(0, 8).toUpperCase()}`;

    return {
      receiptData: {
        receiptNumber,
        transactionDate: this.formatDate(saleDate),
        transactionTime: this.formatTime(new Date(firstSale.createdAt)),
        items: receiptItems,
        subtotal,
        taxRate: 0,
        taxAmount: 0,
        grandTotal: subtotal,
        customerName: firstSale.buyerName,
        customerPhone: firstSale.buyerPhone,
        customerEmail: firstSale.buyerEmail,
        notes: firstSale.notes
      },
      logId: result.logId
    };
  }

  /**
   * @deprecated Use buildReceiptDataFromMultipleSalesAsync() for sequential numbering.
   */
  buildReceiptDataFromMultipleSales(sales: Sale[]): ReceiptData {
    const receiptItems: ReceiptItem[] = sales.map(sale => ({
      name: `${sale.brandName} ${sale.productName}`,
      quantity: 1,
      unitPrice: sale.salePrice,
      total: sale.salePrice,
      taxRate: sale.taxRate,
      taxAmount: sale.taxAmount,
      basePrice: sale.basePrice ?? sale.salePrice,
      isTaxExempt: sale.isTaxExempt
    }));

    const subtotal = sales.reduce((sum, sale) => sum + sale.salePrice, 0);
    const firstSale = sales[0];
    const saleDate = new Date(firstSale.saleDate);

    return {
      receiptNumber: `RCP-${firstSale.id.substring(0, 8).toUpperCase()}`,
      transactionDate: this.formatDate(saleDate),
      transactionTime: this.formatTime(new Date(firstSale.createdAt)),
      items: receiptItems,
      subtotal,
      taxRate: 0,
      taxAmount: 0,
      grandTotal: subtotal,
      customerName: firstSale.buyerName,
      customerPhone: firstSale.buyerPhone,
      customerEmail: firstSale.buyerEmail,
      notes: firstSale.notes
    };
  }

  /**
   * Print receipt with professional PDF-style layout
   */
  printReceipt(receiptData: ReceiptData, options: { showQrCode?: boolean } = {}): void {
    const { showQrCode = true } = options;

    const printWindow = window.open('', '_blank', 'width=900,height=1100');
    if (!printWindow) return;

    const qrCodeUrl = this.generateQrCodeUrl(receiptData.receiptNumber);
    const html = this.generateProfessionalReceiptHtml(receiptData, qrCodeUrl, showQrCode);

    printWindow.document.write(html);
    printWindow.document.close();
  }

  /**
   * Generate professional receipt HTML for print and PDF
   */
  private generateProfessionalReceiptHtml(
    receiptData: ReceiptData,
    qrCodeUrl: string,
    showQrCode: boolean
  ): string {
    const itemsHtml = receiptData.items.map(item => `
      <tr>
        <td class="item-description">
          <span class="item-name">${this.escapeHtml(item.name)}</span>
          ${item.imei ? `<span class="imei-info">IMEI: ${this.escapeHtml(item.imei)}</span>` : ''}
        </td>
        <td class="text-right item-price">${this.formatCurrency(item.unitPrice)}</td>
        <td class="text-right item-qty">${item.quantity}</td>
        <td class="text-right item-total">${this.formatCurrency(item.total)}</td>
      </tr>
    `).join('');

    const customerHtml = (receiptData.customerName || receiptData.customerPhone || receiptData.customerEmail) ? `
      <div class="customer-section">
        <p class="section-label">Recipient</p>
        <div class="customer-info">
          ${receiptData.customerName ? `<p class="customer-name">${this.escapeHtml(receiptData.customerName)}</p>` : ''}
          ${receiptData.customerPhone ? `<p>Tel: ${this.escapeHtml(receiptData.customerPhone)}</p>` : ''}
          ${receiptData.customerEmail ? `<p>${this.escapeHtml(receiptData.customerEmail)}</p>` : ''}
        </div>
      </div>
    ` : '';

    const taxHtml = '';

    const discountHtml = receiptData.discount ? `
      <div class="totals-row discount-row">
        <span class="totals-label">
          Discount ${receiptData.discount.couponCode ? `(${this.escapeHtml(receiptData.discount.couponCode)})` : ''}
        </span>
        <span class="totals-value">-${this.formatCurrency(receiptData.discount.discountAmount)}</span>
      </div>
    ` : '';

    const savingsHtml = receiptData.discount ? `
      <div class="savings-note">
        <span>Original: ${this.formatCurrency(receiptData.grandTotal)}</span>
        <span class="savings-amount">You saved ${this.formatCurrency(receiptData.discount.discountAmount)}!</span>
      </div>
    ` : '';

    const paymentsHtml = receiptData.payments && receiptData.payments.length > 0 ? `
      <div class="payment-section">
        <p class="section-label">${receiptData.payments.length > 1 ? 'Payments' : 'Payment Method'}</p>
        <div class="payment-details">
          ${receiptData.payments.map(payment => `
            <div class="payment-row">
              <div class="payment-info">
                <span class="payment-method">${this.getPaymentMethodLabel(payment.method)}</span>
                ${payment.cardLastFour ? `<span class="card-last-four">****${payment.cardLastFour}</span>` : ''}
                ${payment.transactionReference ? `<span class="transaction-ref">Ref: ${payment.transactionReference}</span>` : ''}
              </div>
              <span class="payment-amount">${this.formatCurrency(payment.amount)}</span>
            </div>
            ${payment.cashTendered && payment.cashTendered > payment.amount ? `
              <div class="cash-details">
                <span>Tendered: ${this.formatCurrency(payment.cashTendered)}</span>
                ${payment.changeGiven ? `<span>Change: ${this.formatCurrency(payment.changeGiven)}</span>` : ''}
              </div>
            ` : ''}
          `).join('')}
        </div>
      </div>
    ` : '';

    const loyaltyHtml = receiptData.loyalty ? `
      <div class="loyalty-section">
        <div class="loyalty-header">
          <span class="loyalty-title">Loyalty Points</span>
          <span class="loyalty-tier">${this.escapeHtml(receiptData.loyalty.tier)}</span>
        </div>
        <div class="loyalty-details">
          <div class="loyalty-row">
            ${receiptData.loyalty.pointsEarned > 0 ? `
              <div class="loyalty-item">
                <span class="loyalty-label">Points Earned</span>
                <span class="points-earned">+${receiptData.loyalty.pointsEarned}</span>
              </div>
            ` : ''}
            ${receiptData.loyalty.pointsRedeemed > 0 ? `
              <div class="loyalty-item">
                <span class="loyalty-label">Points Redeemed</span>
                <span class="points-redeemed">-${receiptData.loyalty.pointsRedeemed}</span>
              </div>
            ` : ''}
            <div class="loyalty-item">
              <span class="loyalty-label">New Balance</span>
              <span class="loyalty-balance">${receiptData.loyalty.balanceAfter} pts</span>
            </div>
          </div>
          ${receiptData.loyalty.tierMultiplier > 1 ? `<div class="tier-bonus">${receiptData.loyalty.tierMultiplier}x tier bonus applied</div>` : ''}
          ${receiptData.loyalty.redemptionDiscount > 0 ? `<div class="redemption-discount">Points Discount Applied: -${this.formatCurrency(receiptData.loyalty.redemptionDiscount)}</div>` : ''}
        </div>
      </div>
    ` : '';

    const balanceHtml = receiptData.balance && receiptData.balance > 0 ? `
      <div class="balance-section" style="background: #fef2f2; border: 2px solid #ef4444; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <p style="margin: 0; font-size: 10px; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase; color: #ef4444;">REMAINING BALANCE</p>
            <p style="margin: 4px 0 0 0; font-size: 24px; font-weight: 700; color: #dc2626;">${this.formatCurrency(receiptData.balance)}</p>
          </div>
          <div style="background: #fee2e2; border-radius: 50%; width: 48px; height: 48px; display: flex; align-items: center; justify-content: center;">
            <span style="font-size: 24px; color: #dc2626;">!</span>
          </div>
        </div>
        <p style="margin: 8px 0 0 0; font-size: 12px; color: #991b1b;">This amount is outstanding and must be paid to complete the transaction.</p>
      </div>
    ` : '';

    const qrHtml = showQrCode ? `
      <div class="qr-section">
        <img src="${qrCodeUrl}" alt="Receipt QR Code" width="100" height="100" class="qr-image" />
        <p class="qr-hint">Scan to verify receipt</p>
      </div>
    ` : '';

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Receipt - ${this.escapeHtml(receiptData.receiptNumber)}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      line-height: 1.5;
      color: #1e293b;
      background: #f8fafc;
      padding: 40px;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .receipt-container {
      max-width: 800px;
      margin: 0 auto;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 48px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    }

    .text-right { text-align: right; }
    .text-muted { color: #94a3b8; }

    /* Header */
    .receipt-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 40px;
      padding-bottom: 24px;
      border-bottom: 1px solid #e2e8f0;
    }

    .receipt-title {
      font-size: 32px;
      font-weight: 300;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: #0f172a;
      margin-bottom: 8px;
    }

    .receipt-subtitle {
      font-size: 10px;
      font-weight: 600;
      letter-spacing: 0.2em;
      text-transform: uppercase;
      color: #94a3b8;
    }

    .info-grid {
      display: grid;
      grid-template-columns: auto auto;
      gap: 8px 32px;
      font-size: 12px;
    }

    .info-label {
      font-weight: 700;
      letter-spacing: 0.15em;
      text-transform: uppercase;
      color: #94a3b8;
    }

    .info-value {
      font-weight: 600;
      text-align: right;
      color: #0f172a;
    }

    /* Section Labels */
    .section-label {
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.25em;
      text-transform: uppercase;
      color: #94a3b8;
      margin-bottom: 12px;
      padding-bottom: 8px;
      border-bottom: 1px solid #f1f5f9;
      display: inline-block;
    }

    /* Store Section */
    .store-section {
      margin-bottom: 24px;
    }

    .store-info {
      color: #475569;
      line-height: 1.6;
    }

    .store-info p { margin: 0; }

    .store-name {
      font-weight: 600;
      font-size: 16px;
      color: #0f172a;
      margin-bottom: 4px !important;
    }

    /* Customer Section */
    .customer-section {
      margin-bottom: 32px;
    }

    .customer-info {
      color: #475569;
      line-height: 1.6;
    }

    .customer-info p { margin: 0; }

    .customer-name {
      font-weight: 600;
      font-size: 16px;
      color: #0f172a;
    }

    /* Items Table */
    .items-section {
      margin-bottom: 24px;
    }

    .items-table {
      width: 100%;
      border-collapse: collapse;
    }

    .items-table thead tr {
      border-bottom: 2px solid #0f172a;
    }

    .items-table th {
      padding: 16px 8px;
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.15em;
      text-transform: uppercase;
      color: #0f172a;
      text-align: left;
    }

    .items-table th.text-right { text-align: right; }

    .items-table tbody tr {
      border-bottom: 1px solid #f1f5f9;
    }

    .items-table td {
      padding: 20px 8px;
      vertical-align: top;
    }

    .item-description {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .item-name { color: #475569; }

    .imei-info {
      display: block;
      font-size: 0.75rem;
      color: #94a3b8;
      margin-top: 2px;
    }

    .tax-exempt-badge {
      font-size: 10px;
      color: #3b82f6;
      font-weight: 500;
    }

    .tax-info {
      font-size: 10px;
      color: #94a3b8;
    }

    .item-price, .item-qty { color: #475569; }

    .item-total {
      font-weight: 500;
      color: #0f172a;
    }

    /* Totals Section */
    .totals-section {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 40px;
    }

    .totals-wrapper {
      width: 280px;
    }

    .totals-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 6px 0;
    }

    .totals-label {
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: #94a3b8;
    }

    .totals-value {
      font-weight: 500;
      color: #0f172a;
    }

    .discount-row .totals-label,
    .discount-row .totals-value {
      color: #16a34a;
    }

    .totals-divider {
      height: 1px;
      background: #0f172a;
      margin: 16px 0;
    }

    .grand-total-row { padding: 0; }

    .grand-total-label {
      font-size: 12px;
      font-weight: 900;
      letter-spacing: 0.2em;
      text-transform: uppercase;
      color: #0f172a;
    }

    .grand-total-value {
      font-size: 28px;
      font-weight: 600;
      color: #0f172a;
      letter-spacing: -0.025em;
    }

    .savings-note {
      display: flex;
      justify-content: space-between;
      font-size: 12px;
      color: #94a3b8;
      margin-top: 8px;
    }

    .savings-amount {
      color: #16a34a;
      font-weight: 500;
    }

    /* Payment Section */
    .payment-section {
      background: #f8fafc;
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 24px;
    }

    .payment-details {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .payment-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }

    .payment-info {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .payment-method {
      font-weight: 500;
      color: #0f172a;
    }

    .card-last-four, .transaction-ref {
      font-size: 12px;
      color: #94a3b8;
    }

    .payment-amount {
      font-weight: 600;
      color: #0f172a;
    }

    .cash-details {
      display: flex;
      gap: 16px;
      font-size: 12px;
      color: #64748b;
      padding-left: 8px;
    }

    /* Loyalty Section */
    .loyalty-section {
      background: linear-gradient(135deg, #f3e7fa 0%, #e8f4fd 100%);
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 24px;
    }

    .loyalty-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }

    .loyalty-title {
      font-weight: 600;
      color: #7c3aed;
    }

    .loyalty-tier {
      font-size: 12px;
      font-weight: 500;
      background: white;
      padding: 4px 12px;
      border-radius: 16px;
      color: #7c3aed;
    }

    .loyalty-row {
      display: flex;
      flex-wrap: wrap;
      gap: 24px;
    }

    .loyalty-item {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .loyalty-label {
      font-size: 12px;
      color: #64748b;
    }

    .points-earned {
      color: #16a34a;
      font-weight: 600;
    }

    .points-redeemed {
      color: #7c3aed;
      font-weight: 600;
    }

    .loyalty-balance {
      font-weight: 700;
      color: #0f172a;
    }

    .tier-bonus {
      font-size: 12px;
      color: #7c3aed;
      margin-top: 8px;
    }

    .redemption-discount {
      font-weight: 600;
      color: #7c3aed;
      margin-top: 8px;
      padding-top: 8px;
      border-top: 1px solid rgba(124, 58, 237, 0.2);
    }

    /* QR Code Section */
    .qr-section {
      text-align: center;
      padding: 24px;
      background: #f8fafc;
      border-radius: 8px;
      margin-bottom: 24px;
    }

    .qr-image {
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .qr-hint {
      font-size: 12px;
      color: #94a3b8;
      margin-top: 12px;
    }

    /* Footer */
    .receipt-footer {
      border-top: 1px solid #f1f5f9;
      padding-top: 24px;
    }

    .footer-content {
      font-size: 14px;
      color: #64748b;
      line-height: 1.6;
    }

    .footer-content p {
      margin: 0 0 8px 0;
    }

    .receipt-notes {
      margin-top: 16px !important;
      padding-top: 12px;
      border-top: 1px solid #f1f5f9;
      color: #475569;
    }

    /* Print Styles */
    @media print {
      body {
        background: white;
        padding: 0;
      }

      .receipt-container {
        box-shadow: none;
        border: none;
        padding: 24px;
      }

      @page {
        size: A4;
        margin: 20mm;
      }
    }
  </style>
</head>
<body>
  <div class="receipt-container">
    <!-- Header -->
    <header class="receipt-header">
      <div>
        <h1 class="receipt-title">Sales Receipt</h1>
        <p class="receipt-subtitle">Transaction Record</p>
      </div>
      <div class="info-grid">
        <span class="info-label">Receipt #</span>
        <span class="info-value">${this.escapeHtml(receiptData.receiptNumber)}</span>
        <span class="info-label">Date</span>
        <span class="info-value">${this.escapeHtml(receiptData.transactionDate)}</span>
        <span class="info-label">Time</span>
        <span class="info-value">${this.escapeHtml(receiptData.transactionTime)}</span>
      </div>
    </header>

    <!-- Store Info -->
    <div class="store-section">
      <p class="section-label">From</p>
      <div class="store-info">
        <p class="store-name">${this.escapeHtml(this.storeConfig.name)}</p>
        <p>${this.escapeHtml(this.storeConfig.address)}</p>
        <p>Tel: ${this.escapeHtml(this.storeConfig.phone)}</p>
        <p>${this.escapeHtml(this.storeConfig.email)}</p>
      </div>
    </div>

    ${customerHtml}

    <!-- Items Table -->
    <div class="items-section">
      <table class="items-table">
        <thead>
          <tr>
            <th>Description</th>
            <th class="text-right">Unit Price</th>
            <th class="text-right">Qty</th>
            <th class="text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>
    </div>

    <!-- Totals -->
    <div class="totals-section">
      <div class="totals-wrapper">
        <div class="totals-row">
          <span class="totals-label">Subtotal</span>
          <span class="totals-value">${this.formatCurrency(receiptData.subtotal)}</span>
        </div>
        ${taxHtml}
        ${discountHtml}
        <div class="totals-divider"></div>
        <div class="totals-row grand-total-row">
          <span class="grand-total-label">Total</span>
          <span class="grand-total-value">${this.formatCurrency(receiptData.finalTotal ?? receiptData.grandTotal)}</span>
        </div>
        ${savingsHtml}
      </div>
    </div>

    ${paymentsHtml}
    ${balanceHtml}
    ${loyaltyHtml}
    ${qrHtml}

    <!-- Footer -->
    <footer class="receipt-footer">
      <p class="section-label">Terms & Notes</p>
      <div class="footer-content">
        <p>This document serves as a final proof of purchase. Please retain for your records.</p>
        <p>Thank you for your business. We appreciate your continued support.</p>
        ${receiptData.notes ? `<p class="receipt-notes"><strong>Note:</strong> ${this.escapeHtml(receiptData.notes)}</p>` : ''}
      </div>
    </footer>
  </div>

  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
        if (window.onafterprint !== undefined) {
          window.onafterprint = function() { window.close(); };
        } else {
          setTimeout(function() { window.close(); }, 1000);
        }
      }, 500);
    };
  </script>
</body>
</html>`;
  }

  /**
   * Generate QR code URL for a receipt
   */
  generateQrCodeUrl(receiptNumber: string, storeId?: string, size: number = 200): string {
    const effectiveStoreId = storeId || this.getStoreId();
    const lookupUrl = `${environment.siteUrl}/receipt/${encodeURIComponent(receiptNumber)}?store=${encodeURIComponent(effectiveStoreId)}`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(lookupUrl)}`;
  }

  /**
   * Get the store identifier for the current store
   */
  getStoreId(): string {
    return environment.storeId || 'DEFAULT';
  }

  /**
   * Generate PDF receipt with professional A4 layout
   */
  generatePdf(receiptData: ReceiptData, options: { showQrCode?: boolean } = {}): void {
    const { showQrCode = false } = options;

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    this.drawProfessionalPdfContent(doc, receiptData, showQrCode);

    // Save PDF
    const dateForFilename = receiptData.transactionDate.replace(/[^a-zA-Z0-9]/g, '-');
    const filename = `${receiptData.receiptNumber}_${dateForFilename}.pdf`;
    doc.save(filename);
  }

  /** @internal - kept for backward compat, old rendering removed */

  /**
   * Generate PDF as Blob for sharing via WhatsApp or Email
   */
  generatePdfBlob(receiptData: ReceiptData, options: { showQrCode?: boolean } = {}): Blob {
    const { showQrCode = true } = options;

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // Draw the same content as generatePdf (sync version without real QR)
    this.drawProfessionalPdfContent(doc, receiptData, showQrCode);

    return doc.output('blob');
  }

  /**
   * Generate PDF as Blob with embedded QR code (async version)
   */
  async generatePdfBlobAsync(receiptData: ReceiptData, options: { showQrCode?: boolean } = {}): Promise<Blob> {
    const { showQrCode = true } = options;

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // Fetch QR code if needed
    let qrImageData: string | null = null;
    if (showQrCode) {
      try {
        qrImageData = await this.fetchQrCodeAsBase64(receiptData.receiptNumber);
      } catch (e) {
        console.warn('Failed to fetch QR code:', e);
      }
    }

    // Draw content with real QR code
    this.drawProfessionalPdfContent(doc, receiptData, showQrCode, qrImageData);

    return doc.output('blob');
  }

  /**
   * Fetch QR code image and convert to base64 for PDF embedding
   */
  private async fetchQrCodeAsBase64(receiptNumber: string): Promise<string> {
    const qrUrl = this.generateQrCodeUrl(receiptNumber, undefined, 150);
    const response = await fetch(qrUrl);
    const blob = await response.blob();

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  /**
   * Get PDF as base64 data URL for embedding or sharing
   */
  generatePdfDataUrl(receiptData: ReceiptData, options: { showQrCode?: boolean } = {}): string {
    const { showQrCode = true } = options;

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    this.drawProfessionalPdfContent(doc, receiptData, showQrCode);

    return doc.output('dataurlstring');
  }

  /**
   * Helper method to draw PDF content (reusable for both save and blob generation)
   */
  private drawProfessionalPdfContent(doc: jsPDF, receiptData: ReceiptData, _showQrCode: boolean, _qrImageData?: string | null): void {
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);

    let yPos = margin;

    const primaryColor: [number, number, number] = [15, 23, 42];    // #0f172a
    const secondaryColor: [number, number, number] = [148, 163, 184]; // #94a3b8
    const textColor: [number, number, number] = [71, 85, 105];       // #475569
    const greenColor: [number, number, number] = [22, 163, 74];      // #16a34a
    const bgGray: [number, number, number] = [248, 250, 252];        // #f8fafc
    const darkBg: [number, number, number] = [30, 41, 59];           // #1e293b

    // ===== PAYMENT STATUS BADGE =====
    const isPartialPayment = receiptData.paymentStatus === 'partial_paid' || (receiptData.balance && receiptData.balance > 0);
    if (isPartialPayment) {
      doc.setFillColor(255, 247, 237); // orange-50
      doc.roundedRect(margin, yPos, 42, 6, 3, 3, 'F');
      doc.setFillColor(249, 115, 22); // orange-500
      doc.circle(margin + 3.5, yPos + 3, 1, 'F');
      doc.setFontSize(5.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(194, 65, 12); // orange-700
      doc.text('PARTIAL PAYMENT', margin + 6, yPos + 3.8);
    } else {
      doc.setFillColor(236, 253, 245); // emerald-50
      doc.roundedRect(margin, yPos, 42, 6, 3, 3, 'F');
      doc.setFillColor(34, 197, 94); // emerald-500
      doc.circle(margin + 3.5, yPos + 3, 1, 'F');
      doc.setFontSize(5.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(21, 128, 61); // emerald-700
      doc.text('PAYMENT COMPLETED', margin + 6, yPos + 3.8);
    }
    yPos += 12;

    // ===== SALES RECEIPT TITLE =====
    doc.setFontSize(28);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...primaryColor);
    doc.text('Sales Receipt', margin, yPos);
    yPos += 10;

    // ===== DATE & RECEIPT # =====
    const metaStartY = yPos;
    doc.setFontSize(5.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...secondaryColor);
    doc.text('DATE ISSUED', margin, yPos);
    yPos += 4;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...textColor);
    doc.text(receiptData.transactionDate, margin, yPos);

    // Receipt number next to date
    const receiptNumX = margin + 50;
    doc.setFontSize(5.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...secondaryColor);
    doc.text('RECEIPT NUMBER', receiptNumX, metaStartY);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...textColor);
    doc.text(`#${receiptData.receiptNumber}`, receiptNumX, metaStartY + 4);

    // ===== BILL FROM / BILL TO (right side) =====
    const rightX = margin + contentWidth * 0.6;
    let rightY = margin;

    // Bill From
    doc.setFontSize(5.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...secondaryColor);
    doc.text('BILL FROM', rightX, rightY);
    rightY += 4;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...primaryColor);
    doc.text(this.storeConfig.name, rightX, rightY);
    rightY += 4;

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...textColor);
    doc.text(this.storeConfig.address, rightX, rightY);
    rightY += 3.5;
    doc.text(`Tel: ${this.storeConfig.phone}`, rightX, rightY);
    rightY += 7;

    // Bill To
    if (receiptData.customerName || receiptData.customerPhone || receiptData.customerEmail) {
      doc.setFontSize(5.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...secondaryColor);
      doc.text('BILL TO', rightX, rightY);
      rightY += 4;

      if (receiptData.customerName) {
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...primaryColor);
        doc.text(receiptData.customerName, rightX, rightY);
        rightY += 4;
      }

      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...textColor);
      if (receiptData.customerPhone) {
        doc.text(`Tel: ${receiptData.customerPhone}`, rightX, rightY);
        rightY += 3.5;
      }
      if (receiptData.customerEmail) {
        doc.text(receiptData.customerEmail, rightX, rightY);
        rightY += 3.5;
      }
    }

    yPos = Math.max(yPos + 8, rightY + 5);

    // ===== ITEMS TABLE =====
    // Table header background
    doc.setFillColor(...bgGray);
    doc.rect(margin, yPos, contentWidth, 8, 'F');
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.setLineWidth(0.3);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    doc.line(margin, yPos + 8, pageWidth - margin, yPos + 8);

    const colWidths = {
      description: contentWidth * 0.48,
      qty: contentWidth * 0.12,
      unitPrice: contentWidth * 0.20,
      total: contentWidth * 0.20
    };

    const headerY = yPos + 5.5;
    doc.setFontSize(5.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...secondaryColor);
    doc.text('DESCRIPTION', margin + 3, headerY);
    doc.text('QTY', margin + colWidths.description + colWidths.qty / 2, headerY, { align: 'center' });
    doc.text('UNIT PRICE', margin + colWidths.description + colWidths.qty + colWidths.unitPrice, headerY, { align: 'right' });
    doc.text('TOTAL', pageWidth - margin - 3, headerY, { align: 'right' });

    yPos += 8;

    // Table rows
    doc.setFont('helvetica', 'normal');
    receiptData.items.forEach(item => {
      yPos += 4;

      // Item name (bold)
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...primaryColor);
      const nameLines = doc.splitTextToSize(item.name, colWidths.description - 8);
      doc.text(nameLines, margin + 3, yPos);

      // IMEI sub-line
      let subY = yPos + (nameLines.length * 4);
      if (item.imei) {
        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...secondaryColor);
        doc.text(`IMEI: ${item.imei}`, margin + 3, subY);
        subY += 3.5;
      }

      // QTY
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...textColor);
      doc.text(item.quantity.toString(), margin + colWidths.description + colWidths.qty / 2, yPos, { align: 'center' });

      // Unit price
      doc.text(this.formatCurrency(item.unitPrice), margin + colWidths.description + colWidths.qty + colWidths.unitPrice, yPos, { align: 'right' });

      // Total
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...primaryColor);
      doc.text(this.formatCurrency(item.total), pageWidth - margin - 3, yPos, { align: 'right' });

      const rowHeight = Math.max((nameLines.length * 4) + (item.imei ? 3.5 : 0), 6) + 4;
      yPos += rowHeight;

      // Row divider
      doc.setDrawColor(241, 245, 249);
      doc.setLineWidth(0.2);
      doc.line(margin, yPos, pageWidth - margin, yPos);
    });

    yPos += 10;

    // ===== BOTTOM SECTION: Notes (left) + Totals (right) =====
    const totalsX = margin + contentWidth * 0.55;
    const totalsWidth = contentWidth * 0.45;
    const totalsStartY = yPos;

    // --- TOTALS (right side) ---
    // Subtotal
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...textColor);
    doc.text('Subtotal', totalsX, yPos);
    doc.setTextColor(...primaryColor);
    doc.setFont('helvetica', 'bold');
    doc.text(this.formatCurrency(receiptData.subtotal), pageWidth - margin, yPos, { align: 'right' });
    yPos += 6;

    // Discount
    if (receiptData.discount) {
      doc.setTextColor(...greenColor);
      doc.setFont('helvetica', 'normal');
      const discountLabel = receiptData.discount.couponCode
        ? `Discount (${receiptData.discount.couponCode})`
        : 'Discount';
      doc.text(discountLabel, totalsX, yPos);
      doc.setFont('helvetica', 'bold');
      doc.text(`-${this.formatCurrency(receiptData.discount.discountAmount)}`, pageWidth - margin, yPos, { align: 'right' });
      yPos += 6;
    }

    // Tax
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...textColor);
    const taxLabel = `Tax (${receiptData.taxRate.toFixed(0)}%)`;
    doc.text(taxLabel, totalsX, yPos);
    doc.setTextColor(...primaryColor);
    doc.setFont('helvetica', 'bold');
    doc.text(this.formatCurrency(receiptData.taxAmount), pageWidth - margin, yPos, { align: 'right' });
    yPos += 4;

    // Divider
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(totalsX, yPos, pageWidth - margin, yPos);
    yPos += 5;

    // ===== GRAND TOTAL DARK BLOCK =====
    const totalBlockHeight = 22;
    const totalBlockWidth = totalsWidth;
    const totalBlockX = totalsX;

    // Calculate actual amount paid from payments
    const actualAmountPaid = receiptData.payments && receiptData.payments.length > 0
      ? receiptData.payments.reduce((sum, p) => sum + (p.amount || 0), 0)
      : receiptData.finalTotal ?? receiptData.grandTotal;
    const billTotal = receiptData.finalTotal ?? receiptData.grandTotal;
    const showAsPaid = !isPartialPayment;

    doc.setFillColor(...darkBg);
    doc.roundedRect(totalBlockX, yPos, totalBlockWidth, totalBlockHeight, 3, 3, 'F');

    // Label changes based on payment status
    doc.setFontSize(5.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255, 0.7);
    doc.text(showAsPaid ? 'TOTAL AMOUNT PAID' : 'AMOUNT PAID', totalBlockX + 6, yPos + 7);

    // PKR + Amount - show actual paid amount
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255, 0.8);
    doc.text('PKR', totalBlockX + 6, yPos + 15);

    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text(
      this.formatCurrency(showAsPaid ? billTotal : actualAmountPaid),
      totalBlockX + 18,
      yPos + 16
    );

    const totalsEndY = yPos + totalBlockHeight + 5;

    // --- NOTES (left side, drawn at same vertical position as totals) ---
    let notesY = totalsStartY;
    const notesMaxWidth = contentWidth * 0.50;

    if (receiptData.notes) {
      // Dashed border box
      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.3);
      // We'll just draw a simple rounded rect for the notes
      const noteLines = doc.splitTextToSize(receiptData.notes, notesMaxWidth - 12);
      const noteBoxHeight = Math.max(noteLines.length * 4 + 14, 20);
      doc.setLineDashPattern([2, 2], 0);
      doc.roundedRect(margin, notesY, notesMaxWidth, noteBoxHeight, 3, 3, 'S');
      doc.setLineDashPattern([], 0);

      doc.setFontSize(5.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...secondaryColor);
      doc.text('CUSTOMER NOTES', margin + 6, notesY + 6);

      doc.setFontSize(8);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(...textColor);
      doc.text(noteLines, margin + 6, notesY + 12);
      notesY += noteBoxHeight + 5;
    }

    // Payment details
    if (receiptData.payments && receiptData.payments.length > 0) {
      const paymentBoxY = notesY;

      // Calculate box height accounting for cash tendered/change lines
      let payBoxContentHeight = 0;
      receiptData.payments.forEach(payment => {
        payBoxContentHeight += 5;
        if (payment.cashTendered && payment.cashTendered > payment.amount) {
          payBoxContentHeight += 4;
        }
      });
      const payBoxHeight = payBoxContentHeight + 12;

      doc.setLineDashPattern([2, 2], 0);
      doc.setDrawColor(203, 213, 225);
      doc.roundedRect(margin, paymentBoxY, notesMaxWidth, payBoxHeight, 3, 3, 'S');
      doc.setLineDashPattern([], 0);

      doc.setFontSize(5.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...secondaryColor);
      doc.text(receiptData.payments.length > 1 ? 'PAYMENTS' : 'PAYMENT METHOD', margin + 6, paymentBoxY + 6);

      let payY = paymentBoxY + 11;
      receiptData.payments.forEach(payment => {
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...textColor);
        const label = (PaymentMethodLabels as Record<string, string>)[payment.method] || payment.method;
        doc.text(label, margin + 6, payY);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...primaryColor);
        doc.text(this.formatCurrency(payment.amount), margin + notesMaxWidth - 6, payY, { align: 'right' });
        payY += 5;
        // Cash tendered & change details
        if (payment.cashTendered && payment.cashTendered > payment.amount) {
          doc.setFontSize(7);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(100, 116, 139); // slate-500
          doc.text(`Tendered: ${this.formatCurrency(payment.cashTendered)}`, margin + 10, payY);
          const changeAmt = payment.changeGiven ?? (payment.cashTendered - payment.amount);
          doc.text(`Change: ${this.formatCurrency(changeAmt)}`, margin + notesMaxWidth - 6, payY, { align: 'right' });
          payY += 4;
        }
      });
      notesY = paymentBoxY + payBoxHeight + 5;
    }

    yPos = Math.max(totalsEndY, notesY) + 5;

    // ===== REMAINING BALANCE BLOCK =====
    if (receiptData.balance && receiptData.balance > 0) {
      const balanceBlockHeight = 16;
      doc.setFillColor(254, 242, 242); // red-50
      doc.setDrawColor(239, 68, 68); // red-500
      doc.setLineWidth(0.5);
      doc.roundedRect(margin, yPos, contentWidth, balanceBlockHeight, 3, 3, 'FD');

      doc.setFontSize(5.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(239, 68, 68);
      doc.text('REMAINING BALANCE', margin + 6, yPos + 5);

      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(220, 38, 38); // red-600
      doc.text(this.formatCurrency(receiptData.balance), margin + 6, yPos + 12);

      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(153, 27, 27); // red-800
      doc.text('This amount is outstanding', pageWidth - margin - 6, yPos + 10, { align: 'right' });

      yPos += balanceBlockHeight + 5;
    }

    // ===== FOOTER =====
    doc.setDrawColor(241, 245, 249);
    doc.setLineWidth(0.3);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 8;

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text('Thank you for your business. This document serves as proof of purchase.', margin, yPos);
  }

  private formatDate(date: Date): string {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  private formatTime(date: Date): string {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  }

  private formatCurrency(value: number): string {
    return this.currencyService.format(value, { minDecimals: 2, maxDecimals: 2 });
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  private getPaymentMethodLabel(method: PaymentMethod): string {
    return PaymentMethodLabels[method] || method;
  }

  getStoreConfig(): StoreConfig {
    return { ...this.storeConfig };
  }

  formatReceiptForWhatsApp(receiptData: ReceiptData): WhatsAppReceiptMessage {
    const lines: string[] = [];

    lines.push(`🧾 *${this.storeConfig.name}*`);
    lines.push('');
    lines.push(`📍 ${this.storeConfig.address}`);
    lines.push(`📞 ${this.storeConfig.phone}`);
    lines.push(`📧 ${this.storeConfig.email}`);
    lines.push('');
    lines.push('━━━━━━━━━━━━━━━━━━━━━');
    lines.push(`*Receipt #${receiptData.receiptNumber}*`);
    lines.push(`📅 ${receiptData.transactionDate}`);
    lines.push(`🕐 ${receiptData.transactionTime}`);
    lines.push('━━━━━━━━━━━━━━━━━━━━━');
    lines.push('');
    lines.push('*Items:*');

    receiptData.items.forEach(item => {
      lines.push(`• ${item.name}`);
      if (item.imei) {
        lines.push(`  IMEI: ${item.imei}`);
      }
      lines.push(`  Qty: ${item.quantity} × ${this.formatCurrency(item.unitPrice)} = ${this.formatCurrency(item.total)}`);
    });

    lines.push('');
    lines.push('━━━━━━━━━━━━━━━━━━━━━');
    lines.push(`Subtotal: ${this.formatCurrency(receiptData.subtotal)}`);

    if (receiptData.taxAmount > 0) {
      lines.push(`Tax (${receiptData.taxRate.toFixed(1)}%): ${this.formatCurrency(receiptData.taxAmount)}`);
    }

    if (receiptData.discount) {
      const discountLabel = receiptData.discount.couponCode
        ? `🏷️ Discount (${receiptData.discount.couponCode})`
        : '🏷️ Discount';
      lines.push(`${discountLabel}: -${this.formatCurrency(receiptData.discount.discountAmount)}`);
    }

    lines.push('');
    lines.push(`*💰 TOTAL: ${this.formatCurrency(receiptData.finalTotal ?? receiptData.grandTotal)}*`);

    if (receiptData.discount) {
      lines.push(`✨ You saved: ${this.formatCurrency(receiptData.discount.discountAmount)}!`);
    }

    if (receiptData.balance && receiptData.balance > 0) {
      lines.push('');
      lines.push(`⚠️ *REMAINING BALANCE: ${this.formatCurrency(receiptData.balance)}*`);
      lines.push('This amount is outstanding and must be paid.');
    }
    lines.push('━━━━━━━━━━━━━━━━━━━━━');

    if (receiptData.payments && receiptData.payments.length > 0) {
      lines.push('');
      lines.push(`*${receiptData.payments.length > 1 ? 'Payments' : 'Payment'}:*`);
      receiptData.payments.forEach(payment => {
        let paymentLine = `💳 ${this.getPaymentMethodLabel(payment.method)}: ${this.formatCurrency(payment.amount)}`;
        if (payment.cardLastFour) {
          paymentLine += ` (****${payment.cardLastFour})`;
        }
        lines.push(paymentLine);
        if (payment.cashTendered && payment.cashTendered > payment.amount) {
          const changeAmt = payment.changeGiven ?? (payment.cashTendered - payment.amount);
          lines.push(`   💵 Tendered: ${this.formatCurrency(payment.cashTendered)} | Change: ${this.formatCurrency(changeAmt)}`);
        }
      });
      lines.push('━━━━━━━━━━━━━━━━━━━━━');
    }

    if (receiptData.loyalty) {
      lines.push('');
      lines.push(`*🎫 Loyalty Points (${receiptData.loyalty.tier}):*`);
      if (receiptData.loyalty.pointsEarned > 0) {
        lines.push(`   Points Earned: +${receiptData.loyalty.pointsEarned}`);
      }
      if (receiptData.loyalty.pointsRedeemed > 0) {
        lines.push(`   Points Redeemed: -${receiptData.loyalty.pointsRedeemed}`);
      }
      lines.push(`   New Balance: *${receiptData.loyalty.balanceAfter} pts*`);
      lines.push('━━━━━━━━━━━━━━━━━━━━━');
    }

    lines.push('');
    lines.push('Thank you for your purchase! 🙏');
    lines.push('Keep this receipt for your records.');

    // Add QR code link for receipt verification
    const receiptUrl = `${environment.siteUrl}/receipt/${encodeURIComponent(receiptData.receiptNumber)}`;
    lines.push('');
    lines.push(`🔗 Verify receipt: ${receiptUrl}`);

    const message = lines.join('\n');

    return {
      message,
      receiptNumber: receiptData.receiptNumber,
      customerPhone: receiptData.customerPhone,
      grandTotal: receiptData.grandTotal,
      itemCount: receiptData.items.length
    };
  }

  generateWhatsAppLink(phoneNumber: string, message: string): string {
    let cleanedPhone = phoneNumber.replace(/[^\d]/g, '');
    // Convert Pakistani local format (0xxx) to international format (92xxx)
    if (cleanedPhone.startsWith('0')) {
      cleanedPhone = '92' + cleanedPhone.substring(1);
    }
    const encodedMessage = encodeURIComponent(message);
    return `https://wa.me/${cleanedPhone}?text=${encodedMessage}`;
  }

  isValidWhatsAppNumber(phoneNumber: string | null | undefined): boolean {
    if (!phoneNumber) return false;
    const cleanedPhone = phoneNumber.replace(/[^\d+]/g, '');
    return cleanedPhone.length >= 10 && cleanedPhone.length <= 15;
  }
}
