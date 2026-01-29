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
  template: `
    <p-dialog
      header="Stock Alert Settings"
      [visible]="visible()"
      (visibleChange)="onVisibleChange($event)"
      (onShow)="onDialogShow()"
      (onHide)="onDialogHide()"
      [modal]="true"
      [closable]="true"
      [focusOnShow]="true"
      [focusTrap]="true"
      [closeOnEscape]="true"
      [style]="{ width: '450px' }"
      [breakpoints]="{ '575px': '95vw' }"
      role="dialog"
      aria-label="Stock Alert Settings"
    >
      <div class="flex flex-column gap-4 pt-2">
        <div class="flex flex-column gap-2">
          <p-floatlabel variant="on">
            <p-inputNumber
              id="lowStockThreshold"
              [(ngModel)]="lowStockThreshold"
              [min]="0"
              [showButtons]="true"
              [step]="1"
              styleClass="w-full"
            />
            <label for="lowStockThreshold">Low Stock Threshold</label>
          </p-floatlabel>
          <small class="text-color-secondary">
            A warning alert will display when total available stock falls below this number.
          </small>
        </div>

        <div class="flex align-items-center justify-content-between gap-3 p-3 border-round surface-ground">
          <div class="flex flex-column gap-1">
            <span class="font-medium text-color">Brand Zero Stock Alert</span>
            <small class="text-color-secondary">
              Show an alert for each brand that has zero available stock.
            </small>
          </div>
          <p-toggleSwitch
            [(ngModel)]="enableBrandZeroAlert"
            inputId="enableBrandZeroAlert"
            ariaLabel="Enable brand zero stock alerts"
          />
        </div>
      </div>

      <ng-template #footer>
        <div class="flex justify-content-end gap-2">
          <p-button
            label="Cancel"
            severity="secondary"
            [text]="true"
            (onClick)="onCancel()"
            ariaLabel="Cancel changes"
          />
          <p-button
            label="Save"
            icon="pi pi-check"
            (onClick)="onSave()"
            [loading]="saving()"
            ariaLabel="Save alert settings"
          />
        </div>
      </ng-template>
    </p-dialog>
  `
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

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['config'] || changes['visible']) {
      const c = this.config();
      if (c && this.visible()) {
        this.lowStockThreshold = c.lowStockThreshold;
        this.enableBrandZeroAlert = c.enableBrandZeroAlert;
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
        enableBrandZeroAlert: this.enableBrandZeroAlert
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
