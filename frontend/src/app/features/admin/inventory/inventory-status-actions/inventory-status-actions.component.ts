import { Component, inject, input, output, signal, effect } from '@angular/core';
import { MenuModule } from 'primeng/menu';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { MenuItem } from 'primeng/api';

import { PhoneService } from '../../../../core/services/phone.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { Phone } from '../../../../models/phone.model';
import { PhoneStatus, PhoneStatusLabels, PhoneStatusColors } from '../../../../enums/phone-status.enum';

@Component({
  selector: 'app-inventory-status-actions',
  imports: [
    MenuModule,
    ButtonModule,
    TagModule,
    TooltipModule
  ],
  templateUrl: './inventory-status-actions.component.html'
})
export class InventoryStatusActionsComponent {
  private phoneService = inject(PhoneService);
  private toastService = inject(ToastService);

  phone = input.required<Phone>();
  statusChanged = output<void>();
  markAsSoldRequested = output<Phone>();
  printLabelRequested = output<Phone>();

  updating = signal(false);
  menuItems = signal<MenuItem[]>([]);

  constructor() {
    effect(() => {
      const currentPhone = this.phone();
      this.buildMenuItems(currentPhone);
    });
  }

  getStatusLabel(status: PhoneStatus): string {
    return PhoneStatusLabels[status];
  }

  getStatusSeverity(status: PhoneStatus): 'success' | 'danger' | 'warn' | 'info' | 'secondary' | 'contrast' | undefined {
    const colorMap: Record<string, 'success' | 'danger' | 'warn'> = {
      success: 'success',
      danger: 'danger',
      warning: 'warn'
    };
    return colorMap[PhoneStatusColors[status]];
  }

  private buildMenuItems(currentPhone: Phone): void {
    const items: MenuItem[] = [];

    if (currentPhone.status !== PhoneStatus.AVAILABLE) {
      items.push({
        label: 'Mark as Available',
        icon: 'pi pi-check-circle',
        command: () => this.onQuickStatusChange(PhoneStatus.AVAILABLE)
      });
    }

    if (currentPhone.status !== PhoneStatus.RESERVED) {
      items.push({
        label: 'Mark as Reserved',
        icon: 'pi pi-bookmark',
        command: () => this.onQuickStatusChange(PhoneStatus.RESERVED)
      });
    }

    if (currentPhone.status !== PhoneStatus.SOLD) {
      items.push({
        separator: true
      });
      items.push({
        label: 'Mark as Sold',
        icon: 'pi pi-dollar',
        command: () => this.onMarkAsSold()
      });
    }

    items.push({
      separator: true
    });
    items.push({
      label: 'Print Label',
      icon: 'pi pi-print',
      command: () => this.onPrintLabel()
    });

    this.menuItems.set(items);
  }

  private async onQuickStatusChange(newStatus: PhoneStatus): Promise<void> {
    const currentPhone = this.phone();
    this.updating.set(true);

    try {
      await this.phoneService.updatePhoneStatus(currentPhone.id, newStatus);
      const statusLabel = PhoneStatusLabels[newStatus];
      this.toastService.success(
        'Status Updated',
        `${currentPhone.brandName} ${currentPhone.model} is now ${statusLabel}`
      );
      this.statusChanged.emit();
    } catch (error) {
      this.toastService.error('Error', 'Failed to update phone status');
      console.error('Failed to update phone status:', error);
    } finally {
      this.updating.set(false);
    }
  }

  private onMarkAsSold(): void {
    this.markAsSoldRequested.emit(this.phone());
  }

  private onPrintLabel(): void {
    this.printLabelRequested.emit(this.phone());
  }
}
