import { Component, signal, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { BarcodeScannerComponent } from '../../../../shared/components/barcode-scanner/barcode-scanner.component';
import { ProductService } from '../../../../core/services/product.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { Product } from '../../../../models/product.model';

@Component({
  selector: 'app-imei-prompt-dialog',
  imports: [FormsModule, DialogModule, ButtonModule, InputTextModule, BarcodeScannerComponent],
  templateUrl: './imei-prompt-dialog.component.html',
  styleUrls: ['./imei-prompt-dialog.component.scss']
})
export class ImeiPromptDialogComponent {
  product = input<Product | null>(null);
  visible = input<boolean>(false);
  visibleChange = output<boolean>();
  imeiProvided = output<string>();
  imeiSkipped = output<void>();

  imeiValue = '';
  saving = signal(false);
  skipConfirming = false;

  constructor(
    private productService: ProductService,
    private toastService: ToastService
  ) {}

  onBarcodeScan(result: any): void {
    if (result?.rawValue) {
      this.imeiValue = result.rawValue;
    }
  }

  async onSave(): Promise<void> {
    const trimmed = this.imeiValue.trim();
    if (!trimmed) return;

    const p = this.product();
    if (!p) return;

    this.saving.set(true);
    try {
      await this.productService.updateProduct(p.id, { imei: trimmed });
      this.imeiProvided.emit(trimmed);
      this.visibleChange.emit(false);
      this.imeiValue = '';
      this.skipConfirming = false;
    } catch (error) {
      this.toastService.error('Error', 'Failed to save IMEI');
    } finally {
      this.saving.set(false);
    }
  }

  onSkip(): void {
    if (!this.skipConfirming) {
      this.skipConfirming = true;
      return;
    }
    this.imeiSkipped.emit();
    this.visibleChange.emit(false);
    this.imeiValue = '';
    this.skipConfirming = false;
  }

  onDialogHide(): void {
    this.imeiValue = '';
    this.skipConfirming = false;
  }
}
