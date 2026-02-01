import { Component, inject, input, output, signal, OnChanges, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { FloatLabelModule } from 'primeng/floatlabel';
import { StockAlertService } from '../../../../core/services/stock-alert.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { FocusManagementService } from '../../../../shared/services/focus-management.service';
import { StockAlertConfig } from '../../../../models/stock-alert-config.model';

@Component({
  selector: 'app-stock-alert-config-dialog',
  imports: [
    FormsModule,
    DialogModule,
    ButtonModule,
    InputNumberModule,
    ToggleSwitchModule,
    FloatLabelModule
  ],
  templateUrl: './stock-alert-config-dialog.component.html'
})
export class StockAlertConfigDialogComponent implements OnChanges {
  private stockAlertService = inject(StockAlertService);
  private toastService = inject(ToastService);
  private focusService = inject(FocusManagementService);

  visible = input<boolean>(false);
  config = input<StockAlertConfig | null>(null);
  visibleChange = output<boolean>();
  configSaved = output<void>();

  saving = signal(false);

  lowStockThreshold: number | null = 5;
  enableBrandZeroAlert = true;
  allowOversell = true;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['config'] || changes['visible']) {
      const c = this.config();
      if (c && this.visible()) {
        this.lowStockThreshold = c.lowStockThreshold;
        this.enableBrandZeroAlert = c.enableBrandZeroAlert;
        this.allowOversell = c.allowOversell;
      }
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

  onCancel(): void {
    this.visibleChange.emit(false);
  }

  async onSave(): Promise<void> {
    this.saving.set(true);

    try {
      await this.stockAlertService.updateConfig({
        lowStockThreshold: this.lowStockThreshold ?? 0,
        enableBrandZeroAlert: this.enableBrandZeroAlert,
        allowOversell: this.allowOversell
      });

      this.toastService.success('Settings Saved', 'Stock alert thresholds updated');
      this.visibleChange.emit(false);
      this.configSaved.emit();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save settings';
      this.toastService.error('Error', message);
    } finally {
      this.saving.set(false);
    }
  }
}
