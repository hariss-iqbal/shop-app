import { Component, input, output, signal, effect } from '@angular/core';
import { MenuModule } from 'primeng/menu';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { MenuItem } from 'primeng/api';

import { ProductService } from '../../../../core/services/product.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { Product } from '../../../../models/product.model';
import { ProductStatus, ProductStatusLabels, ProductStatusColors } from '../../../../enums/product-status.enum';

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

  product = input.required<Product>();
  statusChanged = output<void>();
  markAsSoldRequested = output<Product>();
  printLabelRequested = output<Product>();

  updating = signal(false);
  menuItems = signal<MenuItem[]>([]);

  constructor(
    private productService: ProductService,
    private toastService: ToastService
  ) {
    effect(() => {
      const currentProduct = this.product();
      this.buildMenuItems(currentProduct);
    });
  }

  getStatusLabel(status: ProductStatus): string {
    return ProductStatusLabels[status];
  }

  getStatusSeverity(status: ProductStatus): 'success' | 'danger' | 'warn' | 'info' | 'secondary' | 'contrast' | undefined {
    const colorMap: Record<string, 'success' | 'danger' | 'warn'> = {
      success: 'success',
      danger: 'danger',
      warning: 'warn'
    };
    return colorMap[ProductStatusColors[status]];
  }

  private buildMenuItems(currentProduct: Product): void {
    const items: MenuItem[] = [];

    if (currentProduct.status !== ProductStatus.AVAILABLE) {
      items.push({
        label: 'Mark as Available',
        icon: 'pi pi-check-circle',
        command: () => this.onQuickStatusChange(ProductStatus.AVAILABLE)
      });
    }

    if (currentProduct.status !== ProductStatus.RESERVED) {
      items.push({
        label: 'Mark as Reserved',
        icon: 'pi pi-bookmark',
        command: () => this.onQuickStatusChange(ProductStatus.RESERVED)
      });
    }

    if (currentProduct.status !== ProductStatus.SOLD) {
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

  private async onQuickStatusChange(newStatus: ProductStatus): Promise<void> {
    const currentProduct = this.product();
    this.updating.set(true);

    try {
      await this.productService.updateProductStatus(currentProduct.id, newStatus);
      const statusLabel = ProductStatusLabels[newStatus];
      this.toastService.success(
        'Status Updated',
        `${currentProduct.brandName} ${currentProduct.model} is now ${statusLabel}`
      );
      this.statusChanged.emit();
    } catch (error) {
      this.toastService.error('Error', 'Failed to update product status');
      console.error('Failed to update product status:', error);
    } finally {
      this.updating.set(false);
    }
  }

  private onMarkAsSold(): void {
    this.markAsSoldRequested.emit(this.product());
  }

  private onPrintLabel(): void {
    this.printLabelRequested.emit(this.product());
  }
}
