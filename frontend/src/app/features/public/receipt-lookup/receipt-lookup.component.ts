import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { SkeletonModule } from 'primeng/skeleton';
import { DividerModule } from 'primeng/divider';
import { TagModule } from 'primeng/tag';
import { MessageModule } from 'primeng/message';

import { ReceiptBarcodeService, ReceiptLookupResponse } from '../../../core/services/receipt-barcode.service';
import { AppCurrencyPipe } from '../../../shared/pipes/app-currency.pipe';
import { ShopDetailsService } from '../../../core/services/shop-details.service';

/**
 * Receipt Lookup Component
 * Public page for viewing receipt details via QR code scan
 * Feature: F-017 Barcode/QR Code on Receipts
 *
 * This page is accessible without authentication and shows limited receipt
 * information for customer verification purposes.
 */
@Component({
  selector: 'app-receipt-lookup',
  imports: [
    CommonModule,
    RouterLink,
    CardModule,
    ButtonModule,
    SkeletonModule,
    DividerModule,
    TagModule,
    MessageModule,
    AppCurrencyPipe
  ],
  templateUrl: './receipt-lookup.component.html',
  styleUrls: ['./receipt-lookup.component.scss']
})
export class ReceiptLookupComponent implements OnInit {
  constructor(
    private route: ActivatedRoute,
    private receiptBarcodeService: ReceiptBarcodeService,
    private shopDetailsService: ShopDetailsService
  ) { }

  loading = signal(true);
  error = signal<string | null>(null);
  lookupResult = signal<ReceiptLookupResponse | null>(null);
  receiptNumber = signal<string>('');

  storeName = this.shopDetailsService.shopName;
  storeAddress = this.shopDetailsService.address;
  storePhone = this.shopDetailsService.phoneDisplay;
  storePhoneLink = this.shopDetailsService.phoneLink;

  ngOnInit(): void {
    const receiptNum = this.route.snapshot.paramMap.get('receiptNumber');
    if (receiptNum) {
      this.receiptNumber.set(receiptNum);
      this.lookupReceipt(receiptNum);
    } else {
      this.loading.set(false);
      this.error.set('No receipt number provided');
    }
  }

  private async lookupReceipt(receiptNumber: string): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    try {
      const result = await this.receiptBarcodeService.lookupReceipt(receiptNumber);
      this.lookupResult.set(result);

      if (!result.success) {
        this.error.set(result.error || 'Failed to lookup receipt');
      }
    } catch (err) {
      this.error.set('An error occurred while looking up the receipt');
    } finally {
      this.loading.set(false);
    }
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  formatTime(timeStr: string): string {
    if (!timeStr) return '-';
    const [hours, minutes] = timeStr.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  }
}
