import { Component, OnInit, signal } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { AppCurrencyPipe } from '../../../../shared/pipes/app-currency.pipe';
import { ActivatedRoute, Router } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TableModule } from 'primeng/table';
import { DividerModule } from 'primeng/divider';
import { SkeletonModule } from 'primeng/skeleton';
import { TooltipModule } from 'primeng/tooltip';
import { PurchaseOrderService } from '../../../../core/services/purchase-order.service';
import { PurchaseOrder } from '../../../../models/purchase-order.model';
import {
  PurchaseOrderStatus,
  PurchaseOrderStatusLabels,
  PurchaseOrderStatusColors
} from '../../../../enums';
import { ToastService } from '../../../../shared/services/toast.service';
import { ConfirmDialogService } from '../../../../shared/services/confirmation.service';
import { PurchaseOrderReceivingComponent } from '../purchase-order-receiving/purchase-order-receiving.component';

@Component({
  selector: 'app-purchase-order-detail',
  imports: [
    CommonModule,
    CardModule,
    ButtonModule,
    TagModule,
    TableModule,
    DividerModule,
    SkeletonModule,
    TooltipModule,
    AppCurrencyPipe,
    PurchaseOrderReceivingComponent
  ],
  templateUrl: './purchase-order-detail.component.html',
  styleUrls: ['./purchase-order-detail.component.scss']
})
export class PurchaseOrderDetailComponent implements OnInit {
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private location: Location,
    private purchaseOrderService: PurchaseOrderService,
    private toastService: ToastService,
    private confirmDialogService: ConfirmDialogService
  ) { }

  purchaseOrder = signal<PurchaseOrder | null>(null);
  loading = signal(true);
  notFound = signal(false);
  actionLoading = signal(false);
  showReceivingDialog = signal(false);

  ngOnInit(): void {
    const poId = this.route.snapshot.paramMap.get('id');
    if (poId) {
      this.loadPurchaseOrder(poId);
    } else {
      this.notFound.set(true);
      this.loading.set(false);
    }
  }

  private async loadPurchaseOrder(id: string): Promise<void> {
    this.loading.set(true);
    this.notFound.set(false);

    try {
      const po = await this.purchaseOrderService.getPurchaseOrderById(id);

      if (!po) {
        this.notFound.set(true);
        return;
      }

      this.purchaseOrder.set(po);
    } catch (error) {
      console.error('Failed to load purchase order:', error);
      this.notFound.set(true);
      this.toastService.error('Error', 'Failed to load purchase order details');
    } finally {
      this.loading.set(false);
    }
  }

  isPending(): boolean {
    return this.purchaseOrder()?.status === PurchaseOrderStatus.PENDING;
  }

  isReceived(): boolean {
    return this.purchaseOrder()?.status === PurchaseOrderStatus.RECEIVED;
  }

  isCancelled(): boolean {
    return this.purchaseOrder()?.status === PurchaseOrderStatus.CANCELLED;
  }

  getStatusLabel(status: PurchaseOrderStatus): string {
    return PurchaseOrderStatusLabels[status];
  }

  getStatusSeverity(status: PurchaseOrderStatus): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' {
    const colorMap: Record<string, 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast'> = {
      'warning': 'warn',
      'success': 'success',
      'danger': 'danger'
    };
    return colorMap[PurchaseOrderStatusColors[status]] || 'secondary';
  }

  getTotalUnits(): number {
    const po = this.purchaseOrder();
    if (!po) return 0;
    return po.items.reduce((sum, item) => sum + item.quantity, 0);
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  formatDateTime(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  openReceivingDialog(): void {
    this.showReceivingDialog.set(true);
  }

  onReceivingDialogClosed(): void {
    this.showReceivingDialog.set(false);
  }

  async onOrderReceived(_event: { productsCreated: number }): Promise<void> {
    this.showReceivingDialog.set(false);

    const po = this.purchaseOrder();
    if (po) {
      const updatedPo = await this.purchaseOrderService.getPurchaseOrderById(po.id);
      if (updatedPo) {
        this.purchaseOrder.set(updatedPo);
      }
    }
  }

  async cancelOrder(): Promise<void> {
    const po = this.purchaseOrder();
    if (!po) return;

    const confirmed = await this.confirmDialogService.confirm({
      header: 'Cancel Purchase Order',
      message: `Are you sure you want to cancel purchase order <strong>${po.poNumber}</strong> from <strong>${po.supplierName}</strong>?<br/><br/>` +
        `This action is <strong>irreversible</strong>. Once cancelled, this purchase order cannot be received or modified.`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Cancel Order',
      rejectLabel: 'Keep Order',
      acceptButtonStyleClass: 'p-button-danger'
    });

    if (!confirmed) return;

    this.actionLoading.set(true);

    try {
      const updatedPo = await this.purchaseOrderService.cancelPurchaseOrder(po.id);
      this.purchaseOrder.set(updatedPo);
      this.toastService.success('Success', `Purchase order ${po.poNumber} has been cancelled`);
    } catch (error) {
      console.error('Failed to cancel order:', error);
      this.toastService.error('Error', 'Failed to cancel purchase order');
    } finally {
      this.actionLoading.set(false);
    }
  }

  goBackToList(): void {
    if (window.history.length > 1) {
      this.location.back();
    } else {
      this.router.navigate(['/admin/purchase-orders']);
    }
  }

  navigateToInventory(): void {
    this.router.navigate(['/admin/inventory']);
  }
}
