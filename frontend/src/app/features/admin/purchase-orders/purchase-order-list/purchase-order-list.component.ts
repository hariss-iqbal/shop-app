import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
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
    CurrencyPipe,
    DatePipe
  ],
  template: `
    <div class="grid">
      <div class="col-12 flex flex-column sm:flex-row sm:align-items-center sm:justify-content-between gap-3 mb-4">
        <h1 class="text-3xl font-bold m-0">Purchase Orders</h1>
        <p-button label="New Purchase Order" icon="pi pi-plus" routerLink="/admin/purchase-orders/new" styleClass="w-full sm:w-auto" />
      </div>

      <!-- Summary Statistics -->
      <div class="col-12 mb-4">
        <div class="grid">
          <div class="col-12 md:col-6 lg:col-3">
            <p-card styleClass="h-full">
              @if (loading()) {
                <div class="flex align-items-center justify-content-between">
                  <div class="flex-1">
                    <p-skeleton width="60%" styleClass="mb-2" />
                    <p-skeleton width="40%" height="2rem" />
                  </div>
                  <p-skeleton shape="circle" size="3rem" />
                </div>
              } @else {
                <div class="flex align-items-center justify-content-between">
                  <div>
                    <span class="block text-color-secondary mb-2">Total Orders</span>
                    <span class="text-3xl font-bold">{{ summary()?.totalOrders || 0 }}</span>
                  </div>
                  <div class="w-3rem h-3rem border-circle bg-blue-100 flex align-items-center justify-content-center">
                    <i class="pi pi-file text-blue-500 text-xl"></i>
                  </div>
                </div>
              }
            </p-card>
          </div>
          <div class="col-12 md:col-6 lg:col-3">
            <p-card styleClass="h-full">
              @if (loading()) {
                <div class="flex align-items-center justify-content-between">
                  <div class="flex-1">
                    <p-skeleton width="60%" styleClass="mb-2" />
                    <p-skeleton width="40%" height="2rem" />
                  </div>
                  <p-skeleton shape="circle" size="3rem" />
                </div>
              } @else {
                <div class="flex align-items-center justify-content-between">
                  <div>
                    <span class="block text-color-secondary mb-2">Pending</span>
                    <span class="text-3xl font-bold text-orange-500">{{ summary()?.pendingOrders || 0 }}</span>
                  </div>
                  <div class="w-3rem h-3rem border-circle bg-orange-100 flex align-items-center justify-content-center">
                    <i class="pi pi-clock text-orange-500 text-xl"></i>
                  </div>
                </div>
              }
            </p-card>
          </div>
          <div class="col-12 md:col-6 lg:col-3">
            <p-card styleClass="h-full">
              @if (loading()) {
                <div class="flex align-items-center justify-content-between">
                  <div class="flex-1">
                    <p-skeleton width="60%" styleClass="mb-2" />
                    <p-skeleton width="40%" height="2rem" />
                  </div>
                  <p-skeleton shape="circle" size="3rem" />
                </div>
              } @else {
                <div class="flex align-items-center justify-content-between">
                  <div>
                    <span class="block text-color-secondary mb-2">Received</span>
                    <span class="text-3xl font-bold text-green-500">{{ summary()?.receivedOrders || 0 }}</span>
                  </div>
                  <div class="w-3rem h-3rem border-circle bg-green-100 flex align-items-center justify-content-center">
                    <i class="pi pi-check text-green-500 text-xl"></i>
                  </div>
                </div>
              }
            </p-card>
          </div>
          <div class="col-12 md:col-6 lg:col-3">
            <p-card styleClass="h-full">
              @if (loading()) {
                <div class="flex align-items-center justify-content-between">
                  <div class="flex-1">
                    <p-skeleton width="60%" styleClass="mb-2" />
                    <p-skeleton width="40%" height="2rem" />
                  </div>
                  <p-skeleton shape="circle" size="3rem" />
                </div>
              } @else {
                <div class="flex align-items-center justify-content-between">
                  <div>
                    <span class="block text-color-secondary mb-2">Cancelled</span>
                    <span class="text-3xl font-bold text-red-500">{{ summary()?.cancelledOrders || 0 }}</span>
                  </div>
                  <div class="w-3rem h-3rem border-circle bg-red-100 flex align-items-center justify-content-center">
                    <i class="pi pi-times text-red-500 text-xl"></i>
                  </div>
                </div>
              }
            </p-card>
          </div>
        </div>
      </div>

      <!-- Purchase Orders Table -->
      <div class="col-12">
        <p-card>
          <!-- Filters -->
          <div class="flex flex-column md:flex-row md:align-items-center gap-3 mb-4">
            <div class="flex align-items-center gap-2">
              <label for="statusFilter" class="font-medium white-space-nowrap">Status:</label>
              <p-select
                id="statusFilter"
                [options]="statusOptions"
                [(ngModel)]="selectedStatus"
                (onChange)="onFilterChange()"
                optionLabel="label"
                optionValue="value"
                placeholder="All Statuses"
                styleClass="w-full md:w-12rem"
                [showClear]="true"
              />
            </div>
            <div class="flex align-items-center gap-2">
              <label for="supplierFilter" class="font-medium white-space-nowrap">Supplier:</label>
              <p-select
                id="supplierFilter"
                [options]="supplierOptions()"
                [(ngModel)]="selectedSupplierId"
                (onChange)="onFilterChange()"
                optionLabel="label"
                optionValue="value"
                placeholder="All Suppliers"
                styleClass="w-full md:w-15rem"
                [showClear]="true"
                [filter]="true"
                filterBy="label"
              />
            </div>
            @if (hasActiveFilters()) {
              <p-button
                label="Clear Filters"
                icon="pi pi-filter-slash"
                severity="secondary"
                [text]="true"
                (onClick)="clearFilters()"
              />
            }
          </div>

          <!-- Table -->
          <p-table
            [value]="purchaseOrders()"
            [loading]="loading()"
            [paginator]="true"
            [rows]="10"
            [rowsPerPageOptions]="[10, 25, 50]"
            [showCurrentPageReport]="true"
            currentPageReportTemplate="Showing {first} to {last} of {totalRecords} purchase orders"
            [rowHover]="true"
            dataKey="id"
            styleClass="p-datatable-sm"
            [sortField]="'orderDate'"
            [sortOrder]="-1"
            [scrollable]="true"
            scrollDirection="horizontal"
            [tableStyle]="{ 'min-width': '55rem' }"
          >
            <ng-template #header>
              <tr>
                <th pSortableColumn="poNumber" style="width: 10%">
                  PO Number
                  <p-sortIcon field="poNumber" />
                </th>
                <th pSortableColumn="supplierName" style="width: 20%">
                  Supplier
                  <p-sortIcon field="supplierName" />
                </th>
                <th pSortableColumn="orderDate" style="width: 15%">
                  Order Date
                  <p-sortIcon field="orderDate" />
                </th>
                <th pSortableColumn="totalAmount" style="width: 15%">
                  Total Amount
                  <p-sortIcon field="totalAmount" />
                </th>
                <th pSortableColumn="status" style="width: 12%">
                  Status
                  <p-sortIcon field="status" />
                </th>
                <th style="width: 10%">Items</th>
                <th style="width: 8%" alignFrozen="right" pFrozenColumn [frozen]="true">Actions</th>
              </tr>
            </ng-template>

            <ng-template #body let-po>
              <tr>
                <td>
                  <a
                    [routerLink]="['/admin/purchase-orders', po.id]"
                    class="font-medium text-primary hover:underline cursor-pointer"
                  >{{ po.poNumber }}</a>
                </td>
                <td>{{ po.supplierName }}</td>
                <td>{{ po.orderDate | date:'mediumDate' }}</td>
                <td>
                  <span class="font-medium">{{ po.totalAmount | currency:'USD':'symbol':'1.2-2' }}</span>
                </td>
                <td>
                  <p-tag
                    [value]="getStatusLabel(po.status)"
                    [severity]="getStatusSeverity(po.status)"
                  />
                </td>
                <td>
                  <span class="text-color-secondary">{{ po.items?.length || 0 }} item(s)</span>
                </td>
                <td alignFrozen="right" pFrozenColumn [frozen]="true">
                  <div class="flex align-items-center gap-1">
                    <p-button
                      icon="pi pi-eye"
                      [rounded]="true"
                      [text]="true"
                      severity="info"
                      size="small"
                      pTooltip="View Details"
                      tooltipPosition="top"
                      (onClick)="onViewDetails(po)"
                    />
                  </div>
                </td>
              </tr>
            </ng-template>

            <ng-template #emptymessage>
              <tr>
                <td colspan="7" class="text-center p-4">
                  <div class="flex flex-column align-items-center gap-3">
                    <i class="pi pi-file text-4xl text-color-secondary"></i>
                    @if (hasActiveFilters()) {
                      <span class="text-color-secondary">No purchase orders match the current filters</span>
                      <p-button
                        label="Clear Filters"
                        icon="pi pi-filter-slash"
                        severity="secondary"
                        (onClick)="clearFilters()"
                      />
                    } @else {
                      <span class="text-color-secondary">No purchase orders found</span>
                      <p-button
                        label="Create Your First Purchase Order"
                        icon="pi pi-plus"
                        routerLink="/admin/purchase-orders/new"
                      />
                    }
                  </div>
                </td>
              </tr>
            </ng-template>

            <ng-template #loadingbody>
              @for (_ of skeletonRows; track $index) {
                <tr>
                  <td><p-skeleton width="60%" /></td>
                  <td><p-skeleton width="70%" /></td>
                  <td><p-skeleton width="55%" /></td>
                  <td><p-skeleton width="50%" /></td>
                  <td><p-skeleton width="4rem" height="1.5rem" borderRadius="1rem" /></td>
                  <td><p-skeleton width="40%" /></td>
                  <td><p-skeleton shape="circle" size="2rem" /></td>
                </tr>
              }
            </ng-template>
          </p-table>
        </p-card>
      </div>
    </div>
  `
})
export class PurchaseOrderListComponent implements OnInit {
  private purchaseOrderService = inject(PurchaseOrderService);
  private supplierService = inject(SupplierService);
  private toastService = inject(ToastService);
  private router = inject(Router);

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
