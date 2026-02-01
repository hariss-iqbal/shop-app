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
  templateUrl: './stock-alerts-panel.component.html'
})
export class StockAlertsPanelComponent {
  alerts = input<StockAlert[]>([]);
  config = input<StockAlertConfig | null>(null);
  loading = input<boolean>(false);
  configureClicked = output<void>();
}
