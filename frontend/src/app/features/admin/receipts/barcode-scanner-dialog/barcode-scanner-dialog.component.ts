import { Component, inject, input, output, signal, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { CardModule } from 'primeng/card';
import { DividerModule } from 'primeng/divider';
import { SkeletonModule } from 'primeng/skeleton';
import { TagModule } from 'primeng/tag';
import { MessageModule } from 'primeng/message';
import { TooltipModule } from 'primeng/tooltip';
import { TabsModule } from 'primeng/tabs';

import { ReceiptBarcodeService, AdminReceiptLookupResult } from '../../../../core/services/receipt-barcode.service';
import { FocusManagementService } from '../../../../shared/services/focus-management.service';
import { BarcodeScannerComponent } from '../../../../shared/components/barcode-scanner/barcode-scanner.component';
import { BarcodeScanResult } from '../../../../core/services/barcode-scanner.service';
import { AppCurrencyPipe } from '../../../../shared/pipes/app-currency.pipe';

/**
 * Barcode Scanner Dialog Component
 * Allows admin to scan or enter receipt barcode/QR code for quick lookup
 * Feature: F-017 Barcode/QR Code on Receipts
 */
@Component({
  selector: 'app-barcode-scanner-dialog',
  imports: [
    CommonModule,
    FormsModule,
    DialogModule,
    ButtonModule,
    InputTextModule,
    IconFieldModule,
    InputIconModule,
    CardModule,
    DividerModule,
    SkeletonModule,
    TagModule,
    MessageModule,
    TooltipModule,
    TabsModule,
    DatePipe,
    AppCurrencyPipe,
    BarcodeScannerComponent
  ],
  templateUrl: './barcode-scanner-dialog.component.html'
})
export class BarcodeScannerDialogComponent implements OnChanges {
  private receiptBarcodeService = inject(ReceiptBarcodeService);
  private focusService = inject(FocusManagementService);

  visible = input<boolean>(false);
  visibleChange = output<boolean>();
  receiptSelected = output<string>();

  scannedCode = '';
  activeTab: 'manual' | 'camera' = 'manual';
  loading = signal(false);
  searched = signal(false);
  lookupResult = signal<AdminReceiptLookupResult | null>(null);
  lastSearchedCode = signal('');

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible'] && changes['visible'].currentValue === true) {
      this.onClear();
    }
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

  onClose(): void {
    this.visibleChange.emit(false);
  }

  async onLookup(): Promise<void> {
    const code = this.scannedCode.trim();
    if (!code) return;

    this.loading.set(true);
    this.searched.set(true);
    this.lastSearchedCode.set(code);

    try {
      const result = await this.receiptBarcodeService.adminLookupReceipt(code);
      this.lookupResult.set(result);
    } catch (err) {
      this.lookupResult.set({
        success: false,
        found: false,
        error: 'Failed to lookup receipt'
      });
    } finally {
      this.loading.set(false);
    }
  }

  onClear(): void {
    this.scannedCode = '';
    this.searched.set(false);
    this.lookupResult.set(null);
    this.lastSearchedCode.set('');
    this.activeTab = 'manual';
  }

  /**
   * Handle barcode/QR code scanned from camera
   * Feature: F-017 Barcode/QR Code on Receipts
   */
  async onCameraScanned(result: BarcodeScanResult): Promise<void> {
    const parsedCode = this.receiptBarcodeService.parseScannedCode(result.rawValue);
    if (parsedCode) {
      this.scannedCode = parsedCode.receiptNumber;
      this.activeTab = 'manual';
      await this.onLookup();
    }
  }

  onViewReceipt(): void {
    const result = this.lookupResult();
    if (result?.found && result.receipt) {
      this.receiptSelected.emit(result.receipt.id);
      this.onClose();
    }
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
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
