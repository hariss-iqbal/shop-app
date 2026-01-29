import { Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { SkeletonModule } from 'primeng/skeleton';
import { TooltipModule } from 'primeng/tooltip';
import { StockAlert, StockAlertConfig } from '../../../../models/stock-alert-config.model';

@Component({
  selector: 'app-stock-alerts-panel',
  imports: [
    RouterLink,
    ButtonModule,
    MessageModule,
    SkeletonModule,
    TooltipModule
  ],
  template: `
    @if (loading()) {
      <div class="flex flex-column gap-2 mb-4">
        <p-skeleton width="100%" height="3rem" />
      </div>
    } @else if (alerts().length > 0) {
      <div class="flex flex-column gap-2 mb-4" role="region" aria-label="Stock alerts">
        <div class="flex align-items-center justify-content-between mb-1">
          <div class="flex align-items-center gap-2">
            <i class="pi pi-exclamation-triangle text-orange-500 text-xl" aria-hidden="true"></i>
            <span class="font-semibold text-color text-lg">Stock Alerts</span>
            <span class="text-sm text-color-secondary">({{ alerts().length }})</span>
          </div>
          <p-button
            icon="pi pi-cog"
            [rounded]="true"
            [text]="true"
            severity="secondary"
            (onClick)="configureClicked.emit()"
            pTooltip="Configure alert thresholds"
            ariaLabel="Configure stock alert thresholds"
          />
        </div>

        @for (alert of alerts(); track alert.message) {
          <p-message
            [severity]="alert.type === 'low_stock' ? 'warn' : 'error'"
            styleClass="w-full"
          >
            <div class="flex align-items-center justify-content-between w-full gap-3 flex-wrap">
              <div class="flex align-items-center gap-2 flex-1 min-w-0">
                <i [class]="alert.type === 'low_stock' ? 'pi pi-exclamation-triangle' : 'pi pi-times-circle'" aria-hidden="true"></i>
                <span class="line-height-3">{{ alert.message }}</span>
              </div>
              <a
                routerLink="/admin/purchase-orders/new"
                class="p-button p-button-sm p-button-outlined no-underline white-space-nowrap flex-shrink-0"
                [attr.aria-label]="'Create purchase order to restock ' + (alert.brandName || 'inventory')"
              >
                <i class="pi pi-plus mr-1" aria-hidden="true"></i>
                Create Order
              </a>
            </div>
          </p-message>
        }
      </div>
    }
  `
})
export class StockAlertsPanelComponent {
  alerts = input<StockAlert[]>([]);
  config = input<StockAlertConfig | null>(null);
  loading = input<boolean>(false);
  configureClicked = output<void>();
}
