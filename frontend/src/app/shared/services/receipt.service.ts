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
    const { showQrCode = true } = options;

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);

    let yPos = margin;

    // Colors
    const primaryColor: [number, number, number] = [15, 23, 42]; // #0f172a
    const secondaryColor: [number, number, number] = [148, 163, 184]; // #94a3b8
    const textColor: [number, number, number] = [71, 85, 105]; // #475569
    const greenColor: [number, number, number] = [22, 163, 74]; // #16a34a

    // Header - Sales Receipt Title
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(28);
    doc.setTextColor(...primaryColor);
    doc.text('SALES RECEIPT', margin, yPos);
    yPos += 8;

    doc.setFontSize(8);
    doc.setTextColor(...secondaryColor);
    doc.text('TRANSACTION RECORD', margin, yPos);

    // Receipt Info (right side)
    const infoX = pageWidth - margin;
    let infoY = margin;
    doc.setFontSize(8);

    doc.setTextColor(...secondaryColor);
    doc.setFont('helvetica', 'bold');
    doc.text('RECEIPT #', infoX - 50, infoY, { align: 'left' });
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...primaryColor);
    doc.text(receiptData.receiptNumber, infoX, infoY, { align: 'right' });
    infoY += 5;

    doc.setTextColor(...secondaryColor);
    doc.setFont('helvetica', 'bold');
    doc.text('DATE', infoX - 50, infoY, { align: 'left' });
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...primaryColor);
    doc.text(receiptData.transactionDate, infoX, infoY, { align: 'right' });
    infoY += 5;

    doc.setTextColor(...secondaryColor);
    doc.setFont('helvetica', 'bold');
    doc.text('TIME', infoX - 50, infoY, { align: 'left' });
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...primaryColor);
    doc.text(receiptData.transactionTime, infoX, infoY, { align: 'right' });

    yPos += 15;

    // Header divider
    doc.setDrawColor(...primaryColor);
    doc.setLineWidth(0.3);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 10;

    // Store Info
    doc.setFontSize(7);
    doc.setTextColor(...secondaryColor);
    doc.setFont('helvetica', 'bold');
    doc.text('FROM', margin, yPos);
    yPos += 5;

    doc.setFontSize(11);
    doc.setTextColor(...primaryColor);
    doc.setFont('helvetica', 'bold');
    doc.text(this.storeConfig.name, margin, yPos);
    yPos += 5;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...textColor);
    doc.text(this.storeConfig.address, margin, yPos);
    yPos += 4;
    doc.text(`Tel: ${this.storeConfig.phone}`, margin, yPos);
    yPos += 4;
    doc.text(this.storeConfig.email, margin, yPos);
    yPos += 10;

    // Customer Info
    if (receiptData.customerName || receiptData.customerPhone || receiptData.customerEmail) {
      doc.setFontSize(7);
      doc.setTextColor(...secondaryColor);
      doc.setFont('helvetica', 'bold');
      doc.text('RECIPIENT', margin, yPos);
      yPos += 5;

      if (receiptData.customerName) {
        doc.setFontSize(11);
        doc.setTextColor(...primaryColor);
        doc.setFont('helvetica', 'bold');
        doc.text(receiptData.customerName, margin, yPos);
        yPos += 5;
      }

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...textColor);
      if (receiptData.customerPhone) {
        doc.text(`Tel: ${receiptData.customerPhone}`, margin, yPos);
        yPos += 4;
      }
      if (receiptData.customerEmail) {
        doc.text(receiptData.customerEmail, margin, yPos);
        yPos += 4;
      }
      yPos += 6;
    }

    // Items Table Header
    const colWidths = {
      description: contentWidth * 0.45,
      unitPrice: contentWidth * 0.18,
      qty: contentWidth * 0.12,
      amount: contentWidth * 0.25
    };

    yPos += 5;
    doc.setFontSize(7);
    doc.setTextColor(...primaryColor);
    doc.setFont('helvetica', 'bold');

    let colX = margin;
    doc.text('DESCRIPTION', colX, yPos);
    colX += colWidths.description;
    doc.text('UNIT PRICE', colX + colWidths.unitPrice, yPos, { align: 'right' });
    colX += colWidths.unitPrice;
    doc.text('QTY', colX + colWidths.qty, yPos, { align: 'right' });
    colX += colWidths.qty;
    doc.text('AMOUNT', colX + colWidths.amount, yPos, { align: 'right' });

    yPos += 2;
    doc.setDrawColor(...primaryColor);
    doc.setLineWidth(0.5);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 6;

    // Items
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);

    receiptData.items.forEach(item => {
      colX = margin;

      doc.setTextColor(...textColor);
      const nameLines = doc.splitTextToSize(item.name, colWidths.description - 5);
      doc.text(nameLines, colX, yPos);

      colX += colWidths.description;
      doc.text(this.formatCurrency(item.unitPrice), colX + colWidths.unitPrice, yPos, { align: 'right' });

      colX += colWidths.unitPrice;
      doc.text(item.quantity.toString(), colX + colWidths.qty, yPos, { align: 'right' });

      colX += colWidths.qty;
      doc.setTextColor(...primaryColor);
      doc.setFont('helvetica', 'bold');
      doc.text(this.formatCurrency(item.total), colX + colWidths.amount, yPos, { align: 'right' });
      doc.setFont('helvetica', 'normal');

      yPos += Math.max(nameLines.length * 4, 6);

      doc.setFontSize(9);
      yPos += 2;
    });

    // Divider before totals
    yPos += 3;
    doc.setDrawColor(241, 245, 249);
    doc.setLineWidth(0.3);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 10;

    // Totals (right aligned)
    const totalsX = pageWidth - margin - 60;

    doc.setFontSize(8);
    doc.setTextColor(...secondaryColor);
    doc.setFont('helvetica', 'bold');
    doc.text('SUBTOTAL', totalsX, yPos);
    doc.setTextColor(...primaryColor);
    doc.setFont('helvetica', 'normal');
    doc.text(this.formatCurrency(receiptData.subtotal), pageWidth - margin, yPos, { align: 'right' });
    yPos += 5;

    // Discount
    if (receiptData.discount) {
      doc.setTextColor(...greenColor);
      doc.setFont('helvetica', 'bold');
      const discountLabel = receiptData.discount.couponCode
        ? `DISCOUNT (${receiptData.discount.couponCode})`
        : 'DISCOUNT';
      doc.text(discountLabel, totalsX, yPos);
      doc.text(`-${this.formatCurrency(receiptData.discount.discountAmount)}`, pageWidth - margin, yPos, { align: 'right' });
      yPos += 5;
    }

    // Total divider
    yPos += 3;
    doc.setDrawColor(...primaryColor);
    doc.setLineWidth(0.5);
    doc.line(totalsX - 5, yPos, pageWidth - margin, yPos);
    yPos += 8;

    // Grand Total
    doc.setFontSize(9);
    doc.setTextColor(...primaryColor);
    doc.setFont('helvetica', 'bold');
    doc.text('TOTAL', totalsX, yPos);
    doc.setFontSize(18);
    doc.text(this.formatCurrency(receiptData.finalTotal ?? receiptData.grandTotal), pageWidth - margin, yPos, { align: 'right' });
    yPos += 8;

    // Savings note
    if (receiptData.discount) {
      doc.setFontSize(8);
      doc.setTextColor(...greenColor);
      doc.text(`You saved ${this.formatCurrency(receiptData.discount.discountAmount)}!`, pageWidth - margin, yPos, { align: 'right' });
      yPos += 5;
    }

    yPos += 10;

    // Payment Details
    if (receiptData.payments && receiptData.payments.length > 0) {
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(margin, yPos, contentWidth, 20 + (receiptData.payments.length * 8), 3, 3, 'F');

      yPos += 6;
      doc.setFontSize(7);
      doc.setTextColor(...secondaryColor);
      doc.setFont('helvetica', 'bold');
      doc.text(receiptData.payments.length > 1 ? 'PAYMENTS' : 'PAYMENT METHOD', margin + 5, yPos);
      yPos += 6;

      doc.setFontSize(9);
      receiptData.payments.forEach(payment => {
        doc.setTextColor(...primaryColor);
        doc.setFont('helvetica', 'normal');
        doc.text(this.getPaymentMethodLabel(payment.method), margin + 5, yPos);
        doc.setFont('helvetica', 'bold');
        doc.text(this.formatCurrency(payment.amount), pageWidth - margin - 5, yPos, { align: 'right' });

        if (payment.cardLastFour) {
          doc.setFontSize(7);
          doc.setTextColor(...secondaryColor);
          doc.setFont('helvetica', 'normal');
          doc.text(`****${payment.cardLastFour}`, margin + 5, yPos + 4);
          yPos += 4;
        }
        yPos += 6;
      });
      yPos += 8;
    }

    // QR Code
    if (showQrCode) {
      const qrSize = 25;
      const qrX = (pageWidth - qrSize) / 2;

      doc.setFillColor(248, 250, 252);
      doc.roundedRect(qrX - 10, yPos, qrSize + 20, qrSize + 20, 3, 3, 'F');

      // QR code placeholder
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.3);
      doc.rect(qrX, yPos + 5, qrSize, qrSize);

      // QR pattern simulation
      doc.setFillColor(100, 100, 100);
      const gridStart = qrX + 3;
      const cellSize = (qrSize - 6) / 7;
      for (let i = 0; i < 7; i++) {
        for (let j = 0; j < 7; j++) {
          if ((i + j) % 2 === 0) {
            doc.rect(gridStart + i * cellSize, yPos + 8 + j * cellSize, cellSize - 0.5, cellSize - 0.5, 'F');
          }
        }
      }

      yPos += qrSize + 10;
      doc.setFontSize(7);
      doc.setTextColor(...secondaryColor);
      doc.text('Scan to verify receipt', pageWidth / 2, yPos, { align: 'center' });
      yPos += 15;
    }

    // Footer
    doc.setDrawColor(241, 245, 249);
    doc.setLineWidth(0.3);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 8;

    doc.setFontSize(7);
    doc.setTextColor(...secondaryColor);
    doc.setFont('helvetica', 'bold');
    doc.text('TERMS & NOTES', margin, yPos);
    yPos += 6;

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text('This document serves as a final proof of purchase. Please retain for your records.', margin, yPos);
    yPos += 4;
    doc.text('Thank you for your business. We appreciate your continued support.', margin, yPos);

    if (receiptData.notes) {
      yPos += 8;
      doc.setFont('helvetica', 'bold');
      doc.text('Note:', margin, yPos);
      doc.setFont('helvetica', 'normal');
      const noteLines = doc.splitTextToSize(receiptData.notes, contentWidth);
      doc.text(noteLines, margin + 10, yPos);
    }

    // Save PDF
    const dateForFilename = receiptData.transactionDate.replace(/[^a-zA-Z0-9]/g, '-');
    const filename = `${receiptData.receiptNumber}_${dateForFilename}.pdf`;
    doc.save(filename);
  }

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
  private drawProfessionalPdfContent(doc: jsPDF, receiptData: ReceiptData, showQrCode: boolean, qrImageData?: string | null): void {
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);
    const halfWidth = contentWidth / 2;

    let yPos = margin;

    const primaryColor: [number, number, number] = [15, 23, 42];
    const secondaryColor: [number, number, number] = [148, 163, 184];
    const textColor: [number, number, number] = [71, 85, 105];
    const greenColor: [number, number, number] = [22, 163, 74];
    const accentColor: [number, number, number] = [59, 130, 246]; // Blue for color highlight

    // Header
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(28);
    doc.setTextColor(...primaryColor);
    doc.text('SALES RECEIPT', margin, yPos);
    yPos += 8;

    doc.setFontSize(8);
    doc.setTextColor(...secondaryColor);
    doc.text('TRANSACTION RECORD', margin, yPos);

    // Receipt Info (right side)
    const infoX = pageWidth - margin;
    let infoY = margin;
    doc.setFontSize(8);

    doc.setTextColor(...secondaryColor);
    doc.setFont('helvetica', 'bold');
    doc.text('RECEIPT #', infoX - 50, infoY, { align: 'left' });
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...primaryColor);
    doc.text(receiptData.receiptNumber, infoX, infoY, { align: 'right' });
    infoY += 5;

    doc.setTextColor(...secondaryColor);
    doc.setFont('helvetica', 'bold');
    doc.text('DATE', infoX - 50, infoY, { align: 'left' });
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...primaryColor);
    doc.text(receiptData.transactionDate, infoX, infoY, { align: 'right' });
    infoY += 5;

    doc.setTextColor(...secondaryColor);
    doc.setFont('helvetica', 'bold');
    doc.text('TIME', infoX - 50, infoY, { align: 'left' });
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...primaryColor);
    doc.text(receiptData.transactionTime, infoX, infoY, { align: 'right' });

    yPos += 15;

    doc.setDrawColor(...primaryColor);
    doc.setLineWidth(0.3);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 10;

    // FROM and RECIPIENT side by side
    const fromX = margin;
    const toX = margin + halfWidth + 10;
    const sectionStartY = yPos;

    // FROM (left side)
    doc.setFontSize(7);
    doc.setTextColor(...secondaryColor);
    doc.setFont('helvetica', 'bold');
    doc.text('FROM', fromX, yPos);

    let fromY = yPos + 5;
    doc.setFontSize(11);
    doc.setTextColor(...primaryColor);
    doc.setFont('helvetica', 'bold');
    doc.text(this.storeConfig.name, fromX, fromY);
    fromY += 5;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...textColor);
    doc.text(this.storeConfig.address, fromX, fromY);
    fromY += 4;
    doc.text(`Tel: ${this.storeConfig.phone}`, fromX, fromY);
    fromY += 4;
    doc.text(this.storeConfig.email, fromX, fromY);

    // TO / RECIPIENT (right side) - if customer info exists
    let toY = sectionStartY;
    if (receiptData.customerName || receiptData.customerPhone || receiptData.customerEmail) {
      doc.setFontSize(7);
      doc.setTextColor(...secondaryColor);
      doc.setFont('helvetica', 'bold');
      doc.text('TO', toX, toY);

      toY += 5;
      if (receiptData.customerName) {
        doc.setFontSize(11);
        doc.setTextColor(...primaryColor);
        doc.setFont('helvetica', 'bold');
        doc.text(receiptData.customerName, toX, toY);
        toY += 5;
      }

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...textColor);
      if (receiptData.customerPhone) {
        doc.text(`Tel: ${receiptData.customerPhone}`, toX, toY);
        toY += 4;
      }
      if (receiptData.customerEmail) {
        doc.text(receiptData.customerEmail, toX, toY);
        toY += 4;
      }
    }

    // Move yPos to after both sections
    yPos = Math.max(fromY, toY) + 10;

    // Items Table
    const colWidths = {
      description: contentWidth * 0.45,
      unitPrice: contentWidth * 0.18,
      qty: contentWidth * 0.12,
      amount: contentWidth * 0.25
    };

    yPos += 5;
    doc.setFontSize(7);
    doc.setTextColor(...primaryColor);
    doc.setFont('helvetica', 'bold');

    let colX = margin;
    doc.text('DESCRIPTION', colX, yPos);
    colX += colWidths.description;
    doc.text('UNIT PRICE', colX + colWidths.unitPrice, yPos, { align: 'right' });
    colX += colWidths.unitPrice;
    doc.text('QTY', colX + colWidths.qty, yPos, { align: 'right' });
    colX += colWidths.qty;
    doc.text('AMOUNT', colX + colWidths.amount, yPos, { align: 'right' });

    yPos += 2;
    doc.setDrawColor(...primaryColor);
    doc.setLineWidth(0.5);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 6;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);

    receiptData.items.forEach(item => {
      colX = margin;

      // Parse item name to highlight color
      const colorMatch = item.name.match(/\s+(Black|White|Blue|Red|Green|Gold|Silver|Pink|Purple|Yellow|Orange|Gray|Grey|Space Gray|Midnight|Starlight|Sierra Blue|Alpine Green|Deep Purple|Graphite|Pacific Blue)$/i);
      let mainName = item.name;
      let colorName = '';

      if (colorMatch) {
        mainName = item.name.substring(0, item.name.length - colorMatch[0].length);
        colorName = colorMatch[1];
      }

      doc.setTextColor(...textColor);
      const nameLines = doc.splitTextToSize(mainName, colWidths.description - 5);
      doc.text(nameLines, colX, yPos);

      // Add color on a new line with accent color
      let extraLines = 0;
      if (colorName) {
        const colorY = yPos + (nameLines.length * 4);
        doc.setFontSize(8);
        doc.setTextColor(...accentColor);
        doc.text(`Color: ${colorName}`, colX, colorY);
        doc.setFontSize(9);
        extraLines++;
      }

      // Add IMEI on a new line if present
      if (item.imei) {
        const imeiY = yPos + (nameLines.length * 4) + (colorName ? 4 : 0);
        doc.setFontSize(7);
        doc.setTextColor(...secondaryColor);
        doc.text(`IMEI: ${item.imei}`, colX, imeiY);
        doc.setFontSize(9);
        extraLines++;
      }

      colX += colWidths.description;
      doc.setTextColor(...textColor);
      doc.text(this.formatCurrency(item.unitPrice), colX + colWidths.unitPrice, yPos, { align: 'right' });

      colX += colWidths.unitPrice;
      doc.text(item.quantity.toString(), colX + colWidths.qty, yPos, { align: 'right' });

      colX += colWidths.qty;
      doc.setTextColor(...primaryColor);
      doc.setFont('helvetica', 'bold');
      doc.text(this.formatCurrency(item.total), colX + colWidths.amount, yPos, { align: 'right' });
      doc.setFont('helvetica', 'normal');

      const extraHeight = extraLines * 4;
      yPos += Math.max(nameLines.length * 4, 6) + 2 + extraHeight;
    });

    yPos += 3;
    doc.setDrawColor(241, 245, 249);
    doc.setLineWidth(0.3);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 10;

    // Totals
    const totalsX = pageWidth - margin - 60;

    doc.setFontSize(8);
    doc.setTextColor(...secondaryColor);
    doc.setFont('helvetica', 'bold');
    doc.text('SUBTOTAL', totalsX, yPos);
    doc.setTextColor(...primaryColor);
    doc.setFont('helvetica', 'normal');
    doc.text(this.formatCurrency(receiptData.subtotal), pageWidth - margin, yPos, { align: 'right' });
    yPos += 5;

    if (receiptData.discount) {
      doc.setTextColor(...greenColor);
      doc.setFont('helvetica', 'bold');
      const discountLabel = receiptData.discount.couponCode
        ? `DISCOUNT (${receiptData.discount.couponCode})`
        : 'DISCOUNT';
      doc.text(discountLabel, totalsX, yPos);
      doc.text(`-${this.formatCurrency(receiptData.discount.discountAmount)}`, pageWidth - margin, yPos, { align: 'right' });
      yPos += 5;
    }

    yPos += 3;
    doc.setDrawColor(...primaryColor);
    doc.setLineWidth(0.5);
    doc.line(totalsX - 5, yPos, pageWidth - margin, yPos);
    yPos += 8;

    doc.setFontSize(9);
    doc.setTextColor(...primaryColor);
    doc.setFont('helvetica', 'bold');
    doc.text('TOTAL', totalsX, yPos);
    doc.setFontSize(18);
    doc.text(this.formatCurrency(receiptData.finalTotal ?? receiptData.grandTotal), pageWidth - margin, yPos, { align: 'right' });
    yPos += 15;

    // QR Code
    if (showQrCode) {
      const qrSize = 25;
      const qrX = (pageWidth - qrSize) / 2;

      // Background box
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(qrX - 10, yPos, qrSize + 20, qrSize + 20, 3, 3, 'F');

      if (qrImageData) {
        // Embed actual QR code image
        try {
          doc.addImage(qrImageData, 'PNG', qrX, yPos + 5, qrSize, qrSize);
        } catch (e) {
          // Fallback to placeholder if image fails
          this.drawQrPlaceholder(doc, qrX, yPos + 5, qrSize);
        }
      } else {
        // Draw placeholder pattern
        this.drawQrPlaceholder(doc, qrX, yPos + 5, qrSize);
      }

      yPos += qrSize + 10;
      doc.setFontSize(7);
      doc.setTextColor(...secondaryColor);
      doc.text('Scan to verify receipt', pageWidth / 2, yPos, { align: 'center' });
      yPos += 15;
    }

    // Footer
    doc.setDrawColor(241, 245, 249);
    doc.setLineWidth(0.3);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 8;

    doc.setFontSize(7);
    doc.setTextColor(...secondaryColor);
    doc.setFont('helvetica', 'bold');
    doc.text('TERMS & NOTES', margin, yPos);
    yPos += 6;

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text('This document serves as a final proof of purchase. Please retain for your records.', margin, yPos);
    yPos += 4;
    doc.text('Thank you for your business. We appreciate your continued support.', margin, yPos);
  }

  /**
   * Draw a placeholder QR pattern when actual QR code is not available
   */
  private drawQrPlaceholder(doc: jsPDF, x: number, y: number, size: number): void {
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    doc.rect(x, y, size, size);

    doc.setFillColor(50, 50, 50);
    const cellSize = size / 7;

    // Draw corner squares (QR finder patterns)
    const drawFinderPattern = (startX: number, startY: number) => {
      // Outer square
      doc.setFillColor(50, 50, 50);
      doc.rect(startX, startY, cellSize * 3, cellSize * 3, 'F');
      // Inner white
      doc.setFillColor(255, 255, 255);
      doc.rect(startX + cellSize * 0.5, startY + cellSize * 0.5, cellSize * 2, cellSize * 2, 'F');
      // Center dot
      doc.setFillColor(50, 50, 50);
      doc.rect(startX + cellSize, startY + cellSize, cellSize, cellSize, 'F');
    };

    drawFinderPattern(x + cellSize * 0.5, y + cellSize * 0.5);
    drawFinderPattern(x + cellSize * 3.5, y + cellSize * 0.5);
    drawFinderPattern(x + cellSize * 0.5, y + cellSize * 3.5);

    // Add some random-looking data modules
    doc.setFillColor(50, 50, 50);
    const dataPositions = [
      [4, 4], [5, 4], [4, 5], [6, 5], [5, 6], [4, 3], [6, 3]
    ];
    dataPositions.forEach(([col, row]) => {
      doc.rect(x + col * cellSize, y + row * cellSize, cellSize * 0.8, cellSize * 0.8, 'F');
    });
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
    const cleanedPhone = phoneNumber.replace(/[^\d]/g, '');
    const encodedMessage = encodeURIComponent(message);
    return `https://wa.me/${cleanedPhone}?text=${encodedMessage}`;
  }

  isValidWhatsAppNumber(phoneNumber: string | null | undefined): boolean {
    if (!phoneNumber) return false;
    const cleanedPhone = phoneNumber.replace(/[^\d+]/g, '');
    return cleanedPhone.length >= 10 && cleanedPhone.length <= 15;
  }
}
