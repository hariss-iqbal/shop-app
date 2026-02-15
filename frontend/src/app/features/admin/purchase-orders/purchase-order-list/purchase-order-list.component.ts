import { Component, OnInit, signal, computed } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule, DatePipe } from '@angular/common';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { SkeletonModule } from 'primeng/skeleton';

import { PurchaseOrderService, PurchaseOrderSummary } from '../../../../core/services/purchase-order.service';
import { SupplierService } from '../../../../core/services/supplier.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { PurchaseOrder, PurchaseOrderFilter } from '../../../../models/purchase-order.model';
import { Supplier } from '../../../../models/supplier.model';
import { PurchaseOrderStatus, PurchaseOrderStatusLabels, PurchaseOrderStatusColors } from '../../../../enums';
import { AppCurrencyPipe } from '../../../../shared/pipes/app-currency.pipe';

interface StatusOption {
  label: string;
  value: PurchaseOrderStatus | null;
}

interface SupplierOption {
  label: string;
  value: string | null;
}

@Component({
  selector: 'app-purchase-order-list',
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    CardModule,
    ButtonModule,
    TableModule,
    SelectModule,
    TagModule,
    TooltipModule,
    SkeletonModule,
    DatePipe,
    AppCurrencyPipe
  ],
  templateUrl: './purchase-order-list.component.html',
  styleUrls: ['./purchase-order-list.component.scss']
})
export class PurchaseOrderListComponent implements OnInit {
  constructor(
    private purchaseOrderService: PurchaseOrderService,
    private supplierService: SupplierService,
    private toastService: ToastService,
    private router: Router
  ) { }

  purchaseOrders = signal<PurchaseOrder[]>([]);
  suppliers = signal<Supplier[]>([]);
  summary = signal<PurchaseOrderSummary | null>(null);
  loading = signal(false);
  readonly skeletonRows = Array(5).fill({});

  selectedStatus: PurchaseOrderStatus | null = null;
  selectedSupplierId: string | null = null;

  statusOptions: StatusOption[] = [
    { label: 'All Statuses', value: null },
    { label: PurchaseOrderStatusLabels[PurchaseOrderStatus.PENDING], value: PurchaseOrderStatus.PENDING },
    { label: PurchaseOrderStatusLabels[PurchaseOrderStatus.RECEIVED], value: PurchaseOrderStatus.RECEIVED },
    { label: PurchaseOrderStatusLabels[PurchaseOrderStatus.CANCELLED], value: PurchaseOrderStatus.CANCELLED }
  ];

  supplierOptions = computed(() => {
    const options: SupplierOption[] = [
      { label: 'All Suppliers', value: null }
    ];
    this.suppliers().forEach(supplier => {
      options.push({ label: supplier.name, value: supplier.id });
    });
    return options;
  });

  ngOnInit(): void {
    this.loadData();
  }

  async loadData(): Promise<void> {
    this.loading.set(true);

    try {
      await Promise.all([
        this.loadPurchaseOrders(),
        this.loadSuppliers(),
        this.loadSummary()
      ]);
    } catch (error) {
      this.toastService.error('Error', 'Failed to load data');
      console.error('Failed to load data:', error);
    } finally {
      this.loading.set(false);
    }
  }

  async loadPurchaseOrders(): Promise<void> {
    const filter: PurchaseOrderFilter = {};

    if (this.selectedStatus) {
      filter.status = this.selectedStatus;
    }

    if (this.selectedSupplierId) {
      filter.supplierId = this.selectedSupplierId;
    }

    const response = await this.purchaseOrderService.getPurchaseOrders(filter);
    this.purchaseOrders.set(response.data);
  }

  async loadSuppliers(): Promise<void> {
    const response = await this.supplierService.getSuppliers();
    this.suppliers.set(response.data);
  }

  async loadSummary(): Promise<void> {
    const summary = await this.purchaseOrderService.getSummary();
    this.summary.set(summary);
  }

  async onFilterChange(): Promise<void> {
    this.loading.set(true);
    try {
      await this.loadPurchaseOrders();
    } catch (error) {
      this.toastService.error('Error', 'Failed to load purchase orders');
    } finally {
      this.loading.set(false);
    }
  }

  hasActiveFilters(): boolean {
    return this.selectedStatus !== null || this.selectedSupplierId !== null;
  }

  async clearFilters(): Promise<void> {
    this.selectedStatus = null;
    this.selectedSupplierId = null;
    this.loading.set(true);
    try {
      await this.loadPurchaseOrders();
    } catch (error) {
      this.toastService.error('Error', 'Failed to load purchase orders');
    } finally {
      this.loading.set(false);
    }
  }

  getStatusLabel(status: PurchaseOrderStatus): string {
    return PurchaseOrderStatusLabels[status];
  }

  getStatusSeverity(status: PurchaseOrderStatus): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' | undefined {
    const colorMap: Record<string, 'success' | 'warn' | 'danger'> = {
      success: 'success',
      warning: 'warn',
      danger: 'danger'
    };
    const color = PurchaseOrderStatusColors[status];
    return colorMap[color] || 'info';
  }

  onViewDetails(po: PurchaseOrder): void {
    this.router.navigate(['/admin/purchase-orders', po.id]);
  }
}
